import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import authRoutes from './routes/auth.js';
import apiRoutes from './routes/api.js';
import newsletterRoutes from './routes/newsletter.js';
import newsRoutes from './routes/news.js';
import { syncAll } from './services/syncService.js';
import { fetchAllNews } from './services/newsService.js';

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/news', newsRoutes);
app.use('/api', apiRoutes);

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[error]', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Backend listening on http://localhost:${port}`));

// Hourly full sync (respects ~200 req/h Graph limit for typical account sizes)
cron.schedule('0 * * * *', async () => {
  console.log('[cron] hourly sync starting');
  try {
    const r = await syncAll();
    console.log(`[cron] sync ok: ${r.totalMedia} media across ${r.accounts?.length ?? 0} account(s)`);
  } catch (err) {
    console.error('[cron] sync failed:', err.message);
  }
});

// AI news: poll the RSS stack every 15 minutes
cron.schedule('*/15 * * * *', async () => {
  try {
    const r = await fetchAllNews();
    console.log(`[cron] news ok: +${r.inserted} new (${r.errors.length} feed errors)`);
  } catch (err) {
    console.error('[cron] news failed:', err.message);
  }
});

// Fetch once at boot so the feed is never empty
fetchAllNews()
  .then((r) => console.log(`[news] boot fetch: +${r.inserted} new from ${r.perFeed.length} feeds`))
  .catch((err) => console.error('[news] boot fetch failed:', err.message));
