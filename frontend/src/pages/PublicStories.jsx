import { useEffect, useState } from 'react';
import { api } from '../api';

export default function PublicStories() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .publicStories()
      .then((r) => setStories(r.data || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Group per account so multi-account setups read as separate story trays
  const byAccount = new Map();
  for (const s of stories) {
    const name = s.username || 'Instagram';
    if (!byAccount.has(name)) byAccount.set(name, []);
    byAccount.get(name).push(s);
  }

  return (
    <div>
      <h2>Live stories</h2>
      <p className="note">
        Stories are visible for 24 hours. This page is served from our own cache and updates hourly.
      </p>
      {loading && <p>Loading…</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !stories.length && !error && <p>No active stories right now.</p>}
      {[...byAccount.entries()].map(([name, rows]) => (
        <section key={name}>
          <h3>{name}</h3>
          <div className="stories-row">
            {rows.map((s) => (
              <div className="story" key={s.id}>
                {s.media_type === 'VIDEO' ? (
                  <video src={s.media_url || s.thumbnail_url} muted controls />
                ) : (
                  <img
                    src={s.media_url || s.thumbnail_url}
                    alt=""
                    loading="lazy"
                    onError={(e) => {
                      // Story CDN URLs expire quickly — fall back to the thumbnail, then hide
                      const img = e.currentTarget;
                      if (s.thumbnail_url && img.src !== s.thumbnail_url) {
                        img.src = s.thumbnail_url;
                      } else {
                        img.style.display = 'none';
                      }
                    }}
                  />
                )}
                <p className="date">
                  {s.posted_at && new Date(s.posted_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}