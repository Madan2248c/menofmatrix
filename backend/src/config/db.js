import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

// Neon requires SSL; local postgres does not.
const needsSsl = !/(localhost|127\.0\.0\.1)/.test(process.env.DATABASE_URL || '');

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: needsSsl ? { rejectUnauthorized: false } : false,
  max: 5,
});

export const query = (text, params) => pool.query(text, params);
