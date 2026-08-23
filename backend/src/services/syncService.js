import { query } from '../config/db.js';
import { listAccounts, ensureFreshToken } from './tokenStore.js';
import { fetchProfile, fetchAllMedia, fetchMediaInsights } from './instagram.js';

/** Sync one account: profile snapshot -> all media -> per-post insights. */
async function syncAccount(account) {
  await ensureFreshToken(account.id);

  // 1) Account-level KPIs (upsert daily snapshot per account)
  const profile = await fetchProfile(account.id);
  await query(
    `INSERT INTO account_snapshots (account_id, snapshot_date, followers_count, follows_count, media_count)
     VALUES ($1, CURRENT_DATE, $2, $3, $4)
     ON CONFLICT (account_id, snapshot_date) DO UPDATE SET
       followers_count = EXCLUDED.followers_count,
       follows_count = EXCLUDED.follows_count,
       media_count = EXCLUDED.media_count`,
    [account.id, profile.followers_count ?? null, profile.follows_count ?? null, profile.media_count ?? null]
  );

  // 2) All media (feed posts, carousels, reels, active stories)
  const media = await fetchAllMedia(account.id);
  let withInsights = 0;

  for (const m of media) {
    const isStory = m.media_product_type === 'STORY';
    const ins = await fetchMediaInsights(account.id, m.id, m.media_product_type);
    if (ins) withInsights++;

    await query(
      `INSERT INTO posts (id, account_id, caption, media_type, media_product_type, media_url,
                          thumbnail_url, permalink, posted_at, story_expires_at,
                          like_count, comments_count, reach, views, saves, shares,
                          total_interactions, raw, synced_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18, now())
       ON CONFLICT (id) DO UPDATE SET
         caption = EXCLUDED.caption,
         media_url = EXCLUDED.media_url,
         thumbnail_url = EXCLUDED.thumbnail_url,
         permalink = EXCLUDED.permalink,
         like_count = COALESCE(EXCLUDED.like_count, posts.like_count),
         comments_count = COALESCE(EXCLUDED.comments_count, posts.comments_count),
         reach = COALESCE(EXCLUDED.reach, posts.reach),
         views = COALESCE(EXCLUDED.views, posts.views),
         saves = COALESCE(EXCLUDED.saves, posts.saves),
         shares = COALESCE(EXCLUDED.shares, posts.shares),
         total_interactions = COALESCE(EXCLUDED.total_interactions, posts.total_interactions),
         raw = EXCLUDED.raw,
         synced_at = now()`,
      [
        m.id,
        account.id,
        m.caption ?? null,
        m.media_type ?? null,
        m.media_product_type ?? null,
        m.media_url ?? null,
        m.thumbnail_url ?? null,
        m.permalink ?? null,
        m.timestamp ? new Date(m.timestamp) : null,
        isStory && m.timestamp
          ? new Date(new Date(m.timestamp).getTime() + 24 * 3600 * 1000)
          : null,
        ins?.like_count ?? null,
        ins?.comments_count ?? null,
        ins?.reach ?? null,
        ins?.views ?? null,
        ins?.saves ?? null,
        ins?.shares ?? null,
        ins?.total_interactions ?? null,
        JSON.stringify({ ...m, ...(ins || {}) }),
      ]
    );

    // 3) Append metric history for trend charts (stories expire — skip them)
    if (!isStory && ins) {
      for (const [metric, value] of Object.entries({
        likes: ins.like_count,
        comments: ins.comments_count,
        reach: ins.reach,
        views: ins.views,
      })) {
        if (value == null) continue;
        await query(
          `INSERT INTO post_insight_snapshots (post_id, metric, value)
           SELECT $1, $2, $3
           WHERE NOT EXISTS (
             SELECT 1 FROM post_insight_snapshots
             WHERE post_id = $1 AND metric = $2 AND recorded_at > now() - interval '20 hours'
           )`,
          [m.id, metric, value]
        );
      }
    }
  }

  return { accountId: account.id, username: account.username, mediaCount: media.length, withInsights };
}

/**
 * Full sync. Pass an accountId to sync one account, otherwise loop all.
 * Rate limits are per IG account (~200 req/h each), so this scales linearly.
 */
export async function syncAll(accountId = null) {
  const accounts = accountId
    ? [{ id: Number(accountId) }]
    : await listAccounts();

  if (!accounts.length) throw new Error('No Instagram accounts connected yet');

  const { rows: running } = await query(
    `SELECT id FROM sync_log WHERE status = 'running' AND started_at > now() - interval '30 minutes'`
  );
  if (running.length && !accountId) throw new Error('A sync is already in progress');

  const { rows: logRows } = await query(
    `INSERT INTO sync_log (status) VALUES ('running') RETURNING id`
  );
  const logId = logRows[0].id;

  const results = [];
  const errors = [];
  try {
    for (const account of accounts) {
      try {
        results.push(await syncAccount(account));
      } catch (err) {
        console.error(`[sync] account ${account.id} failed:`, err.message);
        errors.push({ accountId: account.id, error: err.message });
      }
    }
    if (!accountId || errors.length < accounts.length) {
      await query(`UPDATE sync_log SET status='ok', finished_at=now(), message=$1 WHERE id=$2`, [
        `${results.reduce((s, r) => s + r.mediaCount, 0)} media across ${results.length} account(s)` +
        (errors.length ? `, ${errors.length} failed` : ''),
        logId,
      ]);
    } else {
      throw new Error(errors.map((e) => e.error).join('; '));
    }
    return {
      accounts: results,
      totalMedia: results.reduce((s, r) => s + r.mediaCount, 0),
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

