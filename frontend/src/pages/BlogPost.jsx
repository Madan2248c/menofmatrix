import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';

const fmtDate = (dateStr) =>
  dateStr
    ? new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    api
      .blog(slug)
      .then((r) => setPost(r.post || null))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <p className="note">Loading post…</p>;

  if (error || !post) {
    return (
      <div>
        <p className="note">{error === '' ? 'This post does not exist (or is not published yet).' : error}</p>
        <Link className="btn ghost" to="/blog">← Back to blog</Link>
      </div>
    );
  }

  return (
    <article className="post-page">
      <Link to="/blog" className="post-backlink">← All posts</Link>

      {post.cover_image_url && (
        <img className="post-hero" src={post.cover_image_url} alt={post.title} />
      )}

      <header className="post-header">
        <span className="date">{fmtDate(post.published_at)}</span>
        <h1>{post.title}</h1>
        {post.excerpt && <p className="caption">{post.excerpt}</p>}
      </header>

      {/* Owner-authored HTML from the admin editor */}
      <div className="article" dangerouslySetInnerHTML={{ __html: post.content_html }} />
    </article>
  );
}
