-- AI news items ingested from RSS feeds (deduped by guid)
CREATE TABLE IF NOT EXISTS news_items (
  id          BIGSERIAL PRIMARY KEY,
  guid        TEXT UNIQUE NOT NULL,
  source      TEXT NOT NULL,
  title       TEXT NOT NULL,
  link        TEXT NOT NULL,
  summary     TEXT,
  published_at TIMESTAMPTZ,
  fetched_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS news_items_published_idx ON news_items (published_at DESC);
