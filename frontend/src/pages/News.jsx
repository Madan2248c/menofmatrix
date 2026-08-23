import { useEffect, useState } from 'react';
import { api } from '../api';

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export default function News() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .news(50)
      .then((r) => setItems(r.data || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <section className="hero" style={{ paddingBottom: 32 }}>
        <h1>Live AI news</h1>
        <p>
          A rolling feed of what's happening in AI — aggregated from the wires, research labs
          and company newsrooms, refreshed every 15 minutes.
        </p>
      </section>

      {loading && <p className="note">Loading the wires…</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !items.length && !error && (
        <p className="note">The feed is warming up — check back in a few minutes.</p>
      )}

      <div className="news-list">
        {items.map((n) => (
          <a key={n.id} className="news-item" href={n.link} target="_blank" rel="noreferrer">
            <div className="news-meta">
              <span className="news-source">{n.source}</span>
              <span className="date">{n.published_at ? timeAgo(n.published_at) : ''}</span>
            </div>
            <h3 className="news-title">{n.title}</h3>
            {n.summary && <p className="caption">{n.summary.slice(0, 180)}…</p>}
          </a>
        ))}
      </div>
    </div>
  );
}
