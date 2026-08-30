import { Router } from 'express';
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import { OAuth2Client } from 'google-auth-library';
import { query } from '../config/db.js';

const router = Router();

/** Simple owner login: password from env -> JWT cookie-less bearer token. */
router.post('/login', (req, res) => {
  const { password } = req.body || {};
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' });
  }
  const token = jwt.sign({ role: 'owner' }, process.env.JWT_SECRET, { expiresIn: '30d' });
  res.json({ token });
});

const WEB_GOOGLE_CLIENT_ID = process.env.GOOGLE_WEB_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(WEB_GOOGLE_CLIENT_ID);

/**
 * Public visitor sign-in: the browser (Google Identity Services) sends the ID
 * token as `credential`; we verify it, upsert a community_members row, and
 * hand back our own 30-day JWT ({ mid, sub, role }) for /api/community writes.
 */
router.post('/google', async (req, res) => {
  const { credential } = req.body || {};
  if (!credential) return res.status(400).json({ error: 'Missing credential' });

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: WEB_GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch {
    return res.status(401).json({ error: 'Invalid Google credential' });
  }

  const sub = payload.sub;
  const email = payload.email || null;
  const name = payload.name || null;
  const avatar = payload.picture || null;
  const baseHandle = (email ? email.split('@')[0] : `member${sub.slice(-6)}`)
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '')
    .slice(0, 24) || `member${sub.slice(-6)}`;

  const upsert = (handle) =>
    query(
      `INSERT INTO community_members (google_sub, email, name, avatar_url, handle)
         VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (google_sub) DO UPDATE
         SET email = EXCLUDED.email,
             name = EXCLUDED.name,
             avatar_url = EXCLUDED.avatar_url,
             last_seen_at = now()
       RETURNING id, email, name, avatar_url, handle, role, is_blocked`,
      [sub, email, name, avatar, handle]
    );

  try {
    let member;
    try {
      ({ rows: [member] } = await upsert(baseHandle));
    } catch (e) {
      // handle already taken by a different member -> suffix and retry once
      if (e.code === '23505') ({ rows: [member] } = await upsert(`${baseHandle}${sub.slice(-4)}`));
      else throw e;
    }

    if (member.is_blocked) return res.status(403).json({ error: 'Account suspended' });

    const token = jwt.sign(
      { mid: member.id, sub, role: member.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    res.json({ token, member });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** Step 1 of OAuth: give frontend the Instagram authorize URL. */
router.get('/instagram/url', (req, res) => {
  const url = new URL('https://www.instagram.com/oauth/authorize');
  url.searchParams.set('client_id', process.env.IG_APP_ID);
  url.searchParams.set('redirect_uri', process.env.IG_REDIRECT_URI);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set(
    'scope',
    'instagram_business_basic,instagram_business_manage_insights,' +
      'instagram_business_manage_comments,instagram_business_manage_messages'
  );
  res.json({ url: url.toString() });
});

/** Step 2 of OAuth: Meta redirects here with ?code=... */
router.get('/callback', async (req, res) => {
  const { code, error_description: errDesc } = req.query;
  if (errDesc) return res.status(400).send(`Instagram auth error: ${errDesc}`);
  if (!code) return res.status(400).send('Missing code');

  try {
    const { exchangeCodeForToken } = await import('../services/tokenStore.js');
    const result = await exchangeCodeForToken(code);
    res.send(
      `<h2>✅ Instagram connected</h2>
       <p><strong>@${result.username}</strong> is now linked (account #${result.accountId}),
       token valid until ${new Date(result.expiresAt).toDateString()}.</p>
       <p><strong>Granted permissions:</strong> ${result.grantedPermissions || '(not returned by Instagram)'}</p>
       <p>You can close this tab and open the dashboard.</p>`
    );
  } catch (err) {
    res.status(500).send(`Connection failed: ${err.message}`);
  }
});

export default router;
