import { Router } from 'express';
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import { query } from '../config/db.js';
import { sendMail, verifySmtp, newsletterTemplate } from '../services/mailer.js';

const router = Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function requireOwner(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  try {
    jwt.verify(token || '', process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

/** Public: newsletter signup (+ welcome email). */
router.post('/subscribe', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address' });
  }
  try {
    const { rows } = await query(
      `INSERT INTO newsletter_subscribers (email) VALUES ($1)
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      [email]
    );
    const isNew = rows.length > 0;

    // Fire-and-forget welcome mail — never block or fail the signup on it
    if (isNew) {
      sendMail({
        to: email,
        subject: 'Welcome to the MenOfMatrix newsletter',
        html: newsletterTemplate(
          'Welcome aboard 🖤',
          'You are on the list.\n\nExpect the best from MenOfMatrix — new drops, updates and behind-the-scenes notes, straight to your inbox.'
        ),
        text: 'Welcome aboard — you are on the MenOfMatrix list.',
      }).catch((err) => console.error('[mailer] welcome mail failed:', err.message));
    }

    res.json({ ok: true, alreadySubscribed: !isNew });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** Owner: subscriber count + list. */
router.get('/subscribers', requireOwner, async (_req, res) => {
  const { rows } = await query(
    `SELECT id, email, created_at FROM newsletter_subscribers ORDER BY created_at DESC`
  );
  res.json({ count: rows.length, data: rows });
});

/** Owner: check SMTP connection. */
router.get('/smtp-status', requireOwner, async (_req, res) => {
  res.json(await verifySmtp());
});

/** Owner: send a newsletter to all subscribers. */
router.post('/send', requireOwner, async (req, res) => {
  const subject = String(req.body?.subject || '').trim();
  const body = String(req.body?.body || '').trim();
  if (!subject || !body) {
    return res.status(400).json({ error: 'Subject and body are required' });
  }
  try {
    const { rows } = await query(`SELECT email FROM newsletter_subscribers`);
    if (!rows.length) return res.status(400).json({ error: 'No subscribers yet' });

    const html = newsletterTemplate(subject, body);
    let sent = 0;
    const failures = [];
    for (const { email } of rows) {
      try {
        await sendMail({ to: email, subject: `MenOfMatrix — ${subject}`, html, text: body });
        sent++;
      } catch (err) {
        failures.push({ email, error: err.message });
      }
    }
    res.json({ ok: failures.length === 0, sent, total: rows.length, failures });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

