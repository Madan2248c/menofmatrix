import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';

const PAGE = 100;
const fmt = (n) => (n == null ? undefined : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));

// Normalize both platforms into one tile shape before merging
const normalize = (p) => ({
  id: `ig-${p.id}`,
  platform: 'instagram',
  kind: p.media_product_type || 'POST',
  caption: p.caption,
  thumb: p.thumbnail_url || p.media_url,
  videoSrc: p.media_type === 'VIDEO' && !p.thumbnail_url ? p.media_url : null,
  permalink: p.permalink,
  posted_at: p.posted_at,
  like_count: p.like_count,
  comments_count: p.comments_count,
  view_count: p.views,
});

const normalizeYt = (v) => ({
  id: `yt-${v.id}`,
  platform: 'youtube',
  kind: v.is_short ? 'SHORT' : 'VIDEO',
  caption: v.title,
  thumb: v.thumbnail_url,
  videoSrc: null,
  permalink: v.video_url,
  posted_at: v.published_at,
  like_count: v.like_count,
  comments_count: v.comment_count,
  view_count: v.view_count,
});

export default function PublicPosts() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [offset, setOffset] = useState(0);
  const [loaded, setLoaded] = useState(false); // whether more pages may exist

  const load = useCallback(async (nextOffset, append) => {
    setLoading(true);
    try {
      const [igRes, ytRes] = await Promise.all([
        api.posts({ limit: PAGE, offset: nextOffset }),
        api.publicYoutubeVideos({ limit: PAGE, offset: nextOffset }),
      ]);
      const merged = [...(igRes.data || []).map(normalize), ...(ytRes.data || []).map(normalizeYt)]
        .sort((a, b) => new Date(b.posted_at || 0) - new Date(a.posted_at || 0));
      setItems((prev) => (append ? [...prev, ...merged] : merged));
      setLoaded((igRes.data?.length || 0) >= PAGE || (ytRes.data?.length || 0) >= PAGE);
      setOffset(nextOffset);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(0, false);
  }, [load]);

  const more = () => load(offset + PAGE, true);

  const counts = items.reduce(
    (acc, p) => {
      acc[p.platform] = (acc[p.platform] || 0) + 1;
      return acc;
    },
    {}
  );
  const filtered = items.filter((p) => {
    switch (filter) {
      case 'instagram': return p.platform === 'instagram';
      case 'youtube': return p.platform === 'youtube';
      case 'reels': return p.kind === 'REELS';
      case 'video': return p.kind === 'VIDEO' || p.kind === 'SHORT';
      default: return true;
    }
  });

  const chips = [
    { key: 'all', label: 'All' },
    { key: 'instagram', label: `Instagram (${counts.instagram || 0})` },
    { key: 'youtube', label: `YouTube (${counts.youtube || 0})` },
    { key: 'reels', label: 'Reels' },
    { key: 'video', label: 'Video' },
  ];

  return (
    <div>
      <h2>All posts</h2>
      <p className="note">
        Everything we've published across Instagram and YouTube, served from our own cache.
      </p>
      <div className="filters">
        {chips.map((c) => (
          <button key={c.key} className={filter === c.key ? 'chip active' : 'chip'} onClick={() => setFilter(c.key)}>
            {c.label}
          </button>
        ))}
      </div>
      {loading && <p>Loading…</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !filtered.length && !error && <p className="note">Nothing here yet.</p>}
      <div className="grid">
        {filtered.map((p) => (
          <a key={p.id} className="tile" href={p.permalink} target="_blank" rel="noreferrer">
            <div className="thumb">
              {p.thumb || p.videoSrc ? (
                p.videoSrc ? (
                  <video src={p.videoSrc} muted preload="metadata" />
                ) : (
                  <img
                    src={p.thumb}
                    alt=""
                    loading="lazy"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                )
              ) : (
                <span>no preview</span>
              )}
              <span className={`badge ${p.platform}`}>
                {p.platform} · {p.kind.toLowerCase()}
              </span>
            </div>
            <div className="meta">
              <p className="caption">{p.caption?.slice(0, 80) || <em>No caption</em>}</p>
              <p className="date">
                {p.posted_at ? new Date(p.posted_at).toLocaleDateString() : ''}
                {p.view_count != null && ` · ${fmt(p.view_count)} views`}
                {p.view_count == null && p.like_count != null && ` · ❤️ ${fmt(p.like_count)}`}
              </p>
            </div>
          </a>
        ))}
      </div>
      {!loading && loaded && (
        <button className="btn" style={{ marginTop: 16 }} onClick={more}>
          Load more
        </button>
      )}
    </div>
  );
}