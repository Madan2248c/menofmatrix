import 'dotenv/config';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const needsSsl = !/(localhost|127\.0\.0\.1)/.test(process.env.DATABASE_URL || '');
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: needsSsl ? { rejectUnauthorized: false } : false,
});

async function apply(file, sql) {
  try {
    await pool.query(sql);
    console.log(`✅ applied ${file}`);
  } catch (err) {
    console.error(`❌ failed ${file}:`, err.message);
    process.exitCode = 1;
  }
}

const base = path.join(__dirname, '../..');
await apply('db/schema.sql', readFileSync(path.join(base, 'db/schema.sql'), 'utf8'));

const migDir = path.join(base, 'db/migrations');
let files = [];
try {
  files = readdirSync(migDir).filter((f) => f.endsWith('.sql')).sort();
} catch { /* no migrations dir */ }
for (const f of files) {
  await apply(`db/migrations/${f}`, readFileSync(path.join(migDir, f), 'utf8'));
}

await pool.end();

