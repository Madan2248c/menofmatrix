import { useEffect, useState } from 'react';
import { api } from '../api';

export default function Newsletters() {
  const [subscribers, setSubscribers] = useState(null);
  const [smtp, setSmtp] = useState(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const [subs, smtpStatus] = await Promise.all([
        api.newsletterSubscribers(),
        api.smtpStatus(),
      ]);
      setSubscribers(subs);
      setSmtp(smtpStatus);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const send = async (e) => {
    e.preventDefault();
    if (!confirm(`Send this newsletter to ${subscribers?.count ?? 0} subscriber(s)?`)) return;
    setSending(true);
    setError('');
    setResult(null);
    try {
      const r = await api.sendNewsletter(subject, body);
      setResult(r);
      if (r.ok) {
        setSubject('');
        setBody('');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: 24 }}>Newsletter</h2>

      <div className="metric-grid wide">
        <div className="card metric">
          <strong>{subscribers?.count ?? '—'}</strong>
          <span>Subscribers</span>
        </div>
        <div className="card metric">
          <strong>{smtp ? (smtp.ok ? '✅' : '❌') : '…'}</strong>
          <span>SMTP {smtp?.ok ? 'connected' : smtp ? smtp.error : 'checking'}</span>
        </div>
      </div>

      <div className="card">
        <h3>Compose</h3>
        <form onSubmit={send} className="compose">
          <input
            className="compose-subject"
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />
          <textarea
            rows={8}
            placeholder="Write your newsletter… (blank line = new paragraph)"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
          />
          <div>
            <button className="btn" disabled={sending || !subject || !body}>
              {sending ? 'Sending…' : `Send to ${subscribers?.count ?? 0} subscriber(s)`}
            </button>
          </div>
        </form>
        {result && (
          <p className={result.ok ? 'ok' : 'error'}>
            {result.ok
              ? `✅ Sent to ${result.sent}/${result.total} subscriber(s)`
              : `⚠️ Sent ${result.sent}/${result.total} — failures: ${JSON.stringify(result.failures)}`}
          </p>
        )}
        {error && <p className="error">{error}</p>}
      </div>

      {subscribers && subscribers.data.length > 0 && (
        <div className="card">
          <h3>Subscribers</h3>
          <table className="table">
            <thead>
              <tr><th>Email</th><th>Subscribed</th></tr>
            </thead>
            <tbody>
              {subscribers.data.map((s) => (
                <tr key={s.id}>
                  <td>{s.email}</td>
                  <td className="date">{new Date(s.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
