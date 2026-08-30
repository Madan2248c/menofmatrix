import { Router } from 'express';
import { query } from '../config/db.js';
import { requireOwner } from './api.js';

const router = Router();
router.use(requireOwner);
const wrap = (fn) => (req, res) => fn(req, res).catch((e) => res.status(500).json({ error: e.message }));

// ---------------- Polls ----------------

router.get('/polls', wrap(async (_req, res) => {
  const { rows } = await query(
    `SELECT p.*, COALESCE(json_agg(json_build_object('id', o.id, 'label', o.label, 'sort_order', o.sort_order)
              ORDER BY o.sort_order, o.id) FILTER (WHERE o.id IS NOT NULL), '[]') AS options
       FROM polls p LEFT JOIN poll_options o ON o.poll_id = p.id
      GROUP BY p.id ORDER BY p.created_at DESC`
  );
  res.json({ data: rows });
}));

router.post('/polls', wrap(async (req, res) => {
  const { kind, question, options = [], status = 'draft', opens_at, closes_at } = req.body || {};
  if (!kind || !question || options.length < 2) {
    return res.status(400).json({ error: 'kind, question and >=2 options required' });
  }
  const { rows } = await query(
    `INSERT INTO polls (kind, question, status, opens_at, closes_at) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
    [kind, question, status, opens_at || null, closes_at || null]
  );
  const pollId = rows[0].id;
  for (let i = 0; i < options.length; i++) {
    await query(`INSERT INTO poll_options (poll_id, label, sort_order) VALUES ($1,$2,$3)`, [
      pollId, String(options[i]).slice(0, 200), i,
    ]);
  }
  res.json({ data: { id: pollId } });
}));

router.patch('/polls/:id', wrap(async (req, res) => {
  const { status } = req.body || {};
  if (status && !['draft', 'live', 'closed'].includes(status)) {
    return res.status(400).json({ error: 'bad status' });
  }
  const { rows } = await query(
    `UPDATE polls SET status = COALESCE($2, status),
            opens_at = CASE WHEN $2 = 'live' AND opens_at IS NULL THEN now() ELSE opens_at END
      WHERE id = $1 RETURNING *`,
    [Number(req.params.id), status || null]
  );
  res.json({ data: rows[0] });
}));

router.put('/polls/:id/resolve', wrap(async (req, res) => {
  const optionId = Number(req.body?.option_id);
  if (!optionId) return res.status(400).json({ error: 'option_id required' });
  const { rows } = await query(
    `UPDATE polls SET resolved_option_id = $2, status = 'closed'
      WHERE id = $1 AND kind = 'prediction' RETURNING *`,
    [Number(req.params.id), optionId]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Prediction poll not found' });
  res.json({ data: rows[0] });
}));

router.delete('/polls/:id', wrap(async (req, res) => {
  await query(`DELETE FROM polls WHERE id = $1`, [Number(req.params.id)]);
  res.json({ ok: true });
}));

// ---------------- Challenges ----------------

router.get('/challenges', wrap(async (_req, res) => {
  const { rows } = await query(`SELECT * FROM challenges ORDER BY created_at DESC`);
  res.json({ data: rows });
}));

router.post('/challenges', wrap(async (req, res) => {
  const { brief, linked_idea_id, opens_at, closes_at } = req.body || {};
  if (!brief?.trim()) return res.status(400).json({ error: 'brief required' });
  const { rows } = await query(
    `INSERT INTO challenges (brief, linked_idea_id, opens_at, closes_at) VALUES ($1,$2,$3,$4) RETURNING *`,
    [brief.trim(), linked_idea_id || null, opens_at || null, closes_at || null]
  );
  res.json({ data: rows[0] });
}));

router.patch('/challenges/:id', wrap(async (req, res) => {
  const { status, brief, linked_idea_id } = req.body || {};
  if (status && !['open', 'voting', 'closed'].includes(status)) {
    return res.status(400).json({ error: 'bad status' });
  }
  const { rows } = await query(
    `UPDATE challenges SET status = COALESCE($2, status),
            brief = COALESCE($3, brief),
            linked_idea_id = COALESCE($4, linked_idea_id)
      WHERE id = $1 RETURNING *`,
    [Number(req.params.id), status || null, brief || null, linked_idea_id || null]
  );
  res.json({ data: rows[0] });
}));

router.put('/challenges/:id/winner', wrap(async (req, res) => {
  const entryId = Number(req.body?.entry_id);
  if (!entryId) return res.status(400).json({ error: 'entry_id required' });
  const { rows } = await query(
    `UPDATE challenges SET winner_entry_id = $2, status = 'closed'
      WHERE id = $1 AND EXISTS (SELECT 1 FROM challenge_entries WHERE id = $2 AND challenge_id = $1)
      RETURNING *`,
    [Number(req.params.id), entryId]
  );
  if (!rows[0]) return res.status(400).json({ error: 'entry not in this challenge' });
  res.json({ data: rows[0] });
}));

// ---------------- Ideas (moderation + lifecycle) ----------------

router.get('/ideas', wrap(async (_req, res) => {
  const { rows } = await query(
    `SELECT i.*, m.handle AS author,
            (SELECT COUNT(*)::int FROM idea_votes WHERE idea_id = i.id) AS votes
       FROM ideas i JOIN community_members m ON m.id = i.member_id
      ORDER BY i.created_at DESC`
  );
  res.json({ data: rows });
}));

router.patch('/ideas/:id', wrap(async (req, res) => {
  const { status, built_pick_id, is_hidden } = req.body || {};
  if (status && !['new', 'picked', 'built'].includes(status)) {
    return res.status(400).json({ error: 'bad status' });
  }
  const { rows } = await query(
    `UPDATE ideas SET status = COALESCE($2, status),
            built_pick_id = COALESCE($3, built_pick_id),
            is_hidden = COALESCE($4, is_hidden)
      WHERE id = $1 RETURNING *`,
    [Number(req.params.id), status || null, built_pick_id ?? null, typeof is_hidden === 'boolean' ? is_hidden : null]
  );
  res.json({ data: rows[0] });
}));

router.delete('/ideas/:id', wrap(async (req, res) => {
  await query(`DELETE FROM ideas WHERE id = $1`, [Number(req.params.id)]);
  res.json({ ok: true });
}));

// ---------------- Picks ----------------

router.get('/picks', wrap(async (_req, res) => {
  const { rows } = await query(`SELECT * FROM picks ORDER BY sort_order, created_at DESC`);
  res.json({ data: rows });
}));

router.post('/picks', wrap(async (req, res) => {
  const { title, url, blurb, category, origin = 'curated', is_featured = false, in_ship_log = false, shipped_at, sort_order = 0 } = req.body || {};
  if (!title?.trim()) return res.status(400).json({ error: 'title required' });
  const { rows } = await query(
    `INSERT INTO picks (title, url, blurb, category, origin, is_featured, in_ship_log, shipped_at, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [title.trim(), url || null, blurb || null, category || null, origin, !!is_featured, !!in_ship_log,
     shipped_at || (origin === 'built' ? new Date().toISOString() : null), sort_order]
  );
  res.json({ data: rows[0] });
}));

router.patch('/picks/:id', wrap(async (req, res) => {
  const f = req.body || {};
  const { rows } = await query(
    `UPDATE picks SET title = COALESCE($2,title), url = COALESCE($3,url), blurb = COALESCE($4,blurb),
            category = COALESCE($5,category), origin = COALESCE($6,origin),
            is_featured = COALESCE($7,is_featured), in_ship_log = COALESCE($8,in_ship_log),
            shipped_at = COALESCE($9,shipped_at), sort_order = COALESCE($10,sort_order)
      WHERE id = $1 RETURNING *`,
    [Number(req.params.id), f.title ?? null, f.url ?? null, f.blurb ?? null, f.category ?? null,
     f.origin ?? null, typeof f.is_featured === 'boolean' ? f.is_featured : null,
     typeof f.in_ship_log === 'boolean' ? f.in_ship_log : null, f.shipped_at ?? null, f.sort_order ?? null]
  );
  res.json({ data: rows[0] });
}));

router.delete('/picks/:id', wrap(async (req, res) => {
  await query(`DELETE FROM picks WHERE id = $1`, [Number(req.params.id)]);
  res.json({ ok: true });
}));

// ---------------- Ask Lokesh inbox ----------------

router.get('/ask', wrap(async (_req, res) => {
  const { rows } = await query(
    `SELECT q.*, m.handle AS author,
            (SELECT COUNT(*)::int FROM ask_votes WHERE question_id = q.id) AS votes
       FROM ask_questions q JOIN community_members m ON m.id = q.member_id
      ORDER BY q.created_at DESC`
  );
  res.json({ data: rows });
}));

router.patch('/ask/:id', wrap(async (req, res) => {
  const { answer, is_hidden } = req.body || {};
  const { rows } = await query(
    `UPDATE ask_questions SET answer = COALESCE($2, answer),
            answered_at = CASE WHEN $2 IS NOT NULL THEN now() ELSE answered_at END,
            is_hidden = COALESCE($3, is_hidden)
      WHERE id = $1 RETURNING *`,
    [Number(req.params.id), answer ?? null, typeof is_hidden === 'boolean' ? is_hidden : null]
  );
  res.json({ data: rows[0] });
}));

router.delete('/ask/:id', wrap(async (req, res) => {
  await query(`DELETE FROM ask_questions WHERE id = $1`, [Number(req.params.id)]);
  res.json({ ok: true });
}));

// ---------------- Site content ----------------

router.put('/content/:key', wrap(async (req, res) => {
  const { rows } = await query(
    `INSERT INTO site_singletons (key, value) VALUES ($1, $2)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
     RETURNING *`,
    [req.params.key, req.body?.value ?? {}]
  );
  res.json({ data: rows[0] });
}));

for (const [path, table] of [['media', 'media_mentions'], ['trending', 'trending_topics']]) {
  router.get(`/${path}`, wrap(async (_req, res) => {
    const { rows } = await query(`SELECT * FROM ${table} ORDER BY sort_order NULLS LAST, id`);
    res.json({ data: rows });
  }));
  router.delete(`/${path}/:id`, wrap(async (req, res) => {
    await query(`DELETE FROM ${table} WHERE id = $1`, [Number(req.params.id)]);
    res.json({ ok: true });
  }));
}

router.post('/media', wrap(async (req, res) => {
  const { outlet, quote, url, logo_url, published_at, sort_order = 0 } = req.body || {};
  if (!outlet || !url) return res.status(400).json({ error: 'outlet and url required' });
  const { rows } = await query(
    `INSERT INTO media_mentions (outlet, quote, url, logo_url, published_at, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [outlet, quote || null, url, logo_url || null, published_at || null, sort_order]
  );
  res.json({ data: rows[0] });
}));

router.post('/trending', wrap(async (req, res) => {
  const { label, url, rank = 0, is_active = true } = req.body || {};
  if (!label) return res.status(400).json({ error: 'label required' });
  const { rows } = await query(
    `INSERT INTO trending_topics (label, url, rank, is_active) VALUES ($1,$2,$3,$4) RETURNING *`,
    [label, url || null, rank, !!is_active]
  );
  res.json({ data: rows[0] });
}));

router.patch('/trending/:id', wrap(async (req, res) => {
  const f = req.body || {};
  const { rows } = await query(
    `UPDATE trending_topics SET label = COALESCE($2,label), url = COALESCE($3,url),
            rank = COALESCE($4,rank), is_active = COALESCE($5,is_active), updated_at = now()
      WHERE id = $1 RETURNING *`,
    [Number(req.params.id), f.label ?? null, f.url ?? null, f.rank ?? null,
     typeof f.is_active === 'boolean' ? f.is_active : null]
  );
  res.json({ data: rows[0] });
}));

// ---------------- Members + reports ----------------

router.get('/members', wrap(async (_req, res) => {
  const { rows } = await query(
    `SELECT id, email, name, handle, role, is_blocked, created_at, last_seen_at
       FROM community_members ORDER BY created_at DESC LIMIT 500`
  );
  res.json({ data: rows });
}));

router.patch('/members/:id', wrap(async (req, res) => {
  const { is_blocked } = req.body || {};
  const { rows } = await query(
    `UPDATE community_members SET is_blocked = COALESCE($2, is_blocked) WHERE id = $1
      RETURNING id, handle, is_blocked`,
    [Number(req.params.id), typeof is_blocked === 'boolean' ? is_blocked : null]
  );
  res.json({ data: rows[0] });
}));

router.get('/reports', wrap(async (_req, res) => {
  const { rows } = await query(
    `SELECT r.entity_type, r.entity_id, COUNT(*)::int AS reports,
            MAX(r.created_at) AS last_reported,
            array_agg(DISTINCT r.reason) FILTER (WHERE r.reason IS NOT NULL) AS reasons
       FROM content_reports r
      GROUP BY r.entity_type, r.entity_id
      ORDER BY reports DESC, last_reported DESC`
  );
  res.json({ data: rows });
}));

// ---------------- Tools catalog (seed the ranking list ahead of the tracker) ----------------

router.get('/tools', wrap(async (_req, res) => {
  const { rows } = await query(`SELECT * FROM tools_catalog ORDER BY name`);
  res.json({ data: rows });
}));

router.put('/tools/:slug', wrap(async (req, res) => {
  const { name, category, icon_url } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name required' });
  const { rows } = await query(
    `INSERT INTO tools_catalog (slug, name, category, icon_url) VALUES ($1,$2,$3,$4)
     ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, category = EXCLUDED.category, icon_url = EXCLUDED.icon_url
     RETURNING *`,
    [req.params.slug, name, category || null, icon_url || null]
  );
  res.json({ data: rows[0] });
}));

router.delete('/tools/:slug', wrap(async (req, res) => {
  await query(`DELETE FROM tools_catalog WHERE slug = $1`, [req.params.slug]);
  res.json({ ok: true });
}));

export default router;
