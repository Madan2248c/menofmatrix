import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

const fmtDate = (dateStr) =>
  dateStr
    ? new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .blogs(50)
      .then((r) => setPosts(r.data || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <section className="hero" style={{ paddingBottom: 32 }}>
        <h1>Blog</h1>
        <p>
          Notes, lessons and behind-the-scenes stories from running an Instagram presence —
          written by us, straight from the data.
        </p>
      </section>

      {loading && <p className="note">Loading posts…</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !posts.length && !error && (
        <p className="note">No posts yet — the first one is on its way.</p>
      )}

      <div className="blog-grid">
        {posts.map((p) => (
          <Link key={p.id} to={`/blog/${p.slug}`} className="post-card">
            {p.cover_image_url ? (
              <img className="post-cover" src={p.cover_image_url} alt="" loading="lazy" />
            ) : (
              <div className="post-cover post-cover-fallback" aria-hidden="true" />
            )}
            <div className="post-card-body">
              <span className="date">{fmtDate(p.published_at)}</span>
              <h3 className="post-title">{p.title}</h3>
              {p.excerpt && <p className="caption">{p.excerpt.slice(0, 160)}</p>}
              <span className="post-readmore">Read post →</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
