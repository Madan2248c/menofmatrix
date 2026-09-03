import Parser from 'rss-parser';
import { query } from '../config/db.js';

const parser = new Parser({ timeout: 10000 });

/** The minimal high-signal AI feed stack. Add/remove freely. */
export const FEEDS = [
  { name: 'Google News', url: 'https://news.google.com/rss/search?q=%22artificial+intelligence%22+OR+%22generative+AI%22&hl=en-US&gl=US&ceid=US:en' },
  { name: 'GDELT', url: 'https://api.gdeltproject.org/api/v2/doc/doc?query=artificial%20intelligence&mode=artlist&format=rss&maxrecords=100&sort=datedesc' },
  { name: 'TechCrunch', url: 'https://techcrunch.com/category/artificial-intelligence/feed/' },
  { name: 'VentureBeat', url: 'https://venturebeat.com/category/ai/feed/' },
  { name: 'OpenAI', url: 'https://openai.com/news/rss.xml' },
  { name: 'Google AI', url: 'https://blog.google/innovation-and-ai/technology/ai/rss/' },
  { name: 'NVIDIA', url: 'https://nvidianews.nvidia.com/cats/ai_platforms_deployment.xml' },
  { name: 'Hugging Face', url: 'https://huggingface.co/blog/feed.xml' },
];

const clean = (s) =>
  String(s || '')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 600);

/** Fetch every feed and upsert items (deduped by guid/link). */
export async function fetchAllNews() {
  const results = { fetched: 0, inserted: 0, perFeed: [], errors: [] };

  await Promise.all(
    FEEDS.map(async (feed) => {
      try {
        const parsed = await parser.parseURL(feed.url);
        let inserted = 0;
        for (const item of parsed.items || []) {
          const guid = item.guid || item.link;
          const link = item.link;
          const title = clean(item.title);
          if (!guid || !link || !title) continue;

          const { rowCount } = await query(
            `INSERT INTO news_items (guid, source, title, link, summary, published_at)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (guid) DO NOTHING`,
            [
              guid,
              feed.name,
              title,
              link,
              clean(item.contentSnippet || item.content || item.summary),
              item.isoDate ? new Date(item.isoDate) : item.pubDate ? new Date(item.pubDate) : new Date(),
            ]
          );
          inserted += rowCount;
        }
        results.fetched += parsed.items?.length || 0;
        results.inserted += inserted;
        results.perFeed.push({ feed: feed.name, items: parsed.items?.length || 0, inserted });
      } catch (err) {
        results.errors.push({ feed: feed.name, error: err.message });
      }
    })
  );

  // Keep the RSS cache from growing forever: drop fetched items older than 30
  // days. Admin-authored articles (guid 'admin:...') are curated content and
  // must never be purged, regardless of their published date.
  await query(
    `DELETE FROM news_items
      WHERE guid NOT LIKE 'admin:%'
        AND ((published_at IS NOT NULL AND published_at < now() - interval '30 days')
          OR (published_at IS NULL AND fetched_at < now() - interval '30 days'))`
  );
  return results;
}

/** Latest items for the public feed. */
export async function latestNews(limit = 30) {
  const { rows } = await query(
    `SELECT id, source, title, link, summary, image_url, is_featured, published_at
     FROM news_items WHERE status = 'published'
     ORDER BY is_featured DESC, published_at DESC NULLS LAST LIMIT $1`,
    [Math.min(Number(limit) || 30, 100)]
  );
  return rows;
}
