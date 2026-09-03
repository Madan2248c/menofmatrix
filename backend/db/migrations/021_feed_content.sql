-- Admin-manageable fields for Feed news. RSS/Google ingestion can continue to
-- populate the same table later; manual rows use an admin:* guid.
ALTER TABLE news_items ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE news_items ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published';
ALTER TABLE news_items ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE news_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS news_items_status_published_idx
  ON news_items (status, published_at DESC);
