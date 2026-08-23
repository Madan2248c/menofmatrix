import { Router } from 'express';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

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
       <p>You can close this tab and open the dashboard.</p>`
    );
  } catch (err) {
    res.status(500).send(`Connection failed: ${err.message}`);
  }
});

export default router;
