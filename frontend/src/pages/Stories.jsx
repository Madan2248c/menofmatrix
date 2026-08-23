import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAccounts } from '../context/AccountContext';

export default function Stories() {
  const { selectedId, selectedId: _sid } = useAccounts();
  const [stories, setStories] = useState([]);
  const [source, setSource] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!selectedId) { setLoading(false); return; }
    setLoading(true);
    api
      .liveStories(selectedId)
      .then((r) => {
        setStories(r.data || []);
        setSource(r.source);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [selectedId]);

  return (
    <div>
      <h2>Live stories</h2>
      <p className="note">
        Only currently-active stories (24h window) are available via the Instagram API.
        {source === 'cache' && ' Showing last cached snapshot — Instagram is unreachable right now.'}
      </p>
      {loading && <p>Loading…</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !stories.length && !error && <p>No active stories right now.</p>}
      <div className="stories-row">
        {stories.map((s) => (
          <div className="story" key={s.id}>
            {s.media_type === 'VIDEO' ? (
              <video src={s.media_url || s.thumbnail_url} muted controls />
            ) : (
              <img src={s.media_url || s.thumbnail_url} alt="" />
            )}
            <p className="date">{s.timestamp && new Date(s.timestamp).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
