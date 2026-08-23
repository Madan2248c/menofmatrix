import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAccounts } from '../context/AccountContext';

const fmt = (n) => (n == null ? '—' : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));

export default function Dashboard() {
  const { selectedId } = useAccounts();
  const [posts, setPosts] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');
  const [notConnected, setNotConnected] = useState(false);

  const load = useCallback(async (f, accountId) => {
    setLoading(true);
    try {
      const { data } = await api.posts({ type: f !== 'all' ? f : '', account_id: accountId });
      setPosts(data || []);
      setNotConnected(false);
    } catch (err) {
      if (/no instagram accounts/i.test(err.message)) setNotConnected(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(filter, selectedId);
  }, [filter, selectedId, load]);

  const connect = async () => {
    const { url } = await api.instagramAuthUrl();
    window.location.href = url;
  };

  const syncNow = async () => {
    setSyncing(true);
    setMessage('');
    try {
      const r = await api.sync(selectedId);
      setMessage(`✅ Synced ${r.totalMedia} posts across ${r.accounts?.length ?? 0} account(s)`);
      load(filter, selectedId);
    } catch (err) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div>
      <div className="toolbar">
        <div className="filters">
          {['all', 'FEED', 'REELS', 'CAROUSEL_ALBUM'].map((f) => (
            <button key={f} className={filter === f ? 'chip active' : 'chip'} onClick={() => setFilter(f)}>
              {f === 'all' ? 'All' : f.replace('_', ' ')}
            </button>
          ))}
        </div>
        <button className="btn" onClick={syncNow} disabled={syncing}>
          {syncing ? 'Syncing…' : '⟳ Sync now'}
        </button>
      </div>

      {notConnected && (
        <div className="card">
          <h3>Instagram not connected yet</h3>
          <p>Connect your Creator account to start pulling posts and analytics.</p>
          <button className="btn" onClick={connect}>Connect Instagram</button>
        </div>
      )}
      {message && <p className="notice">{message}</p>}
      {loading && !posts.length && <p>Loading posts…</p>}

      {!loading && !posts.length && !notConnected && <p>No posts found. Hit “Sync now”.</p>}

      <div className="grid">
        {posts.map((p) => (
          <Link to={`/posts/${p.id}`} className="tile" key={p.id}>
            <div className="thumb">
              {p.thumbnail_url || p.media_url ? (
                p.media_type === 'VIDEO' && !p.thumbnail_url ? (
                  <video src={p.media_url} muted preload="metadata" />
                ) : (
                  <img src={p.thumbnail_url || p.media_url} alt="" loading="lazy"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                )
              ) : (
                <span>no preview</span>
              )}
              <span className={`badge ${p.media_product_type?.toLowerCase()}`}>
                {(p.media_product_type || '?').replace('_', ' ')}
              </span>
            </div>
            <div className="meta">
              <p className="caption">{p.caption?.slice(0, 80) || <em>No caption</em>}</p>
              <p className="stats">
                ❤️ {fmt(p.like_count)} · 💬 {fmt(p.comments_count)} · 👁 {fmt(p.reach)}
              </p>
              <p className="date">{p.posted_at ? new Date(p.posted_at).toLocaleDateString() : ''}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
