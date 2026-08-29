import { ApifyClient } from 'apify-client';
import { query } from '../config/db.js';
import { uploadFollowerAvatar } from './storageService.js';

// No-cookie, no-login followers scraper (pay-per-event, has a free console-run budget).
// https://apify.com/scraping_solutions/instagram-scraper-followers-following-no-cookies
const ACTOR_ID = 'scraping_solutions/instagram-scraper-followers-following-no-cookies';
const MAX_ITEMS_CAP = 500;

/* eslint-disable max-len */
/**
 * Scrape the follower list for one IG account via Apify and cache it in ig_followers.
 * Runs only from the owner "Sync follower list" trigger — public pages read the
 * cached table only.
 */
export async function syncFollowersList(accountId) {
  if (!process.env.APIFY_TOKEN) {
    throw new Error('APIFY_TOKEN not configured (Apify console → API & Integrations)');
  }

  const { rows: accounts } = await query('SELECT id, username FROM ig_accounts WHERE id = $1', [accountId]);
  const account = accounts[0];
  if (!account) throw new Error(`Instagram account ${accountId} not found`);

  const { rows: snaps } = await query(
    'SELECT followers_count FROM account_snapshots WHERE account_id = $1 ORDER BY snapshot_date DESC LIMIT 1',
    [accountId]
  );
  const followersCount = Number(snaps[0]?.followers_count) || 300;
  const maxItems = Math.min(followersCount, MAX_ITEMS_CAP);

  const startedAt = new Date();
  const client = new ApifyClient({ token: process.env.APIFY_TOKEN });
  const run = await client.actor(ACTOR_ID).call({
    Account: [account.username],
    resultsLimit: maxItems,
    dataToScrape: 'Followers',
  });
  const { items } = await client.dataset(run.defaultDatasetId).listItems();

  let upserted = 0;
  for (const item of items) {
    // The no-cookie actor appends a cursor record as the last item — skip it
    if (!item.id && !item.pk && !item.username) continue;
    const followerId = String(item.pk ?? item.id);
    if (!followerId) continue;
    await query(
      `INSERT INTO ig_followers (account_id, follower_id, username, full_name,
                                 profile_pic_url, is_private, is_verified, synced_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, now())
       ON CONFLICT (account_id, follower_id) DO UPDATE SET
         username = EXCLUDED.username,
         full_name = EXCLUDED.full_name,
         profile_pic_url = EXCLUDED.profile_pic_url,
         is_private = EXCLUDED.is_private,
         is_verified = EXCLUDED.is_verified,
         synced_at = now()`,
      [
        accountId,
        followerId,
        item.username ?? null,
        item.full_name ?? null,
        item.profile_pic_url ?? null,
        item.is_private ?? null,
        item.is_verified ?? null,
      ]
    );
    upserted++;
  }

  // Prune rows not present in this run (unfollowers) for this account
  const { rows: prunedRows } = await query(
    `WITH del AS (
       DELETE FROM ig_followers
       WHERE account_id = $1 AND synced_at < $2
       RETURNING 1
     ) SELECT count(*)::int AS pruned FROM del`,
    [accountId, startedAt]
  );

  // Cache avatars on our own storage: the IG CDN sends
  // cross-origin-resource-policy: same-origin, so browser <img> tags cannot
  // hotlink these URLs (curl works, Chrome blocks). Best-effort — a failed
  // avatar keeps the raw CDN URL in profile_pic_url as fallback.
  const avatars = await cacheAvatars(
    accountId,
    items
      .filter((i) => (i.pk ?? i.id) && i.profile_pic_url)
      .map((i) => [String(i.pk ?? i.id), i.profile_pic_url])
  );

  return { scraped: items.length, upserted, pruned: prunedRows[0]?.pruned ?? 0, maxItems, avatars };
}

/** Download avatars and store them in S3; sets avatar_url on each row. Best-effort. */
export async function cacheAvatars(accountId, pairs) {
  const BATCH = 12;
  let cached = 0;
  for (let i = 0; i < pairs.length; i += BATCH) {
    await Promise.all(
      pairs.slice(i, i + BATCH).map(async ([followerId, picUrl]) => {
        try {
          const res = await fetch(picUrl);
          if (!res.ok) return;
          const buffer = Buffer.from(await res.arrayBuffer());
          const { url } = await uploadFollowerAvatar(
            accountId,
            followerId,
            buffer,
            res.headers.get('content-type') || 'image/jpeg'
          );
          await query(
            'UPDATE ig_followers SET avatar_url = $1 WHERE account_id = $2 AND follower_id = $3',
            [url, accountId, followerId]
          );
          cached++;
        } catch {
          // keep the CDN URL as fallback
        }
      })
    );
  }
  return cached;
}
/* eslint-enable max-len */