import { Router } from 'express';
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import { query } from '../config/db.js';
import { listAccounts, getFirstAccountId, getAccount, deleteAccount } from '../services/tokenStore.js';
import { fetchStories } from '../services/instagram.js';
import { syncAll } from '../services/syncService.js';
import { listRules, createRule, deleteRule, runAutomation } from '../services/automationService.js';

const router = Router();

/** Bearer-JWT guard for owner-only endpoints. */
export function requireOwner(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  try {
    jwt.verify(token || '', process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

// ---------- Public (read-only) endpoints ----------

// Public: post feed (public Instagram content served from our cache)
router.get('/posts', async (req, res) => {
  const { limit = 50, offset = 0, type } = req.query;
  const params = [];
  let where;
  if (type === 'STORY') {
    where = "media_product_type = 'STORY' AND (story_expires_at IS NULL OR story_expires_at > now())";
  } else if (type && type !== 'all') {
    where = `media_product_type = $${params.push(type)}`;
  } else if (type === 'all') {
    where = "1=1";
  } else {
    where = "media_product_type IS DISTINCT FROM 'STORY'";
  }
  const accountId = Number(req.query.account_id);
  if (accountId) where += ` AND account_id = $${params.push(accountId)}`;
  const { rows } = await query(
    `SELECT * FROM posts WHERE ${where}
     ORDER BY posted_at DESC NULLS LAST LIMIT $${params.push(limit)} OFFSET $${params.push(offset)}`,
    params
  );
  res.json({ data: rows });
});

router.get('/stories', async (req, res) => {
  const limit = Number(req.query.limit) || 20;
  const accountId = Number(req.query.account_id) || (await getFirstAccountId());
  if (accountId) {
    try {
      const live = await fetchStories(accountId);
      if (live?.data?.length) return res.json({ source: 'live', data: live.data.slice(0, limit) });
    } catch {}
  }
  const params = [];
  let where = "media_product_type = 'STORY' AND (story_expires_at IS NULL OR story_expires_at > now())";
  if (accountId) where += ` AND account_id = $${params.push(accountId)}`;
  params.push(limit);
  const { rows } = await query(
    `SELECT * FROM posts WHERE ${where} ORDER BY posted_at DESC LIMIT $${params.length}`,
    params
  );
  res.json({ source: 'cache', data: rows });
});

router.get('/posts/:id', requireOwner, async (req, res) => {
  const { rows } = await query('SELECT * FROM posts WHERE id = $1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Post not found' });
  const snaps = await query(
    `SELECT metric, value, recorded_at FROM post_insight_snapshots
     WHERE post_id = $1 ORDER BY recorded_at ASC`,
    [req.params.id]
  );
  res.json({ post: rows[0], snapshots: snaps.rows });
});

// ---------- Owner-only: everything account-related below ----------

router.get('/accounts', requireOwner, async (_req, res) => {
  const accounts = await listAccounts();
  res.json({ data: accounts });
});

router.get('/stories/live', requireOwner, async (req, res) => {
  const accountId = Number(req.query.account_id) || (await getFirstAccountId());
  if (!accountId) return res.json({ source: 'cache', data: [] });
  // Prefer live data from Instagram; fall back to cached unexpired stories
  try {
    const live = await fetchStories(accountId);
    return res.json({ source: 'live', account_id: accountId, data: live.data || [] });
  } catch (err) {
    const { rows } = await query(
      `SELECT * FROM posts WHERE media_product_type = 'STORY' AND account_id = $1
       AND (story_expires_at IS NULL OR story_expires_at > now())
       ORDER BY posted_at DESC`,
      [accountId]
    );
    res.json({ source: 'cache', account_id: accountId, data: rows, note: err.message });
  }
});

router.get('/analytics/summary', requireOwner, async (req, res) => {
  const accountId = Number(req.query.account_id) || (await getFirstAccountId());
  if (!accountId) return res.json({ error: 'No accounts connected' });
  const account = await getAccount(accountId);

  const kpis = await query(
    `
    SELECT
      (SELECT followers_count FROM account_snapshots WHERE account_id=$1 ORDER BY snapshot_date DESC LIMIT 1) AS followers_count,
      (SELECT COUNT(*) FROM posts WHERE account_id=$1 AND media_product_type <> 'STORY') AS total_posts,
      COALESCE(SUM(like_count), 0) AS total_likes,
      COALESCE(SUM(comments_count), 0) AS total_comments,
      COALESCE(SUM(reach), 0) AS total_reach,
      COALESCE(SUM(views), 0) AS total_views,
      ROUND(AVG(COALESCE(reach,0)) FILTER (WHERE media_product_type <> 'STORY'))::int AS avg_reach_per_post,
      (SELECT MAX(finished_at) FROM sync_log WHERE status='ok') AS last_synced_at
    FROM posts WHERE account_id=$1`,
    [accountId]
  );
  const followerTrend = await query(
    `SELECT snapshot_date, followers_count, media_count FROM account_snapshots
     WHERE account_id=$1 ORDER BY snapshot_date`,
    [accountId]
  );
  const topPosts = await query(
    `SELECT id, caption, thumbnail_url, permalink, reach, like_count, comments_count, posted_at
     FROM posts WHERE account_id=$1 AND media_product_type <> 'STORY'
     ORDER BY COALESCE(total_interactions, like_count + comments_count, 0) DESC NULLS LAST LIMIT 5`,
    [accountId]
  );
  const breakdown = await query(
    `SELECT media_product_type AS type, COUNT(*) AS count,
            COALESCE(AVG(reach),0)::int AS avg_reach
     FROM posts WHERE account_id=$1 GROUP BY media_product_type`,
    [accountId]
  );
  res.json({
    account_id: accountId,
    username: account?.username || null,
    ...kpis.rows[0],
    followerTrend: followerTrend.rows,
    topPosts: topPosts.rows,
    breakdown: breakdown.rows,
  });
});

router.get('/status', async (_req, res) => {
  const accounts = await listAccounts();
  const lastSync = await query(`SELECT * FROM sync_log ORDER BY id DESC LIMIT 1`);
  res.json({
    connected: accounts.length > 0,
    accounts: accounts.map((a) => ({
      id: a.id,
      igUserId: a.ig_user_id,
      username: a.username,
      tokenExpiresAt: a.expires_at,
      connectedAt: a.connected_at,
    })),
    lastSync: lastSync.rows[0] || null,
  });
});

// ---------- Owner-only endpoints ----------

router.post('/sync', requireOwner, async (req, res) => {
  try {
    const result = await syncAll(req.body?.account_id ?? null);
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/accounts/:id', requireOwner, async (req, res) => {
  try {
    await deleteAccount(Number(req.params.id));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- Comment-to-DM automation ----------

router.get('/automation/rules', requireOwner, async (req, res) => {
  const accountId = req.query.account_id ? Number(req.query.account_id) : null;
  const data = await listRules(accountId);
  res.json({ data });
});

router.post('/automation/rules', requireOwner, async (req, res) => {
  const { accountId, name, keywords, action, messageTemplate, postId } = req.body || {};
  const resolvedAccountId = accountId ? Number(accountId) : await getFirstAccountId();
  if (!resolvedAccountId) return res.status(400).json({ error: 'No accounts connected' });
  if (!name || !Array.isArray(keywords) || !keywords.length) {
    return res.status(400).json({ error: 'name and keywords[] are required' });
  }
  if (action && !['reply', 'dm', 'both'].includes(action)) {
    return res.status(400).json({ error: "action must be 'reply', 'dm', or 'both'" });
  }
  try {
    const rule = await createRule({
      accountId: resolvedAccountId,
      name,
      keywords,
      action: action || 'dm',
      messageTemplate: messageTemplate || '',
      postId: postId || null,
    });
    res.json({ data: rule });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/automation/rules/:id', requireOwner, async (req, res) => {
  await deleteRule(Number(req.params.id));
  res.json({ ok: true });
});

router.post('/automation/run', requireOwner, async (req, res) => {
  try {
    const result = await runAutomation(req.body?.account_id ?? null);
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
