const PREFIX = "mm-cache:";

export async function communityFetch(path, { token, ttl = 60_000, ...options } = {}) {
  const method = options.method || "GET";
  const cacheKey = `${PREFIX}${path}`;
  const canCache = method === "GET" && !token && typeof window !== "undefined";

  if (canCache) {
    try {
      const cached = JSON.parse(localStorage.getItem(cacheKey) || "null");
      if (cached && Date.now() - cached.at < ttl) return cached.value;
    } catch {}
  }

  const response = await fetch(path, {
    ...options,
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const value = await response.json();
  if (!response.ok) {
    const error = new Error(value.error || "Request failed");
    error.status = response.status;
    throw error;
  }
  if (canCache) {
    try { localStorage.setItem(cacheKey, JSON.stringify({ at: Date.now(), value })); } catch {}
  }
  return value;
}

export function clearCommunityCache(path) {
  if (typeof window !== "undefined") localStorage.removeItem(`${PREFIX}${path}`);
}
