/**
 * Local development entry point.
 * On Vercel, `api/index.js` serves the same app as a serverless function,
 * and scheduled jobs run via external schedulers hitting /api/cron/*.
 */
import 'dotenv/config';
import cron from 'node-cron';
import app from './server-app.js';
import { syncAll } from './services/syncService.js';
import { fetchAllNews } from './services/newsService.js';
import { communityRollup } from './services/communityService.js';

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

// Nightly YouTube sync (Analytics API has 1-day latency and tighter quota than Instagram)
cron.schedule('0 2 * * *', async () => {
  console.log('[cron] nightly YouTube sync starting');
  try {
    const { syncAll: syncYoutube } = await import('./services/youtubeService.js');
    const r = await syncYoutube();
    console.log(`[cron] youtube sync ok: ${r.totalVideos} videos + ${r.totalShorts} shorts`);
  } catch (err) {
    console.error('[cron] youtube sync failed:', err.message);
  }
});

// Community weekly rollup: close expired polls + snapshot tool-usage ranks (Mon 00:10)
cron.schedule('10 0 * * 1', async () => {
  try {
    const r = await communityRollup();
    console.log(`[cron] community-rollup ok: ${r.pollsClosed} polls closed, ${r.toolsRolledUp} tools`);
  } catch (err) {
    console.error('[cron] community-rollup failed:', err.message);
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

