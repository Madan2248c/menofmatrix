import 'dotenv/config';
import { saveAccount, graphGetWithToken } from '../services/tokenStore.js';
import { syncAll } from '../services/syncService.js';
import { pool } from '../config/db.js';

const token = process.argv[2];
if (!token) {
  console.error('Usage: node src/scripts/seed-token.mjs <access_token>');
  process.exit(1);
}

// Identify the account first
const profile = await graphGetWithToken(token, '/me', { fields: 'user_id,username' });
console.log(`📡 Account: @${profile.username} (${profile.user_id})`);

const expiresAt = new Date(Date.now() + 60 * 24 * 3600 * 1000);
await saveAccount({
  igUserId: profile.user_id,
  username: profile.username,
  accessToken: token,
  expiresAt,
});
console.log('✅ Account saved to DB, token valid until', expiresAt.toISOString());

console.log('🔄 Running sync...');
try {
  const r = await syncAll();
  console.log('✅ Sync result:', JSON.stringify(r));
} catch (err) {
  console.error('❌ Sync failed:', err.message);
}
await pool.end();

