import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { useAccounts } from '../context/AccountContext';

const emptyForm = { name: '', keywords: '', action: 'dm', messageTemplate: '', postId: '' };

export default function Automation() {
  const { selectedId } = useAccounts();
  const [rules, setRules] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async (accountId) => {
    setLoading(true);
    try {
      const [{ data: ruleData }, { data: postData }] = await Promise.all([
        api.automationRules(accountId),
        api.posts({ account_id: accountId, limit: 100 }),
      ]);
      setRules(ruleData || []);
      setPosts(postData || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(selectedId);
  }, [selectedId, load]);

  const postLabel = (postId) => {
    if (!postId) return 'All posts';
    const p = posts.find((x) => x.id === postId);
    if (!p) return `Post ${postId}`;
    return p.caption ? p.caption.slice(0, 40) : `Post ${postId}`;
  };

  const createRule = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const keywords = form.keywords.split(',').map((k) => k.trim()).filter(Boolean);
      await api.createAutomationRule({
        accountId: selectedId,
        name: form.name,
        keywords,
        action: form.action,
        messageTemplate: form.messageTemplate,
        postId: form.postId || null,
      });
      setForm(emptyForm);
      load(selectedId);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const removeRule = async (id) => {
    if (!confirm('Delete this rule?')) return;
    try {
      await api.deleteAutomationRule(id);
      load(selectedId);
    } catch (err) {
      setError(err.message);
    }
  };

  const runNow = async () => {
    setRunning(true);
    setMessage(null);
    setError('');
    try {
      const r = await api.runAutomationNow(selectedId);
      setMessage(
        `✅ ${r.matches} comment(s) matched, ${r.actions} action(s) sent` +
          (r.failures?.length ? `, ${r.failures.length} failed` : '')
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div>
      <div className="toolbar">
        <h2 style={{ fontSize: 24, margin: 0 }}>Comment automation</h2>
        <button className="btn" onClick={runNow} disabled={running}>
          {running ? 'Running…' : '⚡ Run now'}
        </button>
      </div>

      {message && <p className="notice">{message}</p>}
      {error && <p className="error">{error}</p>}

      <div className="card">
        <h3>New rule</h3>
        <form onSubmit={createRule} className="compose">
          <input
            placeholder="Rule name (e.g. Price DM)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            placeholder="Trigger keywords, comma separated (e.g. price, cost)"
            value={form.keywords}
            onChange={(e) => setForm({ ...form, keywords: e.target.value })}
            required
          />
          <select
            value={form.action}
            onChange={(e) => setForm({ ...form, action: e.target.value })}
          >
            <option value="dm">Private DM (recommended)</option>
            <option value="reply">Public reply</option>
            <option value="both">Public reply + DM</option>
          </select>
          <select
            value={form.postId}
            onChange={(e) => setForm({ ...form, postId: e.target.value })}
          >
            <option value="">All posts (any comment matching the keyword)</option>
            {posts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.caption ? p.caption.slice(0, 60) : `Post ${p.id}`}
              </option>
            ))}
          </select>
          <textarea
            rows={3}
            placeholder="Message template — use {username} to mention the commenter"
            value={form.messageTemplate}
            onChange={(e) => setForm({ ...form, messageTemplate: e.target.value })}
            required
          />
          <div>
            <button className="btn" disabled={saving || !selectedId}>
              {saving ? 'Saving…' : 'Add rule'}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <h3>Active rules</h3>
        {loading && <p>Loading…</p>}
        {!loading && !rules.length && <p>No rules yet — add one above.</p>}
        {!loading && rules.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Post</th>
                <th>Keywords</th>
                <th>Action</th>
                <th>Template</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>{postLabel(r.post_id)}</td>
                  <td>{(r.trigger_keywords || []).join(', ')}</td>
                  <td>{r.action}</td>
                  <td style={{ maxWidth: 260 }}>{r.message_template}</td>
                  <td>{r.enabled ? '✅ enabled' : '⏸ disabled'}</td>
                  <td>
                    <button className="btn ghost" onClick={() => removeRule(r.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
