import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { google } from 'googleapis';
import 'dotenv/config';
import { query } from '../config/db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCOPES = [
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/yt-analytics.readonly',
];

function findClientSecretPath() {
  const base = join(__dirname, '..', '..');
  // Accept the standard downloaded filename pattern.
  try {
    const files = readdirSync(base).filter((f) =>
      /^client_secret_\d+-[a-z0-9]+\.apps\.googleusercontent\.com\.json$/.test(f)
    );
    if (files[0]) return join(base, files[0]);
  } catch { /* ignore */ }
  return join(base, 'client_secret.json');
}

function loadClientSecret() {
  const path = process.env.GOOGLE_CLIENT_SECRET_PATH || findClientSecretPath();
  try {
    const raw = readFileSync(path, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed.web || parsed.installed || parsed;
  } catch (err) {
    console.error(`[youtube] cannot load client secret from ${path}: ${err.message}`);
    throw new Error('Google client secret not found');
  }
}

function getConfig() {
  const secret = loadClientSecret();
  const clientId = process.env.GOOGLE_CLIENT_ID || secret.client_id;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || secret.client_secret;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_REDIRECT_URI are required');
  }
  return { clientId, clientSecret, redirectUri, projectId: process.env.GOOGLE_PROJECT_ID };
}

export function getOAuth2Client() {
  const { clientId, clientSecret, redirectUri } = getConfig();
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/** URL to redirect the browser to for "Connect YouTube". */
export function getAuthUrl() {
  const oauth2 = getOAuth2Client();
  return oauth2.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
    include_granted_scopes: true,
  });
}

/** Exchange the OAuth callback code for tokens and upsert the account. */
export async function exchangeCodeForToken(code) {
  const oauth2 = getOAuth2Client();
  const { tokens } = await oauth2.getToken(code);
  if (!tokens.refresh_token) {
    throw new Error('Google did not return a refresh token. Reconnect with prompt=consent.');
  }
  oauth2.setCredentials(tokens);

  const youtube = google.youtube({ version: 'v3', auth: oauth2 });
  const { data } = await youtube.channels.list({ part: 'snippet,statistics,contentDetails', mine: true });
  const channel = data.items?.[0];
  if (!channel?.id) throw new Error('No YouTube channel found for this account');

  const expiresAt = tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(Date.now() + 3600 * 1000);
  const { rows } = await query(
    `INSERT INTO youtube_accounts (youtube_channel_id, channel_title, access_token, refresh_token, expires_at)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (youtube_channel_id) DO UPDATE SET
       channel_title = COALESCE(EXCLUDED.channel_title, youtube_accounts.channel_title),
       access_token = EXCLUDED.access_token,
       refresh_token = EXCLUDED.refresh_token,
       expires_at = EXCLUDED.expires_at,
       connected_at = now()
     RETURNING id`,
    [
      channel.id,
      channel.snippet?.title || null,
      tokens.access_token,
      tokens.refresh_token,
      expiresAt,
    ]
  );

  return {
    accountId: rows[0].id,
    channelId: channel.id,
    channelTitle: channel.snippet?.title || 'YouTube channel',
    expiresAt,
  };
}

// ---------- account management ----------

export async function listAccounts() {
  const { rows } = await query(
    `SELECT id, youtube_channel_id, channel_title, expires_at, connected_at FROM youtube_accounts ORDER BY id`
  );
  return rows;
}

export async function getAccount(id) {
  const { rows } = await query(`SELECT * FROM youtube_accounts WHERE id = $1`, [id]);
  return rows[0] || null;
}

export async function getFirstAccountId() {
  const { rows } = await query(`SELECT MIN(id) AS id FROM youtube_accounts`);
  return rows[0]?.id ?? null;
}

export async function deleteAccount(id) {
  await query(`DELETE FROM youtube_accounts WHERE id = $1`, [id]);
}

// ---------- token refresh ----------

export async function ensureFreshToken(accountId) {
  const account = await getAccount(accountId);
  if (!account) throw new Error('YouTube account not found');
  const msLeft = new Date(account.expires_at) - Date.now();
  if (msLeft > 5 * 60 * 1000) return account; // still valid for >5 min

  const oauth2 = getOAuth2Client();
  oauth2.setCredentials({ refresh_token: account.refresh_token });
  const { credentials } = await oauth2.refreshAccessToken();
  const expiresAt = credentials.expiry_date ? new Date(credentials.expiry_date) : new Date(Date.now() + 3600 * 1000);

  await query(
    `UPDATE youtube_accounts SET access_token = $1, expires_at = $2 WHERE id = $3`,
    [credentials.access_token, expiresAt, accountId]
  );
  return { ...account, access_token: credentials.access_token, expires_at: expiresAt };
}

async function getAuthClientForAccount(accountId) {
  const account = await ensureFreshToken(accountId);
  const oauth2 = getOAuth2Client();
  oauth2.setCredentials({ access_token: account.access_token, refresh_token: account.refresh_token });
  return oauth2;
}

// ---------- data fetching ----------

