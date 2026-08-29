import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';

const PAGE = 100;
const fmt = (n) => (n == null ? '—' : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));

export default function PublicFollowers() {
  const [accounts, setAccounts] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [moreLoading, setMoreLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.publicFollowers(), api.publicIgFollowers({ limit: PAGE })])
      .then(([summary, list]) => {
        setAccounts(summary.data || []);
        setFollowers(list.data || []);
        setHasMore(Boolean(list.hasMore));
        setOffset(PAGE);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const more = useCallback(async () => {
    setMoreLoading(true);
    try {
      const list = await api.publicIgFollowers({ limit: PAGE, offset });
      setFollowers((prev) => [...prev, ...(list.data || [])]);
      setHasMore(Boolean(list.hasMore));
      setOffset((o) => o + PAGE);
    } catch (err) {
      setError(err.message);
    } finally {
      setMoreLoading(false);
    }
  }, [offset]);

  return (
    <div>
      <h2>Followers</h2>
      <p className="note">
        Follower and subscriber counts, plus the follower list for our Instagram account.
        Served from our own cache — the list is refreshed when the owner syncs it.
      </p>
      {loading && <p>Loading…</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !accounts.length && !error && <p className="note">No connected accounts yet.</p>}

      <div className="metric-grid wide">
        {accounts.map((a) => (
          <div className="card metric" key={`${a.platform}-${a.account_id}`}>
            <strong>{fmt(a.followers_count)}</strong>
            <span>{a.name || a.platform}</span>
            {a.delta != null && a.delta !== 0 && (
              <p className={`delta ${a.delta >= 0 ? 'up' : 'down'}`}>
                {a.delta >= 0 ? '▲' : '▼'} {fmt(Math.abs(a.delta))} since last snapshot
              </p>
            )}
          </div>
        ))}
      </div>
      {accounts.length > 0 && (
        <p className="note">
          Last synced:{' '}
          {accounts[0].last_synced_at ? new Date(accounts[0].last_synced_at).toLocaleString() : 'never'}
        </p>
      )}

      {!loading && followers.length > 0 && (
        <>
          <h3>Followers ({followers.length})</h3>
          <div className="follower-grid">
            {followers.map((f) => (
              <div className="follower" key={`${f.account_id}-${f.follower_id}`}>
                {f.profile_pic_url && (
                  <img
                    src={f.profile_pic_url}
                    alt=""
                    loading="lazy"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                )}
                <div>
                  <p>
                    <a
                      href={`https://www.instagram.com/${f.username}/`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      @{f.username}
                    </a>
                    {f.is_verified && <span className="verified" title="Verified"> ✓</span>}
                  </p>
                  <p className="date">{f.full_name || ''}</p>
                </div>
              </div>
            ))}
          </div>
          {hasMore && (
            <button className="btn" style={{ marginTop: 16 }} onClick={more} disabled={moreLoading}>
              {moreLoading ? 'Loading…' : 'Load more'}
            </button>
          )}
        </>
      )}
      {!loading && !followers.length && !error && (
        <p className="note">
          The follower list hasn't been synced yet.
        </p>
      )}
    </div>
  );
}