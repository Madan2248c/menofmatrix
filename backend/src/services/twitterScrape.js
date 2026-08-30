// No official API, no credentials — X server-renders a data blob into the
// logged-out profile page for crawlers/SEO, which we scrape directly. This is
// undocumented and can break if X changes their markup; there is no contract
// to rely on, so keep this best-effort and fail soft.
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const CACHE_TTL_MS = 30 * 60 * 1000;
const cache = new Map(); // handle -> { data, fetchedAt }

function unescapeJsString(raw) {
  try {
    return JSON.parse(`"${raw}"`);
  } catch {
    return raw;
  }
}

function parseProfile(html, handle) {
  const followersMatch = html.match(/"UserRelationshipCounts"[^}]*followers:(\d+),following:(\d+)/);
  const followersCount = followersMatch ? Number(followersMatch[1]) : null;

  const texts = [];
  const tweetRe = /full_text:"((?:[^"\\]|\\.)*)"/g;
  const seen = new Set();
  let match;
  while ((match = tweetRe.exec(html))) {
    const text = unescapeJsString(match[1]);
    if (!text || seen.has(text)) continue;
    seen.add(text);
    texts.push(text);
  }

  // Status IDs render separately from the text data blob (as plain <a> hrefs),
  // so they can't be paired positionally within the same regex pass. Both
  // lists are newest-first though, so pairing by first-appearance order lines
  // them up correctly as long as the counts roughly agree.
  const ids = [];
  const idRe = new RegExp(`/${handle}/status/(\\d+)`, 'g');
  const seenIds = new Set();
  while ((match = idRe.exec(html))) {
    if (seenIds.has(match[1])) continue;
    seenIds.add(match[1]);
    ids.push(match[1]);
  }

  const tweets = texts.slice(0, 2).map((text, i) => ({ id: ids[i] || null, text }));
  return { followersCount, tweets };
}

/** Best-effort scrape of a public X profile: follower count + latest tweets. */
export async function fetchTwitterProfile(handle) {
  const cached = cache.get(handle);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) return cached.data;

  const res = await fetch(`https://x.com/${handle}`, {
    headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9' },
  });
  if (!res.ok) throw new Error(`X returned ${res.status}`);
  const html = await res.text();
  const { followersCount, tweets } = parseProfile(html, handle);

  const data = { username: handle, followersCount, tweets, fetchedAt: new Date().toISOString() };
  cache.set(handle, { data, fetchedAt: Date.now() });
  return data;
}
