import { Router } from 'express';
import 'dotenv/config';
import { requireOwner } from '../middleware/requireOwner.js';
import { latestNews, fetchAllNews } from '../services/newsService.js';

const router = Router();

/** Public: latest AI news. */
router.get('/', async (req, res) => {
  try {
    const data = await latestNews(req.query.limit);
    // Only cache a successful response — set the header after the await so a
    // 500 isn't pinned in the CDN for 60s.
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
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
