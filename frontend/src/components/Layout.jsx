import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAccounts } from '../context/AccountContext';
import { api } from '../api';
import logoBlack from '../assets/men-of-matrix-logo-black.jpeg';

export default function Layout() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const { accounts, selectedId, selectedPlatform, select } = useAccounts();
  const [connectOpen, setConnectOpen] = useState(false);

  const connectInstagram = async () => {
    setConnectOpen(false);
    try {
      const { url } = await api.instagramAuthUrl();
      window.location.href = url;
    } catch (err) {
      alert(err.message);
    }
  };

  const connectYouTube = async () => {
    setConnectOpen(false);
    try {
      const { url } = await api.youtubeAuthUrl();
      window.location.href = url;
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="app">
      <header className="nav">
        <Link to="/" className="brand">
          <img src={logoBlack} alt="MenOfMatrix" className="nav-logo" />
          <span>MenOfMatrix</span>
        </Link>
        <nav>
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/news">News</NavLink>
          <NavLink to="/blog">Blog</NavLink>
          {token && (
            <>
              {accounts.length > 0 && (
                <select
                  className="account-switch"
                  value={selectedId ? `${selectedPlatform}:${selectedId}` : ''}
                  onChange={(e) => {
                    const [platform, id] = e.target.value.split(':');
                    select(id, platform);
                    navigate(platform === 'youtube' ? '/youtube/videos' : '/dashboard');
                  }}
                >
                  <optgroup label="Instagram">
                    {accounts
                      .filter((a) => a.platform === 'instagram')
                      .map((a) => (
                        <option key={`ig:${a.id}`} value={`ig:${a.id}`}>
                          @{a.username || a.ig_user_id || a.igUserId}
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="YouTube">
                    {accounts
                      .filter((a) => a.platform === 'youtube')
                      .map((a) => (
                        <option key={`yt:${a.id}`} value={`yt:${a.id}`}>
                          {a.channel_title || a.youtube_channel_id}
                        </option>
                      ))}
                  </optgroup>
                </select>
              )}
              <NavLink to="/dashboard">Dashboard</NavLink>
              <NavLink to="/stories">Stories</NavLink>
              <NavLink to="/analytics">Analytics</NavLink>
              <NavLink to="/newsletters">Newsletter</NavLink>
              <NavLink to="/automation">Automation</NavLink>
              <NavLink to="/blog-admin">Blog Posts</NavLink>
              <NavLink to="/youtube/videos">YouTube Videos</NavLink>
              <NavLink to="/youtube/shorts">YouTube Shorts</NavLink>
              <NavLink to="/youtube/analytics">YouTube Analytics</NavLink>
              <div className="connect-menu" style={{ position: 'relative' }}>
                <button className="link" onClick={() => setConnectOpen((o) => !o)}>＋ Connect</button>
                {connectOpen && (
                  <div
                    className="dropdown"
                    style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      background: 'var(--canvas)',
                      border: '1px solid var(--hairline)',
                      borderRadius: 'var(--r-sm)',
                      padding: 8,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      minWidth: 160,
                      zIndex: 100,
                    }}
                  >
                    <button className="link" style={{ textAlign: 'left' }} onClick={connectInstagram}>
                      Connect Instagram
                    </button>
                    <button className="link" style={{ textAlign: 'left' }} onClick={connectYouTube}>
                      Connect YouTube
                    </button>
                  </div>
                )}
              </div>
              <button className="link" onClick={logout}>Logout</button>
            </>
          )}
        </nav>
      </header>
      <main className="main">
        <Outlet />
      </main>
      <footer className="footer">
        <span>© {new Date().getFullYear()} MenOfMatrix</span>
        <span className="date">Analytics served from our own cache · not affiliated with Meta</span>
      </footer>
    </div>
  );
}

