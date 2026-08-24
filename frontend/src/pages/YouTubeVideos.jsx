import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAccounts } from '../context/AccountContext';

const fmt = (n) => (n == null ? '—' : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));
const fmtDuration = (s) => {
  if (!s) return '';
  const m = Math.floor(s / 60);
  const sec = String(s % 60).padStart(2, '0');
  return `${m}:${sec}`;
};

export default function YouTubeVideos() {
  const { selectedId, selectedPlatform } = useAccounts();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    if (selectedPlatform !== 'youtube' || !selectedId) {
      setVideos([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.youtubeVideos({ account_id: selectedId });
      setVideos(data || []);
    } catch (err) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [selectedId, selectedPlatform]);

  useEffect(() => {
    load();
  }, [load]);

  const connect = async () => {
    const { url } = await api.youtubeAuthUrl();
    window.location.href = url;
  };

  const syncNow = async () => {
    if (selectedPlatform !== 'youtube' || !selectedId) return;
    setSyncing(true);
    setMessage('');
    try {
      const r = await api.youtubeSync(selectedId);
      setMessage(`✅ Synced ${r.totalVideos} videos + ${r.totalShorts} shorts`);
      load();
    } catch (err) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  if (selectedPlatform !== 'youtube' || !selectedId) {
    return (
      <div className="card">
        <h3>YouTube not connected yet</h3>
        <p>Connect your YouTube channel to start pulling videos and analytics.</p>
        <button className="btn" onClick={connect}>Connect YouTube</button>
      </div>
    );
  }

  return (
    <div>
      <div className="toolbar">
        <h1>YouTube Videos</h1>
        <button className="btn" onClick={syncNow} disabled={syncing}>
          {syncing ? 'Syncing…' : '⟳ Sync now'}
        </button>
      </div>

      {message && <p className="notice">{message}</p>}
      {loading && !videos.length && <p>Loading videos…</p>}
      {!loading && !videos.length && <p>No videos found. Hit “Sync now”.</p>}

      <div className="grid">
        {videos.map((v) => (
          <Link to={`/youtube/videos/${v.id}`} className="tile" key={v.id}>
            <div className="thumb">
              {v.thumbnail_url ? (
                <img src={v.thumbnail_url} alt="" loading="lazy" />
              ) : (
                <span>no preview</span>
              )}
              <span className="badge">{fmtDuration(v.duration_seconds)}</span>
            </div>
            <div className="meta">
              <p className="caption">{v.title?.slice(0, 80) || <em>No title</em>}</p>
              <p className="stats">
                ▶ {fmt(v.view_count)} · 👍 {fmt(v.like_count)} · 💬 {fmt(v.comment_count)}
              </p>
              <p className="date">{v.published_at ? new Date(v.published_at).toLocaleDateString() : ''}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
