import { Router } from 'express';
import { syncAll } from '../services/syncService.js';
import { fetchAllNews } from '../services/newsService.js';

const router = Router();

/**
 * Secret guard for scheduled jobs. Accepts either:
 *   - header `x-cron-secret: <CRON_SECRET>`   (cron-job.org custom headers)
 *   - header `Authorization: Bearer <CRON_SECRET>` (Vercel Cron / GitHub Actions)
 */
export function requireCronSecret(req, res, next) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return res.status(500).json({ error: 'CRON_SECRET is not configured' });
  const auth = req.headers.authorization || '';
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (req.get('x-cron-secret') === secret || bearer === secret) return next();
  return res.status(401).json({ error: 'Unauthorized' });
}

// Triggered hourly by an external scheduler (cron-job.org / GitHub Actions / Vercel Cron on Pro)
router.all('/sync', requireCronSecret, async (_req, res) => {
  try {
    const result = await syncAll();
    console.log(`[cron] sync ok: ${result.totalMedia} media`);
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error('[cron] sync failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Triggered every 15 minutes by an external scheduler
router.all('/news', requireCronSecret, async (_req, res) => {
  try {
    const result = await fetchAllNews();
    console.log(`[cron] news ok: +${result.inserted} new`);
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error('[cron] news failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
