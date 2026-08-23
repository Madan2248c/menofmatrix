import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../api';

export default function PostDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.post(id).then(setData).catch((e) => setError(e.message));
  }, [id]);

  if (error) return <p className="error">{error}</p>;
  if (!data) return <p>Loading…</p>;

  const p = data.post;
  const trend = Object.entries(
    data.snapshots.reduce((acc, s) => {
      (acc[s.recorded_at] ||= { date: new Date(s.recorded_at).toLocaleDateString() });
      acc[s.recorded_date || acc[s.recorded_at].date] = acc[s.recorded_at];
      acc[s.recorded_at][s.metric] = Number(s.value);
      return acc;
    }, {})
  ).map(([, v]) => v);

  const metrics = [
    ['Likes', p.like_count], ['Comments', p.comments_count], ['Reach', p.reach],
    ['Views', p.views], ['Saves', p.saves], ['Shares', p.shares],
    ['Interactions', p.total_interactions],
  ];

  return (
    <div>
      <Link to="/dashboard">← Back to dashboard</Link>
      <div className="detail">
        <div className="media">
          {p.media_type === 'VIDEO' ? (
            <video src={p.media_url} controls />
          ) : (
            <img src={p.thumbnail_url || p.media_url} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          )}
        </div>
        <div className="info">
          <h2>{(p.media_product_type || '').replace('_', ' ')}</h2>
          <p className="date">{p.posted_at && new Date(p.posted_at).toLocaleString()}</p>
          {p.permalink && <a href={p.permalink} target="_blank" rel="noreferrer">Open on Instagram ↗</a>}
          <p className="caption">{p.caption || <em>No caption</em>}</p>

          <div className="metric-grid">
            {metrics.map(([label, value]) => (
              value != null && (
                <div className="card metric" key={label}>
                  <strong>{value ?? '—'}</strong>
                  <span>{label}</span>
                </div>
              )
            ))}
          </div>

          {trend.length > 0 && (
            <>
              <h3>Metric history</h3>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={trend}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="likes" stroke="#e1306c" name="Likes" />
                  <Line type="monotone" dataKey="comments" stroke="#833ab4" name="Comments" />
                  <Line type="monotone" dataKey="reach" stroke="#f77737" name="Reach" />
                  <Line type="monotone" dataKey="views" stroke="#405de6" name="Views" />
                </LineChart>
              </ResponsiveContainer>
              <p className="note">History builds up as the hourly sync records snapshots.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
