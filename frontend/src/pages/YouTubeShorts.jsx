import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAccounts } from '../context/AccountContext';

const fmt = (n) => (n == null ? '—' : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));

export default function YouTubeShorts() {
  const { selectedId, selectedPlatform } = useAccounts();
  const [shorts, setShorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    if (selectedPlatform !== 'youtube' || !selectedId) {
      setShorts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.youtubeShorts({ account_id: selectedId });
      setShorts(data || []);
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
      setMessage(`✅ Synced ${r.totalShorts} shorts + ${r.totalVideos} videos`);
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
        <p>Connect your YouTube channel to pull Shorts and analytics.</p>
        <button className="btn" onClick={connect}>Connect YouTube</button>
      </div>
    );
  }

  return (
    <div>
      <div className="toolbar">
        <h1>YouTube Shorts</h1>
        <button className="btn" onClick={syncNow} disabled={syncing}>
          {syncing ? 'Syncing…' : '⟳ Sync now'}
        </button>
      </div>

      {message && <p className="notice">{message}</p>}
      {loading && !shorts.length && <p>Loading Shorts…</p>}
      {!loading && !shorts.length && <p>No Shorts found. Hit “Sync now”.</p>}

      <div className="grid">
        {shorts.map((v) => (
          <Link to={`/youtube/videos/${v.id}`} className="tile" key={v.id}>
            <div className="thumb">
              {v.thumbnail_url ? (
                <img src={v.thumbnail_url} alt="" loading="lazy" />
              ) : (
                <span>no preview</span>
              )}
              <span className="badge shorts">Short</span>
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
