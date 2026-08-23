import 'dotenv/config';
import { pool } from '../config/db.js';

const ctx = await pool.query(
  "SELECT current_database() AS db, current_schema() AS schema, current_setting('search_path') AS search_path"
);
console.log('CONTEXT:', JSON.stringify(ctx.rows[0]));

const tables = await pool.query(
  `SELECT table_schema, table_name FROM information_schema.tables
   WHERE table_schema NOT IN ('pg_catalog','information_schema')
   ORDER BY table_schema, table_name`
);
console.log('ALL TABLES:');
for (const r of tables.rows) console.log(' -', r.table_schema + '.' + r.table_name);

const ig = await pool.query(
  `SELECT schemaname, tablename FROM pg_tables
   WHERE tablename LIKE 'ig%' OR tablename LIKE 'news%'`
);
console.log('IG/NEWS (pg_tables):', JSON.stringify(ig.rows));

const accounts = await pool.query(
  'SELECT id, username, ig_user_id, expires_at FROM ig_accounts'
);
console.log('ig_accounts rows:', JSON.stringify(accounts.rows));

await pool.end();
