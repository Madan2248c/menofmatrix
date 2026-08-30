const TOKEN_KEY = "mm_member";

export function getMemberToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setMemberToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearMemberToken() {
  localStorage.removeItem(TOKEN_KEY);
}

/** fetch() that attaches the signed-in member's JWT, for /api/community writes. */
export function memberFetch(path, options = {}) {
  const token = getMemberToken();
  return fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
}
