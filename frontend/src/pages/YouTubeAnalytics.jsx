import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAccounts } from '../context/AccountContext';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const fmt = (n) => (n == null ? '—' : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));

export default function YouTubeAnalytics() {
  const { selectedId, selectedPlatform } = useAccounts();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (selectedPlatform !== 'youtube' || !selectedId) {
      setSummary(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    api
      .youtubeSummary(selectedId)
      .then((r) => setSummary(r))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [selectedId, selectedPlatform]);

  if (selectedPlatform !== 'youtube' || !selectedId) {
    return <p className="note">Select or connect a YouTube channel to view analytics.</p>;
  }

  return (
    <div>
      <div className="toolbar">
        <h1>YouTube Analytics</h1>
        <span className="date">{summary?.channel_title}</span>
      </div>

      {error && <p className="error">{error}</p>}
      {loading && <p className="note">Loading analytics…</p>}

      {summary && (
        <>
          <div className="metric-grid wide">
            <div className="card metric">
              <strong>{fmt(summary.subscriber_count)}</strong>
              <span>Subscribers</span>
            </div>
            <div className="card metric">
              <strong>{fmt(summary.total_videos)}</strong>
              <span>Videos</span>
            </div>
            <div className="card metric">
              <strong>{fmt(summary.total_shorts)}</strong>
              <span>Shorts</span>
            </div>
            <div className="card metric">
              <strong>{fmt(summary.total_views)}</strong>
              <span>Total views</span>
            </div>
            <div className="card metric">
              <strong>{fmt(summary.total_likes)}</strong>
              <span>Likes</span>
            </div>
            <div className="card metric">
              <strong>{fmt(summary.total_comments)}</strong>
              <span>Comments</span>
            </div>
          </div>

          {summary.followerTrend?.length > 1 && (
            <div className="card">
              <h3>Subscriber trend</h3>
              <div style={{ height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={summary.followerTrend}>
                    <XAxis dataKey="snapshot_date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="subscriber_count" stroke="#181d26" fill="#f5e9d4" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <h3 style={{ marginTop: 32 }}>Top videos</h3>
          {!summary.topVideos?.length && <p className="note">No video data yet.</p>}
          <ul className="toplist">
            {summary.topVideos?.map((v) => (
              <li key={v.id}>
                <img src={v.thumbnail_url} alt="" style={{ width: 80, height: 45, objectFit: 'cover', borderRadius: 4 }} />
                <a href={v.video_url} target="_blank" rel="noreferrer">{v.title?.slice(0, 60)}</a>
                <span>{fmt(v.view_count)} views</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
