import { Router } from 'express';
import { query } from '../config/db.js';

const router = Router();

// ---------- Public (read-only, no auth) ----------
// All endpoints serve cached data from our own tables — no live Instagram /
// YouTube API calls (rate-limit safety: freshness is bounded by the cron sync).
// Never `SELECT *` here: posts.raw is a Graph dump we don't expose, and
// *_accounts hold OAuth tokens — only safe display columns are ever joined in.

/** Public: which accounts exist (safe fields only) — labels platform chips. */
router.get('/accounts', async (_req, res) => {
  try {
    const { rows } = await query(
      `SELECT 'instagram' AS platform, id, username AS name, connected_at
         FROM ig_accounts
       UNION ALL
       SELECT 'youtube', id, channel_title, connected_at
         FROM youtube_accounts
       ORDER BY platform, id`
    );
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** Public: currently-live (unexpired) stories, served from the cache. */
router.get('/stories', async (_req, res) => {
  try {
    const { rows } = await query(
      `SELECT p.id, p.account_id, a.username, p.media_type, p.media_url, p.thumbnail_url,
              p.permalink, p.posted_at, p.story_expires_at, p.synced_at
         FROM posts p
         LEFT JOIN ig_accounts a ON a.id = p.account_id
        WHERE p.media_product_type = 'STORY'
          AND (p.story_expires_at IS NULL OR p.story_expires_at > now())
        ORDER BY p.posted_at DESC
        LIMIT 100`
    );
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** Public: YouTube videos/shorts (?kind=video|short), public ones only. */
router.get('/youtube/videos', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const offset = Number(req.query.offset) || 0;
    const params = [];
    let where = `v.privacy_status = 'public'`;
    if (req.query.kind === 'video') where += ` AND v.is_short = FALSE`;
    if (req.query.kind === 'short') where += ` AND v.is_short = TRUE`;
    const { rows } = await query(
      `SELECT v.id, v.account_id, c.channel_title, v.title, v.thumbnail_url, v.video_url,
              v.is_short, v.published_at, v.view_count, v.like_count, v.comment_count, v.synced_at
         FROM youtube_videos v
         LEFT JOIN youtube_accounts c ON c.id = v.account_id
        WHERE ${where}
        ORDER BY v.published_at DESC NULLS LAST
        LIMIT $${params.push(limit)} OFFSET $${params.push(offset)}`,
      params
    );
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** Public: cached follower list for the connected Instagram accounts. */
router.get('/instagram/followers', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 200);
    const offset = Number(req.query.offset) || 0;
    const { rows } = await query(
      `SELECT account_id, follower_id, username, full_name,
              COALESCE(avatar_url, profile_pic_url) AS profile_pic_url,
              is_verified, synced_at
         FROM ig_followers
        ORDER BY account_id, synced_at DESC
        LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    res.json({ data: rows, hasMore: rows.length >= limit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** Public: follower/subscriber counts + 90-day trend, across all platforms. */
router.get('/followers', async (_req, res) => {
  try {
    const [ig, yt, igTrend, ytTrend] = await Promise.all([
      query(
        `SELECT a.id AS account_id, a.username AS name,
                (SELECT followers_count FROM account_snapshots s
                  WHERE s.account_id = a.id ORDER BY snapshot_date DESC LIMIT 1) AS followers_count,
                (SELECT followers_count FROM account_snapshots s
                  WHERE s.account_id = a.id ORDER BY snapshot_date DESC OFFSET 1 LIMIT 1) AS prev_followers_count,
                (SELECT MAX(snapshot_date) FROM account_snapshots s WHERE s.account_id = a.id) AS last_snapshot_date,
                (SELECT MAX(finished_at) FROM sync_log WHERE status = 'ok') AS last_synced_at
           FROM ig_accounts a ORDER BY a.id`
      ),
      query(
        `SELECT c.id AS account_id, c.channel_title AS name,
                (SELECT subscriber_count FROM youtube_account_snapshots s
                  WHERE s.account_id = c.id ORDER BY snapshot_date DESC LIMIT 1) AS followers_count,
                (SELECT subscriber_count FROM youtube_account_snapshots s
                  WHERE s.account_id = c.id ORDER BY snapshot_date DESC OFFSET 1 LIMIT 1) AS prev_followers_count,
                (SELECT MAX(snapshot_date) FROM youtube_account_snapshots s WHERE s.account_id = c.id) AS last_snapshot_date,
                (SELECT MAX(finished_at) FROM sync_log WHERE status = 'ok') AS last_synced_at
           FROM youtube_accounts c ORDER BY c.id`
      ),
      query(
        `SELECT account_id, snapshot_date AS date, followers_count AS value
           FROM account_snapshots
          WHERE snapshot_date > CURRENT_DATE - 90
          ORDER BY account_id, snapshot_date`
      ),
      query(
        `SELECT account_id, snapshot_date AS date, subscriber_count AS value
           FROM youtube_account_snapshots
          WHERE snapshot_date > CURRENT_DATE - 90
          ORDER BY account_id, snapshot_date`
      ),
    ]);

    const groupTrend = (rows, platform, accounts) => {
      const byAccount = new Map();
      for (const row of rows) {
        if (!byAccount.has(row.account_id)) byAccount.set(row.account_id, []);
        byAccount.get(row.account_id).push({ date: row.date, value: Number(row.value) });
      }
      return accounts.map((a) => ({
        platform,
        account_id: a.account_id,
        name: a.name,
        followers_count: a.followers_count == null ? null : Number(a.followers_count),
        prev_followers_count: a.prev_followers_count == null ? null : Number(a.prev_followers_count),
        delta:
          a.followers_count != null && a.prev_followers_count != null
            ? Number(a.followers_count) - Number(a.prev_followers_count)
            : null,
        last_snapshot_date: a.last_snapshot_date,
        last_synced_at: a.last_synced_at,
        trend: byAccount.get(a.account_id) || [],
      }));
    };

    res.json({
      data: [
        ...groupTrend(igTrend.rows, 'instagram', ig.rows),
        ...groupTrend(ytTrend.rows, 'youtube', yt.rows),
      ],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;