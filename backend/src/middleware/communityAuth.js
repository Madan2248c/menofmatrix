import jwt from 'jsonwebtoken';
import 'dotenv/config';
import { query } from '../config/db.js';

/**
 * Load the community member behind a Bearer JWT (issued by POST /api/auth/google).
 * Returns the member row, or null if the token is missing/invalid/blocked.
 */
async function memberFromRequest(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
  if (!payload?.mid) return null;
  const { rows } = await query(
    `SELECT id, google_sub, email, name, avatar_url, handle, role, is_blocked
       FROM community_members WHERE id = $1`,
    [payload.mid]
  );
  const member = rows[0];
  if (!member || member.is_blocked) return null;
  return member;
}

/** Hard guard: 401 if not a signed-in member, 403 handled implicitly (blocked -> null). */
export async function requireMember(req, res, next) {
  const member = await memberFromRequest(req);
  if (!member) return res.status(401).json({ error: 'Sign in required' });
  req.member = member;
  next();
}

/** Soft guard: attaches req.member when present, always continues. */
export async function optionalMember(req, _res, next) {
  req.member = await memberFromRequest(req);
  next();
}
