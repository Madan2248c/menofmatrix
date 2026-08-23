import { useEffect, useState } from 'react';
import { api } from '../api';
import logoWhite from '../assets/men-of-matrix-logo-white.jpeg';

function Newsletter() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState({ busy: false, msg: '', ok: false });

  const subscribe = async (e) => {
    e.preventDefault();
    setState({ busy: true, msg: '', ok: false });
    try {
      const r = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error || 'Subscription failed');
      setState({
        busy: false,
        ok: true,
        msg: body.alreadySubscribed ? "You're already on the list." : 'Subscribed. Welcome aboard.',
      });
      setEmail('');
    } catch (err) {
      setState({ busy: false, ok: false, msg: err.message });
    }
  };

  return (
    <form className="newsletter" onSubmit={subscribe}>
      <input
        type="email"
        required
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button className="btn" disabled={state.busy}>
        {state.busy ? 'Subscribing…' : 'Subscribe'}
      </button>
      {state.msg && <p className={state.ok ? 'ok' : 'error'}>{state.msg}</p>}
    </form>
  );
}

function LiveFeed() {
  const [posts, setPosts] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api
      .posts({ limit: 6 })
      .then((r) => setPosts(r.data || []))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded) return <p className="note">Loading latest posts…</p>;
  if (!posts.length)
    return <p className="note">New posts will appear here as soon as they are published.</p>;

  return (
    <div className="grid">
      {posts.map((p) => (
        <a
          key={p.id}
          className="tile"
          href={p.permalink}
          target="_blank"
          rel="noreferrer"
        >
          <div className="thumb">
            {p.thumbnail_url || p.media_url ? (
              p.media_type === 'VIDEO' && !p.thumbnail_url ? (
                <video src={p.media_url} muted preload="metadata" />
              ) : (
                <img
                  src={p.thumbnail_url || p.media_url}
                  alt=""
                  loading="lazy"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
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
            <p className="date">{p.posted_at ? new Date(p.posted_at).toLocaleDateString() : ''}</p>
          </div>
        </a>
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <div>
      <section className="hero">
        <h1>MenOfMatrix</h1>
        <p>
          The official home of the MenOfMatrix community — fresh posts, live updates and a
          newsletter that lands straight in your inbox. No noise, just the matrix.
        </p>
        <Newsletter />
      </section>

      <section className="signature coral">
        <h2>Live from Instagram</h2>
        <p>The latest drops from the page, pulled automatically the moment they go up.</p>
      </section>

      <section className="feed">
        <h2 style={{ fontSize: 24, marginBottom: 24 }}>Latest posts</h2>
        <LiveFeed />
      </section>

      <section className="demo-grid">
        <div className="demo-card mint">
          <h3>Newsletter</h3>
          <p>One email when it matters. Subscribe above and stay in the loop.</p>
        </div>
        <div className="demo-card peach">
          <h3>Live feed</h3>
          <p>Every new post surfaces here — feed photos, carousels and reels.</p>
        </div>
        <div className="demo-card yellow">
          <h3>Community</h3>
          <p>Built for the people who follow, share and show up. That's you.</p>
        </div>
      </section>

      <section className="signature dark">
        <div className="dark-band-inner">
          <img src={logoWhite} alt="" className="band-logo" />
          <div>
            <h2>Follow the matrix.</h2>
            <p>
              New posts land here first — but the party is on Instagram. Follow the page and
              never miss a drop.
            </p>
            <a
              className="btn ghost"
              href="https://www.instagram.com/menofmatrix.ai/"
              target="_blank"
              rel="noreferrer"
            >
              Follow @menofmatrix.ai
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}


