-- Blog posts written by the owner (rich text HTML + cover image URL)
CREATE TABLE IF NOT EXISTS blog_posts (
  id              BIGSERIAL PRIMARY KEY,
  slug            TEXT UNIQUE NOT NULL,
  title           TEXT NOT NULL,
  excerpt         TEXT,
  content_html    TEXT NOT NULL DEFAULT '',
  cover_image_url TEXT,
  status          TEXT NOT NULL DEFAULT 'draft',
  published_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS blog_posts_published_idx ON blog_posts (published_at DESC);
