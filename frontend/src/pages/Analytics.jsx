import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid, Legend,
} from 'recharts';
import { api } from '../api';
import { useAccounts } from '../context/AccountContext';

const fmt = (n) => (n == null ? '—' : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));

export default function Analytics() {
  const { selectedId } = useAccounts();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!selectedId) return;
    setError('');
    api.summary(selectedId).then(setData).catch((e) => setError(e.message));
  }, [selectedId]);

  const syncFollowers = async () => {
    setSyncing(true);
    setMessage('');
    try {
      const r = await api.syncFollowers();
      setMessage(`✅ Synced follower list — ${r.upserted} updated${r.pruned ? `, ${r.pruned} removed` : ''}`);
    } catch (err) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  if (error) return <p className="error">{error}</p>;
  if (!data) return <p>Loading analytics…</p>;

  const kpis = [
    ['Followers', data.followers_count],
    ['Total posts', data.total_posts],
    ['Total likes', data.total_likes],
    ['Total comments', data.total_comments],
    ['Total reach', data.total_reach],
    ['Avg reach / post', data.avg_reach_per_post],
  ];

  const trend = (data.followerTrend || []).map((r) => ({
    date: r.snapshot_date,
    followers: r.followers_count,
    posts: r.media_count,
  }));

  const topPosts = (data.topPosts || []).map((p) => ({
    name: p.caption ? p.caption.slice(0, 14) + '…' : p.id.slice(-6),
    Likes: p.like_count ?? 0,
    Comments: p.comments_count ?? 0,
    id: p.id,
  }));

  const breakdown = (data.breakdown || []).map((b) => ({
    type: (b.type || 'UNKNOWN').replace('_', ' '),
    count: Number(b.count),
    avgReach: b.avg_reach,
  }));

  return (
    <div>
      <h2>Account analytics{data.username ? ` — @${data.username}` : ''}</h2>

      <div className="metric-grid wide">
        {kpis.map(([label, value]) => (
          <div className="card metric" key={label}>
            <strong>{fmt(value)}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <p className="note">
        Last synced:{' '}
        {data.last_synced_at ? new Date(data.last_synced_at).toLocaleString() : 'never'}
      </p>

      <h3>Follower growth</h3>
      <button className="link" style={{ marginBottom: 12, display: 'block' }} onClick={syncFollowers} disabled={syncing}>
        {syncing ? 'Syncing follower list…' : '＋ Sync follower list (Apify)'}
      </button>
      {message && <p className="note">{message}</p>}
      {trend.length > 1 ? (
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={trend}>
            <defs>
              <linearGradient id="fg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e1306c" stopOpacity={0.7} />
                <stop offset="100%" stopColor="#e1306c" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" />
            <YAxis domain={['auto', 'auto']} />
            <Tooltip />
            <Area dataKey="followers" stroke="#e1306c" fill="url(#fg)" name="Followers" />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <p className="note">Gathering daily snapshots — chart appears after a few syncs.</p>
      )}

      <h3>Top posts by engagement</h3>
      {topPosts.length ? (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={topPosts}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Likes" fill="#e1306c" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Comments" fill="#833ab4" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p className="note">No post metrics yet — run a sync.</p>
      )}

      <h3>Content breakdown</h3>
      <table className="table">
        <thead>
          <tr><th>Type</th><th>Count</th><th>Avg reach</th></tr>
        </thead>
        <tbody>
          {breakdown.map((b) => (
            <tr key={b.type}><td>{b.type}</td><td>{b.count}</td><td>{fmt(b.avgReach)}</td></tr>
          ))}
        </tbody>
      </table>

      <h3>Best performers</h3>
      <ul className="toplist">
        {(data.topPosts || []).map((p) => (
          <li key={p.id}>
            <Link to={`/posts/${p.id}`}>
              {p.caption?.slice(0, 60) || p.permalink}
            </Link>
            <span>❤️ {fmt(p.like_count)} · 💬 {fmt(p.comments_count)} · 👁 {fmt(p.reach)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
