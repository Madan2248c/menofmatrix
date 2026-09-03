import { Router } from 'express';
import { rateLimit, ipKeyGenerator } from 'express-rate-limit';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import { query } from '../config/db.js';
import { requireOwner } from '../middleware/requireOwner.js';
import { requireMember } from '../middleware/communityAuth.js';
import { listAccounts, getFirstAccountId, getAccount, deleteAccount } from '../services/tokenStore.js';
import { fetchStories } from '../services/instagram.js';
import { syncAll } from '../services/syncService.js';
import { syncFollowersList } from '../services/apifyFollowers.js';
import { listRules, createRule, deleteRule, runAutomation } from '../services/automationService.js';

const router = Router();

// Re-export so existing importers (youtube.js) keep working.
export { requireOwner };

// Forward async handler rejections to Express's error middleware. Express 4
// does not await route handlers, so an unguarded rejection is an unhandled
// promise — fatal under Node's default. Wrap every async route.
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Read the CLI's own version out of its Cargo.toml so /v1/tracker/config never drifts from what's shipped.
const CLI_VERSION = (() => {
  try {
    const cargoPath = fileURLToPath(new URL('../../../mom-tracker/Cargo.toml', import.meta.url));
    const match = readFileSync(cargoPath, 'utf8').match(/^version\s*=\s*"([^"]+)"/m);
    return match?.[1] || '1.0.0';
  } catch {
    return '1.0.0';
  }
})();

const trackerIngestLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req.member?.id ? String(req.member.id) : ipKeyGenerator(req.ip)),
});

const MAX_TRACKER_SNAPSHOTS_PER_REQUEST = 500;

// ---------- Public (read-only) endpoints ----------

// Public: post feed (public Instagram content served from our cache)
router.get('/posts', wrap(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const offset = Math.max(0, Number(req.query.offset) || 0);
  const { type } = req.query;
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
    `SELECT id, account_id, caption, media_type, media_product_type, media_url, thumbnail_url,
            permalink, posted_at, like_count, comments_count, reach, views, total_interactions, synced_at
     FROM posts WHERE ${where}
     ORDER BY posted_at DESC NULLS LAST LIMIT $${params.push(limit)} OFFSET $${params.push(offset)}`,
    params
  );
  res.json({ data: rows });
}));

// Public: cached stories only. The live Instagram fetch lives on the
// owner-only /stories/live route so unauthenticated traffic can't burn quota.
router.get('/stories', wrap(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const accountId = Number(req.query.account_id) || (await getFirstAccountId());
  const params = [];
  let where = "media_product_type = 'STORY' AND (story_expires_at IS NULL OR story_expires_at > now())";
  if (accountId) where += ` AND account_id = $${params.push(accountId)}`;
  params.push(limit);
  const { rows } = await query(
    `SELECT * FROM posts WHERE ${where} ORDER BY posted_at DESC LIMIT $${params.length}`,
    params
  );
  res.json({ source: 'cache', data: rows });
}));

router.get('/posts/:id', requireOwner, wrap(async (req, res) => {
  const { rows } = await query('SELECT * FROM posts WHERE id = $1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Post not found' });
  const snaps = await query(
    `SELECT metric, value, recorded_at FROM post_insight_snapshots
     WHERE post_id = $1 ORDER BY recorded_at ASC`,
    [req.params.id]
  );
  res.json({ post: rows[0], snapshots: snaps.rows });
}));

// ---------- Owner-only: everything account-related below ----------

router.get('/accounts', requireOwner, wrap(async (_req, res) => {
  const accounts = await listAccounts();
  res.json({ data: accounts });
}));

router.get('/stories/live', requireOwner, wrap(async (req, res) => {
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
}));

router.get('/analytics/summary', requireOwner, wrap(async (req, res) => {
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
}));

router.get('/status', requireOwner, wrap(async (_req, res) => {
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
}));

// ---------- Owner-only endpoints ----------