export async function fetchChannel(accountId) {
  const auth = await getAuthClientForAccount(accountId);
  const youtube = google.youtube({ version: 'v3', auth });
  const { data } = await youtube.channels.list({ part: 'snippet,statistics,contentDetails', mine: true });
  const channel = data.items?.[0];
  if (!channel) throw new Error('No YouTube channel found');

  const stats = channel.statistics || {};
  await query(
    `INSERT INTO youtube_account_snapshots (account_id, snapshot_date, subscriber_count, view_count, video_count)
     VALUES ($1, CURRENT_DATE, $2, $3, $4)
     ON CONFLICT (account_id, snapshot_date) DO UPDATE SET
       subscriber_count = EXCLUDED.subscriber_count,
       view_count = EXCLUDED.view_count,
       video_count = EXCLUDED.video_count`,
    [accountId, numOrNull(stats.subscriberCount), numOrNull(stats.viewCount), numOrNull(stats.videoCount)]
  );

  return {
    channelId: channel.id,
    title: channel.snippet?.title,
    subscriberCount: numOrNull(stats.subscriberCount),
    viewCount: numOrNull(stats.viewCount),
    videoCount: numOrNull(stats.videoCount),
  };
}

function numOrNull(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** ISO 8601 duration like PT1M30S → seconds. */
function durationToSeconds(dur) {
  if (!dur) return null;
  const m = dur.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return null;
  const h = Number(m[1] || 0);
  const min = Number(m[2] || 0);
  const s = Number(m[3] || 0);
  return h * 3600 + min * 60 + s;
}

async function searchMineVideos(auth, videoDuration, pageToken) {
  const youtube = google.youtube({ version: 'v3', auth });
  const { data } = await youtube.search.list({
    part: 'snippet',
    forMine: true,
    type: 'video',
    videoDuration,
    maxResults: 50,
    order: 'date',
    pageToken,
  });
  return { items: data.items || [], nextPageToken: data.nextPageToken };
}

async function fetchVideoDetails(auth, videoIds) {
  if (!videoIds.length) return [];
  const youtube = google.youtube({ version: 'v3', auth });
  const chunks = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    chunks.push(videoIds.slice(i, i + 50));
  }
  const results = [];
  for (const chunk of chunks) {
    const { data } = await youtube.videos.list({
      part: 'snippet,statistics,contentDetails,status',
      id: chunk.join(','),
    });
    results.push(...(data.items || []));
  }
  return results;
}

async function fetchVideosForDuration(accountId, videoDuration, markShort) {
  const auth = await getAuthClientForAccount(accountId);
  const allSearch = [];
  let pageToken;
  do {
    const page = await searchMineVideos(auth, videoDuration, pageToken);
    allSearch.push(...page.items);
    pageToken = page.nextPageToken;
  } while (pageToken && allSearch.length < 2000);

  const ids = allSearch.map((item) => item.id?.videoId).filter(Boolean);
  const details = await fetchVideoDetails(auth, ids);

  return details.map((v) => {
    const snippet = v.snippet || {};
    const stats = v.statistics || {};
    const content = v.contentDetails || {};
    const duration = durationToSeconds(content.duration);
    return {
      id: v.id,
      title: snippet.title,
      description: snippet.description,
      thumbnail_url: snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || null,
      video_url: `https://www.youtube.com/watch?v=${v.id}`,
      duration_seconds: duration,
      is_short: markShort,
      privacy_status: v.status?.privacyStatus || null,
      published_at: snippet.publishedAt ? new Date(snippet.publishedAt) : null,
      view_count: numOrNull(stats.viewCount),
      like_count: numOrNull(stats.likeCount),
      comment_count: numOrNull(stats.commentCount),
      raw: v,
    };
  });
}

export async function fetchVideos(accountId) {
  return fetchVideosForDuration(accountId, undefined, false);
}

export async function fetchShorts(accountId) {
  return fetchVideosForDuration(accountId, 'short', true);
}

/** Upsert a batch of videos into the DB and append metric snapshots. */
export async function storeVideos(accountId, videos) {
  for (const v of videos) {
    await query(
      `INSERT INTO youtube_videos (id, account_id, title, description, thumbnail_url, video_url,
                                  duration_seconds, is_short, privacy_status, published_at,
                                  view_count, like_count, comment_count, raw, synced_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14, now())
       ON CONFLICT (id) DO UPDATE SET
         account_id = EXCLUDED.account_id,
         title = EXCLUDED.title,
         description = EXCLUDED.description,
         thumbnail_url = EXCLUDED.thumbnail_url,
         video_url = EXCLUDED.video_url,
         duration_seconds = EXCLUDED.duration_seconds,
         is_short = EXCLUDED.is_short,
         privacy_status = EXCLUDED.privacy_status,
         published_at = EXCLUDED.published_at,
         view_count = COALESCE(EXCLUDED.view_count, youtube_videos.view_count),
         like_count = COALESCE(EXCLUDED.like_count, youtube_videos.like_count),
         comment_count = COALESCE(EXCLUDED.comment_count, youtube_videos.comment_count),
         raw = EXCLUDED.raw,
         synced_at = now()`,
      [
        v.id,
        accountId,
        v.title ?? null,
        v.description ?? null,
        v.thumbnail_url,
        v.video_url,
        v.duration_seconds,
        v.is_short,
        v.privacy_status,
        v.published_at,
        v.view_count,
        v.like_count,
        v.comment_count,
        JSON.stringify(v.raw),
      ]
    );

    // Append snapshots once per day per metric, like Instagram does.
    for (const [metric, value] of Object.entries({
      views: v.view_count,
      likes: v.like_count,
      comments: v.comment_count,
    })) {
      if (value == null) continue;
      await query(
        `INSERT INTO youtube_video_snapshots (video_id, metric, value)
         SELECT $1, $2, $3
         WHERE NOT EXISTS (
           SELECT 1 FROM youtube_video_snapshots
           WHERE video_id = $1 AND metric = $2 AND recorded_at > now() - interval '20 hours'
         )`,
        [v.id, metric, value]
      );
    }
  }
  return videos.length;
}

