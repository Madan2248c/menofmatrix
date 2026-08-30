import { Router } from 'express';
import 'dotenv/config';
import { requireOwner } from './api.js';
import {
  getAuthUrl,
  exchangeCodeForToken,
  listAccounts,
  deleteAccount,
  syncAll,
  fetchChannel,
  fetchVideos,
  fetchShorts,
  storeVideos,
  fetchVideoAnalytics,
  getAccount,
} from '../services/youtubeService.js';
import { query } from '../config/db.js';

const router = Router();

/** Owner: get the Google OAuth URL. */
router.get('/auth/url', requireOwner, (_req, res) => {
  try {
    res.json({ url: getAuthUrl() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** Public: Google redirects here with ?code=... */
router.get('/auth/callback', async (req, res) => {
  const { code, error_description: errDesc } = req.query;
  if (errDesc) return res.status(400).send(`YouTube auth error: ${errDesc}`);
  if (!code) return res.status(400).send('Missing code');
  try {
    const result = await exchangeCodeForToken(code);
    await fetchChannel(result.accountId).catch((err) =>
      console.error('[youtube oauth] initial stats fetch failed:', err)
    );
    res.send(
      `<h2>✅ YouTube connected</h2>
       <p><strong>${result.channelTitle}</strong> is now linked (account #${result.accountId}).</p>
       <p>You can close this tab and open the dashboard.</p>`
    );
  } catch (err) {
    console.error('[youtube oauth] callback failed:', err);
    res.status(500).send(`Connection failed: ${err.message}`);
  }
});

/** Owner: list connected YouTube channels. */
router.get('/accounts', requireOwner, async (_req, res) => {
  try {
    const data = await listAccounts();
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** Owner: remove a connected channel and all its data. */
router.delete('/accounts/:id', requireOwner, async (req, res) => {
  try {
    await deleteAccount(Number(req.params.id));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** Owner: sync a single account or all YouTube accounts. */
router.post('/sync', requireOwner, async (req, res) => {
  try {
    const result = await syncAll(req.body?.account_id ?? null);
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** Owner: regular uploaded videos (excludes Shorts). */
router.get('/videos', requireOwner, async (req, res) => {
  try {
    const accountId = Number(req.query.account_id);
    if (!accountId) return res.status(400).json({ error: 'account_id required' });
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const offset = Number(req.query.offset) || 0;
    const { rows } = await query(
      `SELECT id, title, description, thumbnail_url, video_url, duration_seconds, is_short,
              privacy_status, published_at, view_count, like_count, comment_count, synced_at
       FROM youtube_videos
       WHERE account_id = $1 AND is_short = FALSE
       ORDER BY published_at DESC NULLS LAST LIMIT $2 OFFSET $3`,
      [accountId, limit, offset]
    );
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** Owner: Shorts only. */
router.get('/shorts', requireOwner, async (req, res) => {
  try {
    const accountId = Number(req.query.account_id);
    if (!accountId) return res.status(400).json({ error: 'account_id required' });
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const offset = Number(req.query.offset) || 0;
    const { rows } = await query(
      `SELECT id, title, description, thumbnail_url, video_url, duration_seconds, is_short,
              privacy_status, published_at, view_count, like_count, comment_count, synced_at
       FROM youtube_videos
       WHERE account_id = $1 AND is_short = TRUE
       ORDER BY published_at DESC NULLS LAST LIMIT $2 OFFSET $3`,
      [accountId, limit, offset]
    );
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** Owner: single video detail with metric snapshots. */
router.get('/videos/:id', requireOwner, async (req, res) => {
  try {
    const { rows: videoRows } = await query(
      `SELECT id, account_id, title, description, thumbnail_url, video_url, duration_seconds, is_short,
              privacy_status, published_at, view_count, like_count, comment_count, raw, synced_at
       FROM youtube_videos WHERE id = $1`,
      [req.params.id]
    );
    if (!videoRows.length) return res.status(404).json({ error: 'Video not found' });
    const { rows: snapshots } = await query(
      `SELECT metric, value, recorded_at FROM youtube_video_snapshots
       WHERE video_id = $1 ORDER BY recorded_at ASC, metric`,
      [req.params.id]
    );
    res.json({ video: videoRows[0], snapshots });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** Owner: account-level analytics summary + trend. */
router.get('/analytics/summary', requireOwner, async (req, res) => {
  try {
    const accountId = Number(req.query.account_id);
    if (!accountId) return res.status(400).json({ error: 'account_id required' });

    const account = await getAccount(accountId);
    if (!account) return res.status(404).json({ error: 'Account not found' });

    const { rows: kpis } = await query(
      `SELECT
        COALESCE((SELECT subscriber_count FROM youtube_account_snapshots WHERE account_id=$1 ORDER BY snapshot_date DESC LIMIT 1), 0) AS subscriber_count,
        (SELECT COUNT(*) FROM youtube_videos WHERE account_id=$1 AND is_short=FALSE) AS total_videos,
        (SELECT COUNT(*) FROM youtube_videos WHERE account_id=$1 AND is_short=TRUE) AS total_shorts,
        COALESCE(SUM(view_count), 0) AS total_views,
        COALESCE(SUM(like_count), 0) AS total_likes,
        COALESCE(SUM(comment_count), 0) AS total_comments
       FROM youtube_videos WHERE account_id=$1`,
      [accountId]
    );

    const { rows: trend } = await query(
      `SELECT snapshot_date, subscriber_count, view_count, video_count
       FROM youtube_account_snapshots
       WHERE account_id=$1 ORDER BY snapshot_date`,
      [accountId]
    );

    const { rows: topVideos } = await query(
      `SELECT id, title, thumbnail_url, video_url, view_count, like_count, comment_count, published_at
       FROM youtube_videos WHERE account_id=$1
       ORDER BY COALESCE(view_count, 0) DESC NULLS LAST LIMIT 5`,
      [accountId]
    );

    res.json({
      account_id: accountId,
      channel_title: account.channel_title,
      ...kpis[0],
      followerTrend: trend,
      topVideos,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
