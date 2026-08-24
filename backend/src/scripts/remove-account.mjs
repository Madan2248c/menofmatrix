import { Pool } from 'pg';
import 'dotenv/config';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const needsSsl = !/(localhost|127\.0\.0\.1)/.test(DATABASE_URL);
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: needsSsl ? { rejectUnauthorized: false } : false,
});

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Identify account
    const { rows: found } = await client.query(
      `SELECT id, ig_user_id, username FROM ig_accounts WHERE username = $1`,
      ['mad13323']
    );
    if (!found.length) {
      console.log('Account "mad13323" not found.');
      await client.query('ROLLBACK');
      return;
    }
    const account = found[0];
    console.log(`Found account id=${account.id} ig_user_id=${account.ig_user_id} username=${account.username}`);

    // 1. Comments (automation rules/actions cascade when the account is deleted)
    const { rowCount: commentCount } = await client.query(
      `DELETE FROM comments WHERE account_id = $1`,
      [account.id]
    );

    // 2. Post insight snapshots
    const { rowCount: snapCount } = await client.query(
      `DELETE FROM post_insight_snapshots WHERE post_id IN (
        SELECT id FROM posts WHERE account_id = $1
      )`,
      [account.id]
    );

    // 3. Posts
    const { rowCount: postCount } = await client.query(
      `DELETE FROM posts WHERE account_id = $1`,
      [account.id]
    );

    // 4. Account snapshots
    const { rowCount: acctSnapCount } = await client.query(
      `DELETE FROM account_snapshots WHERE account_id = $1`,
      [account.id]
    );

    // 5. The account itself
    const { rowCount: accountCount } = await client.query(
      `DELETE FROM ig_accounts WHERE id = $1`,
      [account.id]
    );

    await client.query('COMMIT');

    console.log('\nDeleted rows:');
    console.log(`  comments           : ${commentCount}`);
    console.log(`  post_insight_snapshots: ${snapCount}`);
    console.log(`  posts              : ${postCount}`);
    console.log(`  account_snapshots  : ${acctSnapCount}`);
    console.log(`  ig_accounts        : ${accountCount}`);
    console.log('(automation_rules and automation_actions cascade-deleted with the account)');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Transaction failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
  }
}

run()
  .then(() => pool.end())
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
