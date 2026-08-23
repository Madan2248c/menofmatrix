// Use import.meta.env.VITE_API_URL in production (deployed backend),
// fall back to same-origin /api which Vite proxies to localhost:4000 in dev.
const BASE = `${import.meta.env.VITE_API_URL || ''}/api`;

async function request(path, options = {}) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

const q = (params) => {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== '') usp.set(k, v);
  }
  const s = usp.toString();
  return s ? `?${s}` : '';
};

export const api = {
  login: (password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ password }) }),
  status: () => request('/status'),
  instagramAuthUrl: () => request('/auth/instagram/url'),
  accounts: () => request('/accounts'),
  deleteAccount: (id) => request(`/accounts/${id}`, { method: 'DELETE' }),
  newsletterSubscribers: () => request('/newsletter/subscribers'),
  news: (limit = 30) => request(`/news${limit ? `?limit=${limit}` : ''}`),
  smtpStatus: () => request('/newsletter/smtp-status'),
  sendNewsletter: (subject, body) =>
    request('/newsletter/send', { method: 'POST', body: JSON.stringify({ subject, body }) }),
  posts: (params = {}) => request(`/posts${q(params)}`),
  post: (id) => request(`/posts/${id}`),
  liveStories: (accountId) => request(`/stories/live${q({ account_id: accountId })}`),
  summary: (accountId) => request(`/analytics/summary${q({ account_id: accountId })}`),
  sync: (accountId) =>
    request('/sync', { method: 'POST', body: JSON.stringify(accountId ? { account_id: accountId } : {}) }),
};

