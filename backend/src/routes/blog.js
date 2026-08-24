import { Router } from 'express';
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import {
  listPublished,
  listAll,
  getPublishedBySlug,
  getById,
  createPost,
  updatePost,
  deletePost,
} from '../services/blogService.js';

const router = Router();

function requireOwner(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  try {
    jwt.verify(token || '', process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

/** Owner: every post including drafts. */
router.get('/admin/all', requireOwner, async (_req, res) => {
  try {
    const data = await listAll();
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** Public: published posts, newest first. */
router.get('/', async (req, res) => {
  try {
    const data = await listPublished(req.query.limit);
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** Public: one published post by slug. */
router.get('/:slug', async (req, res) => {
  try {
    const post = await getPublishedBySlug(req.params.slug);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json({ post });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** Owner: create a post (draft or published). */
router.post('/', requireOwner, async (req, res) => {
  try {
    const post = await createPost(req.body || {});
    res.json({ ok: true, post });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/** Owner: update an existing post. */
router.put('/:id', requireOwner, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });
    const post = await updatePost(id, req.body || {});
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json({ ok: true, post });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/** Owner: delete a post. */
router.delete('/:id', requireOwner, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });
    const deleted = await deletePost(id);
    if (!deleted) return res.status(404).json({ error: 'Post not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
