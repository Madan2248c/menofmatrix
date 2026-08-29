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

// Multipart upload — bypasses request() so the browser sets the multipart boundary.
async function upload(path, file) {
  const token = localStorage.getItem('token');
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Upload failed (${res.status})`);
  }
  return res.json();
}

export const api = {
  login: (password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ password }) }),
  status: () => request('/status'),
  instagramAuthUrl: () => request('/auth/instagram/url'),
  accounts: () => request('/accounts'),
  deleteAccount: (id) => request(`/accounts/${id}`, { method: 'DELETE' }),
  newsletterSubscribers: () => request('/newsletter/subscribers'),
  news: (limit = 30) => request(`/news${limit ? `?limit=${limit}` : ''}`),
  blogs: (limit = 50) => request(`/blog${limit ? `?limit=${limit}` : ''}`),
  blog: (slug) => request(`/blog/${encodeURIComponent(slug)}`),
  allBlogs: () => request('/blog/admin/all'),
  createBlogPost: (payload) => request('/blog', { method: 'POST', body: JSON.stringify(payload) }),
  updateBlogPost: (id, payload) =>
    request(`/blog/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteBlogPost: (id) => request(`/blog/${id}`, { method: 'DELETE' }),
  uploadImage: (file) => upload('/uploads', file),
  youtubeAuthUrl: () => request('/youtube/auth/url'),
  youtubeAccounts: () => request('/youtube/accounts'),
  deleteYoutubeAccount: (id) => request(`/youtube/accounts/${id}`, { method: 'DELETE' }),
  youtubeVideos: (params = {}) => request(`/youtube/videos${q(params)}`),
  youtubeShorts: (params = {}) => request(`/youtube/shorts${q(params)}`),
  youtubeVideo: (id) => request(`/youtube/videos/${id}`),
  youtubeSummary: (accountId) => request(`/youtube/analytics/summary${q({ account_id: accountId })}`),
  youtubeSync: (accountId) =>
    request('/youtube/sync', { method: 'POST', body: JSON.stringify(accountId ? { account_id: accountId } : {}) }),
  smtpStatus: () => request('/newsletter/smtp-status'),
  sendNewsletter: (subject, body) =>
    request('/newsletter/send', { method: 'POST', body: JSON.stringify({ subject, body }) }),
  posts: (params = {}) => request(`/posts${q(params)}`),
  post: (id) => request(`/posts/${id}`),
  liveStories: (accountId) => request(`/stories/live${q({ account_id: accountId })}`),
  summary: (accountId) => request(`/analytics/summary${q({ account_id: accountId })}`),
  sync: (accountId) =>
    request('/sync', { method: 'POST', body: JSON.stringify(accountId ? { account_id: accountId } : {}) }),
  syncFollowers: () => request('/followers/sync', { method: 'POST', body: JSON.stringify({}) }),
  // Public content pages (work logged-out)
  publicAccounts: () => request('/public/accounts'),
  publicStories: () => request('/public/stories'),
  publicYoutubeVideos: (params = {}) => request(`/public/youtube/videos${q(params)}`),
  publicFollowers: () => request('/public/followers'),
  publicIgFollowers: (params = {}) => request(`/public/instagram/followers${q(params)}`),
  automationRules: (accountId) => request(`/automation/rules${q({ account_id: accountId })}`),
  createAutomationRule: (payload) =>
    request('/automation/rules', { method: 'POST', body: JSON.stringify(payload) }),
  deleteAutomationRule: (id) => request(`/automation/rules/${id}`, { method: 'DELETE' }),
  runAutomationNow: (accountId) =>
    request('/automation/run', { method: 'POST', body: JSON.stringify(accountId ? { account_id: accountId } : {}) }),
};

