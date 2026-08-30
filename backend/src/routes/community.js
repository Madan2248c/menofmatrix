import { Router } from 'express';
import { query } from '../config/db.js';
import { requireMember, optionalMember } from '../middleware/communityAuth.js';
import * as svc from '../services/communityService.js';

const router = Router();
const wrap = (fn) => (req, res) => fn(req, res).catch((e) => res.status(500).json({ error: e.message }));

// ---------------- Public reads (member-aware) ----------------

router.get('/polls', optionalMember, wrap(async (req, res) => {
  const data = await svc.listPolls({ kind: req.query.kind, memberId: req.member?.id });
  res.json({ data });
}));

router.get('/polls/:id/results', wrap(async (req, res) => {
  const data = await svc.pollResults(Number(req.params.id));
  if (!data) return res.status(404).json({ error: 'Poll not found' });
  res.json({ data });
}));

router.get('/ideas', optionalMember, wrap(async (req, res) => {
  res.json({ data: await svc.listIdeas({ sort: req.query.sort, memberId: req.member?.id }) });
}));

router.get('/challenges/current', optionalMember, wrap(async (req, res) => {
  res.json({ data: await svc.currentChallenge({ memberId: req.member?.id }) });
}));

router.get('/picks', wrap(async (req, res) => {
  res.json(await svc.listPicks({ featured: req.query.featured, shipped: req.query.shipped }));
}));

router.get('/ask', optionalMember, wrap(async (req, res) => {
  res.json({ data: await svc.listAsk({ sort: req.query.sort, memberId: req.member?.id }) });
}));

router.get('/trending', wrap(async (_req, res) => {
  const { rows } = await query(
    `SELECT id, label, url, rank, movement FROM trending_topics
      WHERE is_active = TRUE ORDER BY rank, id`
  );
  res.json({ data: rows });
}));

router.get('/media', wrap(async (_req, res) => {
  const { rows } = await query(
    `SELECT id, outlet, quote, url, logo_url, published_at FROM media_mentions
      ORDER BY sort_order, published_at DESC NULLS LAST, id DESC`
  );
  res.json({ data: rows });
}));

router.get('/content/:key', wrap(async (req, res) => {
  const { rows } = await query(`SELECT value FROM site_singletons WHERE key = $1`, [req.params.key]);
  res.json({ data: rows[0]?.value ?? null });
}));

router.get('/activity', wrap(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  res.json({ data: await svc.recentActivity(limit) });
}));

router.get('/leaderboard', wrap(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 10, 50);
  res.json({ data: await svc.leaderboard(limit) });
}));

router.get('/me', requireMember, wrap(async (req, res) => {
  res.json({ data: { ...req.member, ...(await svc.memberScore(req.member.id)) } });
}));

// RESERVED — empty until a usage tracker feeds member_tool_usage.
router.get('/rankings', wrap(async (_req, res) => {
  res.json({ data: await svc.toolRankings() });
}));

// ---------------- Member writes ----------------

router.post('/polls/:id/vote', requireMember, wrap(async (req, res) => {
  const optionId = Number(req.body?.option_id);
  if (!optionId) return res.status(400).json({ error: 'option_id required' });
  await svc.castVote({ pollId: Number(req.params.id), optionId, memberId: req.member.id });
  res.json({ data: await svc.pollResults(Number(req.params.id)) });
}));

router.post('/ideas', requireMember, wrap(async (req, res) => {
  const { title, body } = req.body || {};
  if (!title?.trim()) return res.status(400).json({ error: 'title required' });
  const { rows } = await query(
    `INSERT INTO ideas (member_id, title, body) VALUES ($1, $2, $3) RETURNING id`,
    [req.member.id, title.trim().slice(0, 160), (body || '').trim().slice(0, 2000) || null]
  );
  res.json({ data: { id: rows[0].id } });
}));

router.post('/ideas/:id/upvote', requireMember, wrap(async (req, res) => {
  await query(
    `INSERT INTO idea_votes (idea_id, member_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [Number(req.params.id), req.member.id]
  );
  res.json({ ok: true });
}));

router.delete('/ideas/:id/upvote', requireMember, wrap(async (req, res) => {
  await query(`DELETE FROM idea_votes WHERE idea_id = $1 AND member_id = $2`, [
    Number(req.params.id), req.member.id,
  ]);
  res.json({ ok: true });
}));

router.post('/challenges/:id/entries', requireMember, wrap(async (req, res) => {
  const { url, note } = req.body || {};
  if (!url?.trim()) return res.status(400).json({ error: 'url required' });
  const ok = await query(`SELECT 1 FROM challenges WHERE id = $1 AND status = 'open'`, [
    Number(req.params.id),
  ]);
  if (!ok.rowCount) return res.status(400).json({ error: 'Challenge not accepting entries' });
  const { rows } = await query(
    `INSERT INTO challenge_entries (challenge_id, member_id, url, note)
       VALUES ($1, $2, $3, $4) RETURNING id`,
    [Number(req.params.id), req.member.id, url.trim().slice(0, 500), (note || '').slice(0, 500) || null]
  );
  res.json({ data: { id: rows[0].id } });
}));

router.post('/challenge-entries/:id/vote', requireMember, wrap(async (req, res) => {
  await query(
    `INSERT INTO challenge_entry_votes (entry_id, member_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [Number(req.params.id), req.member.id]
  );
  res.json({ ok: true });
}));

router.delete('/challenge-entries/:id/vote', requireMember, wrap(async (req, res) => {
  await query(`DELETE FROM challenge_entry_votes WHERE entry_id = $1 AND member_id = $2`, [
    Number(req.params.id), req.member.id,
  ]);
  res.json({ ok: true });
}));

router.post('/ask', requireMember, wrap(async (req, res) => {
  const body = (req.body?.body || '').trim();
  if (!body) return res.status(400).json({ error: 'body required' });
  const { rows } = await query(
    `INSERT INTO ask_questions (member_id, body) VALUES ($1, $2) RETURNING id`,
    [req.member.id, body.slice(0, 280)]
  );
  res.json({ data: { id: rows[0].id } });
}));

router.post('/ask/:id/vote', requireMember, wrap(async (req, res) => {
  await query(
    `INSERT INTO ask_votes (question_id, member_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [Number(req.params.id), req.member.id]
  );
  res.json({ ok: true });
}));

router.delete('/ask/:id/vote', requireMember, wrap(async (req, res) => {
  await query(`DELETE FROM ask_votes WHERE question_id = $1 AND member_id = $2`, [
    Number(req.params.id), req.member.id,
  ]);
  res.json({ ok: true });
}));

router.post('/report', requireMember, wrap(async (req, res) => {
  const { entity_type, entity_id, reason } = req.body || {};
  if (!entity_type || !entity_id) return res.status(400).json({ error: 'entity_type and entity_id required' });
  const r = await svc.reportContent({
    entityType: entity_type,
    entityId: Number(entity_id),
    memberId: req.member.id,
    reason,
  });
  res.json({ data: r });
}));

export default router;
