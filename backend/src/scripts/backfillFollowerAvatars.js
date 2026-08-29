// One-off: cache avatars for ig_followers rows already in the DB.
// Usage: node src/scripts/backfillFollowerAvatars.js
import { query } from '../config/db.js';
import { cacheAvatars } from '../services/apifyFollowers.js';

const { rows } = await query(
  `SELECT account_id, follower_id, profile_pic_url
     FROM ig_followers
    WHERE profile_pic_url IS NOT NULL`
);
console.log(`Backfilling ${rows.length} avatars…`);
const grouped = new Map();
for (const row of rows) {
  const pairs = grouped.get(row.account_id) || [];
  pairs.push([String(row.follower_id), row.profile_pic_url]);
  grouped.set(row.account_id, pairs);
}
let total = 0;
for (const [accountId, pairs] of grouped) {
  const cached = await cacheAvatars(accountId, pairs);
  total += cached;
  console.log(`account ${accountId}: ${cached}/${pairs.length} cached`);
}
console.log(`Done — ${total} avatars cached`);
process.exit(0);