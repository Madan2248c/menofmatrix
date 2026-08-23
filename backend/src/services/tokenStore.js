import 'dotenv/config';
import { query } from '../config/db.js';

const GRAPH = `https://graph.instagram.com/${process.env.IG_GRAPH_VERSION || 'v23.0'}`;

// ---------- account management ----------

export async function listAccounts() {
  const { rows } = await query(
    `SELECT id, ig_user_id, username, expires_at, connected_at FROM ig_accounts ORDER BY id`
  );
  return rows;
}

export async function getAccount(id) {
  const { rows } = await query(
    `SELECT id, ig_user_id, username, access_token, expires_at FROM ig_accounts WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}

export async function getFirstAccountId() {
  const { rows } = await query(`SELECT MIN(id) AS id FROM ig_accounts`);
  return rows[0]?.id ?? null;
}

/** Upsert an account connection by its Instagram user id. */
export async function saveAccount({ igUserId, username, accessToken, expiresAt }) {
  const { rows } = await query(
    `INSERT INTO ig_accounts (ig_user_id, username, access_token, expires_at)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (ig_user_id) DO UPDATE SET
       username = COALESCE(EXCLUDED.username, ig_accounts.username),
       access_token = EXCLUDED.access_token,
       expires_at = EXCLUDED.expires_at,
       connected_at = now()
     RETURNING id, ig_user_id, username`,
    [String(igUserId), username || null, accessToken, expiresAt]
  );
  return rows[0];
}

export async function deleteAccount(id) {
  await query(`DELETE FROM ig_accounts WHERE id = $1`, [id]);
}

// ---------- graph helpers ----------

/**
 * GET a Graph API path using a specific account's token.
 * Throws Error with .apiCode on Graph errors.
 */
export async function graphGet(accountId, path, params = {}) {
  const acct = await getAccount(accountId);
  if (!acct) throw Object.assign(new Error('Account not found'), { code: 'NO_ACCOUNT' });

  const url = new URL(`${GRAPH}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set('access_token', acct.access_token);

  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok) {
    const msg = json?.error?.message || `Graph API error ${res.status}`;
    throw Object.assign(new Error(msg), { apiCode: json?.error?.code });
  }
  return json;
}

/** Same as graphGet but with a raw token (used during OAuth before an account exists). */
export async function graphGetWithToken(accessToken, path, params = {}) {
  const url = new URL(`${GRAPH}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set('access_token', accessToken);
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error?.message || `Graph API error ${res.status}`);
  }
  return json;
}

/** Exchange OAuth code -> short-lived -> long-lived token, then upsert the account. */
export async function exchangeCodeForToken(code) {
  // Step 1: short-lived token
  const body = new URLSearchParams({
    client_id: process.env.IG_APP_ID,
    client_secret: process.env.IG_APP_SECRET,
    grant_type: 'authorization_code',
    redirect_uri: process.env.IG_REDIRECT_URI,
    code,
  });
  const res = await fetch('https://api.instagram.com/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const short = await res.json();
  if (!res.ok) throw new Error(short?.error_message || 'Token exchange failed');

  // Step 2: long-lived token (~60 days)
  const llUrl = new URL('https://graph.instagram.com/access_token');
  llUrl.searchParams.set('grant_type', 'ig_exchange_token');
  llUrl.searchParams.set('client_secret', process.env.IG_APP_SECRET);
  llUrl.searchParams.set('access_token', short.access_token);
  const llRes = await fetch(llUrl);
  const long = await llRes.json();
  if (!llRes.ok) throw new Error(long?.error?.message || 'Long-lived token exchange failed');

  const expiresAt = new Date(Date.now() + (long.expires_in ?? 5184000) * 1000);

  // Step 3: identify the account and upsert it
  const profile = await graphGetWithToken(long.access_token, '/me', {
    fields: 'user_id,username',
  });
  const account = await saveAccount({
    igUserId: profile.user_id,
    username: profile.username,
    accessToken: long.access_token,
    expiresAt,
  });
  return { accountId: account.id, username: profile.username, expiresAt };
}

/** Refresh a long-lived token when it will expire within `days` (default 7). */
export async function ensureFreshToken(accountId, days = 7) {
  const acct = await getAccount(accountId);
  if (!acct) return false;
  const msLeft = new Date(acct.expires_at) - Date.now();
  if (msLeft > days * 24 * 3600 * 1000) return false;

  const url = new URL('https://graph.instagram.com/refresh_access_token');
  url.searchParams.set('grant_type', 'ig_refresh_token');
  url.searchParams.set('access_token', acct.access_token);
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok) {
    console.error(`[token] refresh failed for ${acct.username}:`, json?.error?.message);
    return false;
  }
  const expiresAt = new Date(Date.now() + (json.expires_in ?? 5184000) * 1000);
  await query(`UPDATE ig_accounts SET access_token=$1, expires_at=$2 WHERE id=$3`, [
    json.access_token,
    expiresAt,
    accountId,
  ]);
  console.log(`[token] refreshed ${acct.username}, valid until ${expiresAt.toISOString()}`);
  return true;
}