router.post('/sync', requireOwner, async (req, res) => {
  try {
    const result = await syncAll(req.body?.account_id ?? null);
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Owner: scrape + cache the Instagram follower list via Apify (manual, pay-per-event)
router.post('/followers/sync', requireOwner, async (req, res) => {
  try {
    const accountId =
      Number(req.body?.account_id) ||
      Number(req.query.account_id) ||
      (await getFirstAccountId());
    if (!accountId) return res.status(400).json({ error: 'No Instagram accounts connected' });
    const result = await syncFollowersList(accountId);
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

router.get('/automation/rules', requireOwner, wrap(async (req, res) => {
  const accountId = req.query.account_id ? Number(req.query.account_id) : null;
  const data = await listRules(accountId);
  res.json({ data });
}));

router.post('/automation/rules', requireOwner, wrap(async (req, res) => {
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
}));

router.delete('/automation/rules/:id', requireOwner, wrap(async (req, res) => {
  await deleteRule(Number(req.params.id));
  res.json({ ok: true });
}));

router.post('/automation/run', requireOwner, async (req, res) => {
  try {
    const result = await runAutomation(req.body?.account_id ?? null);
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dynamic endpoint discovery for all deployed mom-tracker CLIs. Static payload — cache it.
router.get('/v1/tracker/config', async (_req, res) => {
  res.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60');
  res.json({
    ok: true,
    ingest_url: process.env.MOM_TRACKER_INGEST_URL || 'https://menofmatrix.vercel.app/api/v1/tracker',
    min_cli_version: '1.0.0',
    current_version: CLI_VERSION,
    notice: null,
  });
});

// Requires a real community JWT (Bearer token from Google sign-in via /auth/cli) so ingestion
// can't be spoofed as another user. Identity comes from the verified token, never the body.
router.post('/v1/tracker', requireMember, trackerIngestLimiter, wrap(async (req, res) => {
  const { records, clientTimestamp } = req.body || {};
  const recordList = Array.isArray(records) ? records : [];
  // Existing rows are keyed by email (the CLI/frontend historically sent session.user.email as
  // user_id) — keep that convention so verified ingestion doesn't fork an existing user's
  // history under a new identity. Fall back to the member's stable numeric id only if a member
  // somehow has no email on file.
  const userEmail = req.member.email;
  const userId = req.member.email || `member_${req.member.id}`;

  const rows = [];
  for (const rec of recordList) {
    const snapshots = Array.isArray(rec.snapshots) ? rec.snapshots : [];
    for (const s of snapshots) {
      const agentId = s.agentId || s.agent_id;
      const u = s.usage;
      if (!agentId || !u) continue;
      if (rows.length >= MAX_TRACKER_SNAPSHOTS_PER_REQUEST) {
        return res.status(400).json({
          error: `Too many snapshots in one request (max ${MAX_TRACKER_SNAPSHOTS_PER_REQUEST})`,
        });
      }
      rows.push({
        agentId,
        agentName: s.agentName || s.agent_name || agentId,
        date: s.date || new Date().toISOString().split('T')[0],
        input: u.input_tokens || 0,
        output: u.output_tokens || 0,
        thinking: u.thinking_tokens || 0,
        cached: u.cached_tokens || 0,
        total: u.total_tokens || 0,
        clientTimestamp: clientTimestamp || rec.timestamp || new Date().toISOString(),
      });
    }
  }

  if (rows.length === 0) {
    return res.json({ ok: true, ingested: 0, timestamp: new Date().toISOString() });
  }

  // Single batched upsert via UNNEST — one round trip regardless of snapshot count.
  // The WHERE clause makes the update monotonic: a stale/out-of-order sync can't lower
  // a user's recorded total and flap the leaderboard.
  const result = await query(
    `INSERT INTO tracker_daily_usage (
       user_id, user_email, agent_id, agent_name, date,
       input_tokens, output_tokens, thinking_tokens, cached_tokens, total_tokens, client_timestamp
     )
     SELECT $1, $2, agent_id, agent_name, date::date,
            input_tokens, output_tokens, thinking_tokens, cached_tokens, total_tokens, client_timestamp::timestamptz
     FROM UNNEST(
       $3::text[], $4::text[], $5::text[],
       $6::bigint[], $7::bigint[], $8::bigint[], $9::bigint[], $10::bigint[], $11::text[]
     ) AS t(agent_id, agent_name, date, input_tokens, output_tokens, thinking_tokens, cached_tokens, total_tokens, client_timestamp)
     ON CONFLICT (user_id, agent_id, date) DO UPDATE SET
       input_tokens = EXCLUDED.input_tokens,
       output_tokens = EXCLUDED.output_tokens,
       thinking_tokens = EXCLUDED.thinking_tokens,
       cached_tokens = EXCLUDED.cached_tokens,
       total_tokens = EXCLUDED.total_tokens,
       client_timestamp = EXCLUDED.client_timestamp,
       recorded_at = now()
     WHERE EXCLUDED.total_tokens >= tracker_daily_usage.total_tokens`,
    [
      userId,
      userEmail || null,
      rows.map((r) => r.agentId),
      rows.map((r) => r.agentName),
      rows.map((r) => r.date),
      rows.map((r) => r.input),
      rows.map((r) => r.output),
      rows.map((r) => r.thinking),
      rows.map((r) => r.cached),
      rows.map((r) => r.total),
      rows.map((r) => r.clientTimestamp),
    ]
  );

  console.log(`[MOM Tracker Ingestion] Persisted ${result.rowCount} snapshot(s) for user: ${userId}`);
  res.json({ ok: true, ingested: result.rowCount, submitted: rows.length, timestamp: new Date().toISOString() });
}));

export default router;
