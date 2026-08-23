import nodemailer from 'nodemailer';
import 'dotenv/config';

const FROM = `"MenOfMatrix" <${process.env.SMTP_USER}>`;

let transporter = null;

function getTransporter() {
  if (!transporter) {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.APP_PASSWORD) {
      throw new Error('SMTP is not configured (missing SMTP_HOST / SMTP_USER / APP_PASSWORD)');
    }
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.APP_PASSWORD,
      },
    });
  }
  return transporter;
}

/** Send one email. Returns the provider response. */
export async function sendMail({ to, subject, html, text }) {
  return getTransporter().sendMail({ from: FROM, to, subject, html, text });
}

/** Verify SMTP credentials at startup / on demand. */
export async function verifySmtp() {
  try {
    await getTransporter().verify();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/** Wrap plain-text body in a simple branded template. */
export function newsletterTemplate(subject, body) {
  const paragraphs = body
    .split(/\n{2,}|\r\n\r\n/)
    .map((p) => `<p style="margin:0 0 16px;line-height:1.6">${p.replace(/\n/g, '<br/>')}</p>`)
    .join('');
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#333840;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <div style="background:#181d26;border-radius:12px;padding:24px;text-align:center;">
      <span style="color:#ffffff;font-size:20px;font-weight:600;letter-spacing:1px;">MenOfMatrix</span>
    </div>
    <div style="background:#ffffff;border:1px solid #dddddd;border-top:none;border-radius:0 0 12px 12px;padding:32px 24px;">
      <h1 style="margin:0 0 20px;font-size:22px;font-weight:500;color:#181d26;">${subject}</h1>
      ${paragraphs}
      <hr style="border:none;border-top:1px solid #dddddd;margin:32px 0 16px;" />
      <p style="margin:0;font-size:12px;color:#41454d;">
        You received this because you subscribed at MenOfMatrix.
        <br/>Want out? Reply with "unsubscribe" and we'll remove you.
      </p>
    </div>
  </div>
</body></html>`;
}
