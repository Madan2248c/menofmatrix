import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAccounts } from '../context/AccountContext';
import { api } from '../api';
import logoBlack from '../assets/men-of-matrix-logo-black.jpeg';

export default function Layout() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const { accounts, selectedId, select } = useAccounts();

  const connect = async () => {
    try {
      const { url } = await api.instagramAuthUrl();
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
          {token && (
            <>
              {accounts.length > 0 && (
                <select
                  className="account-switch"
                  value={selectedId ?? ''}
                  onChange={(e) => {
                    select(e.target.value);
                    navigate('/dashboard');
                  }}
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>@{a.username || a.igUserId}</option>
                  ))}
                </select>
              )}
              <NavLink to="/dashboard">Dashboard</NavLink>
              <NavLink to="/stories">Stories</NavLink>
              <NavLink to="/analytics">Analytics</NavLink>
              <NavLink to="/newsletters">Newsletter</NavLink>
              <NavLink to="/automation">Automation</NavLink>
              <button className="link" onClick={connect}>＋ Connect</button>
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