/** Fetch daily per-video metrics from YouTube Analytics API and store snapshots. */
export async function fetchVideoAnalytics(accountId, daysBack = 30) {
  const account = await ensureFreshToken(accountId);
  const oauth2 = getOAuth2Client();
  oauth2.setCredentials({ access_token: account.access_token, refresh_token: account.refresh_token });
  const analytics = google.youtubeAnalytics({ version: 'v2', auth: oauth2 });

  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - daysBack);
  const fmt = (d) => d.toISOString().split('T')[0];

  const { data } = await analytics.reports.query({
    ids: 'channel==MINE',
    startDate: fmt(start),
    endDate: fmt(end),
    metrics: 'views,likes,comments,shares,averageViewDuration,estimatedMinutesWatched',
    dimensions: 'video,day',
    sort: 'video,day',
  });

  const rows = data.rows || [];
  const headers = (data.columnHeaders || []).map((h) => h.name);
  const videoIdx = headers.indexOf('video');
  const dayIdx = headers.indexOf('day');
  const metricIdx = {
    views: headers.indexOf('views'),
    likes: headers.indexOf('likes'),
    comments: headers.indexOf('comments'),
    shares: headers.indexOf('shares'),
    averageViewDuration: headers.indexOf('averageViewDuration'),
    estimatedMinutesWatched: headers.indexOf('estimatedMinutesWatched'),
  };

  let inserted = 0;
  for (const row of rows) {
    const videoId = row[videoIdx];
    const day = row[dayIdx];
    for (const [metric, idx] of Object.entries(metricIdx)) {
      if (idx === -1) continue;
      const value = Number(row[idx]);
      if (!Number.isFinite(value)) continue;
      const { rowCount } = await query(
        `INSERT INTO youtube_video_snapshots (video_id, metric, value, recorded_at)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT DO NOTHING`,
        [videoId, metric, value, day]
      );
      inserted += rowCount;
    }
  }
  return { rows: rows.length, inserted };
}

// ---------- sync orchestration ----------

export async function syncAccount(accountId) {
  const channel = await fetchChannel(accountId);
  const videos = await fetchVideos(accountId);
  const shorts = await fetchShorts(accountId);
  const all = [...videos, ...shorts];
  await storeVideos(accountId, all);
  const analytics = await fetchVideoAnalytics(accountId, 30);

  return {
    accountId,
    channelTitle: channel.title,
    videos: videos.length,
    shorts: shorts.length,
    analyticsRows: analytics.rows,
    analyticsInserted: analytics.inserted,
  };
}

export async function syncAll(accountId = null) {
  const accounts = accountId ? [{ id: Number(accountId) }] : await listAccounts();
  if (!accounts.length) throw new Error('No YouTube accounts connected yet');

  const { rows: running } = await query(
    `SELECT id FROM sync_log WHERE status = 'running' AND started_at > now() - interval '30 minutes'`
  );
  if (running.length && !accountId) throw new Error('A sync is already in progress');

  const { rows: logRows } = await query(`INSERT INTO sync_log (status) VALUES ('running') RETURNING id`);
  const logId = logRows[0].id;

  const results = [];
  const errors = [];
  try {
    for (const account of accounts) {
      try {
        results.push(await syncAccount(account.id));
      } catch (err) {
        console.error(`[youtube sync] account ${account.id} failed:`, err.message);
        errors.push({ accountId: account.id, error: err.message });
      }
    }
    await query(`UPDATE sync_log SET status='ok', finished_at=now(), message=$1 WHERE id=$2`, [
      `${results.reduce((s, r) => s + r.videos + r.shorts, 0)} videos across ${results.length} account(s)` +
        (errors.length ? `, ${errors.length} failed` : ''),
      logId,
    ]);
    return {
      accounts: results,
      totalVideos: results.reduce((s, r) => s + r.videos, 0),
      totalShorts: results.reduce((s, r) => s + r.shorts, 0),
      errors,
    };
  } catch (err) {
    await query(`UPDATE sync_log SET status='error', finished_at=now(), message=$1 WHERE id=$2`, [
      err.message,
      logId,
    ]);
    throw err;
  }
}
