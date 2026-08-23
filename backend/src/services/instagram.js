import { graphGet } from './tokenStore.js';

const MEDIA_FIELDS =
  'id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp';

/** Profile / KPI fields for a connected professional account. */
export function fetchProfile(accountId) {
  return graphGet(accountId, '/me', {
    fields: 'user_id,username,name,profile_picture_url,followers_count,follows_count,media_count',
  });
}

/** Fetch ALL media (feed + reels + active stories) for one account. */
export async function fetchAllMedia(accountId, limit = 50) {
  const all = [];
  let after;
  do {
    const params = { fields: MEDIA_FIELDS, limit: String(limit) };
    if (after) params.after = after;
    const page = await graphGet(accountId, '/me/media', params);
    all.push(...(page.data || []));
    after = page.paging?.cursors?.after;
  } while (after && all.length < 2000); // hard safety cap
  return all;
}

/** Live stories only (24h window). */
export function fetchStories(accountId) {
  return graphGet(accountId, '/me/stories', { fields: MEDIA_FIELDS });
}

/** Comments for a media object. */
export async function fetchMediaComments(accountId, mediaId) {
  try {
    const res = await graphGet(accountId, `/${mediaId}/comments`, {
      fields: 'id,text,timestamp,username,like_count',
      limit: '100',
    });
    return res.data || [];
  } catch (err) {
    console.warn(`[comments] media ${mediaId}: ${err.message}`);
    return [];
  }
}

const num = (insights, name) =>
  Number(insights?.data?.find((m) => m.name === name)?.values?.[0]?.value ?? 0);

/**
 * Per-post insights for one media. Metrics differ by product type; request the
 * union and read what comes back (Graph returns only applicable metrics).
 */
export async function fetchMediaInsights(accountId, mediaId, productType) {
  const metricByType = {
    FEED: 'likes,comments,shares,saved,reach,views,total_interactions',
    REELS: 'likes,comments,saved,reach,views,total_interactions',
    STORY: 'reach,replies,taps_forward,taps_back,exits,views',
  };
  try {
    const insights = await graphGet(accountId, `/${mediaId}/insights`, {
      metric: metricByType[productType] || metricByType.FEED,
    });
    return {
      like_count: num(insights, 'likes'),
      comments_count: num(insights, 'comments'),
      shares: num(insights, 'shares'),
      saves: num(insights, 'saved'),
      reach: num(insights, 'reach'),
      views: num(insights, 'views') || num(insights, 'plays'),
      total_interactions: num(insights, 'total_interactions'),
      story_replies: num(insights, 'replies'),
      taps_forward: num(insights, 'taps_forward'),
      taps_back: num(insights, 'taps_back'),
      exits: num(insights, 'exits'),
    };
  } catch (err) {
    // e.g. stories with <5 viewers return code 10 — treat as zeros, not failure
    console.warn(`[insights] ${mediaId}: ${err.message}`);
    return null;
  }
}
