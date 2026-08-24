import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../api';

const fmt = (n) => (n == null ? '—' : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));
const fmtDuration = (s) => {
  if (!s) return '';
  const m = Math.floor(s / 60);
  const sec = String(s % 60).padStart(2, '0');
  return `${m}:${sec}`;
};

export default function YouTubeVideoDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.youtubeVideo(id).then(setData).catch((e) => setError(e.message));
  }, [id]);

  if (error) return <p className="error">{error}</p>;
  if (!data) return <p>Loading…</p>;

  const v = data.video;
  const trend = Object.entries(
    data.snapshots.reduce((acc, s) => {
      const key = new Date(s.recorded_at).toISOString().split('T')[0];
      acc[key] ||= { date: key };
      acc[key][s.metric] = Number(s.value);
      return acc;
    }, {})
  ).map(([, value]) => value);

  const metrics = [
    ['Views', v.view_count],
    ['Likes', v.like_count],
    ['Comments', v.comment_count],
    ['Duration', fmtDuration(v.duration_seconds)],
  ];

  return (
    <div>
      <Link to="/youtube/videos">← Back to YouTube videos</Link>
      <div className="detail">
        <div className="media">
          <img src={v.thumbnail_url} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        </div>
        <div className="info">
          <h2>{v.title || 'Untitled video'}</h2>
          <p className="date">{v.published_at && new Date(v.published_at).toLocaleString()}</p>
          {v.video_url && <a href={v.video_url} target="_blank" rel="noreferrer">Open on YouTube ↗</a>}
          <p className="caption">{v.description || <em>No description</em>}</p>

          <div className="metric-grid">
            {metrics.map(([label, value]) =>
              value != null ? (
                <div className="card metric" key={label}>
                  <strong>{typeof value === 'number' ? fmt(value) : value}</strong>
                  <span>{label}</span>
                </div>
              ) : null
            )}
          </div>

          {trend.length > 0 && (
            <>
              <h3>Metric history</h3>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={trend}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="views" stroke="#ff0000" name="Views" />
                  <Line type="monotone" dataKey="likes" stroke="#181d26" name="Likes" />
                  <Line type="monotone" dataKey="comments" stroke="#458fff" name="Comments" />
                </LineChart>
              </ResponsiveContainer>
              <p className="note">History builds up as the nightly sync records snapshots.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
