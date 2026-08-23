import { Router } from 'express';
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import { latestNews, fetchAllNews } from '../services/newsService.js';

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

/** Public: latest AI news. */
router.get('/', async (req, res) => {
  try {
    const data = await latestNews(req.query.limit);
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** Owner: force a refresh now. */
router.post('/refresh', requireOwner, async (_req, res) => {
  try {
    const r = await fetchAllNews();
    res.json({ ok: true, ...r });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
