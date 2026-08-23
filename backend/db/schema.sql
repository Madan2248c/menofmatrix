-- Instagram Analytics schema (idempotent)

-- Single-row table holding the current long-lived access token
CREATE TABLE IF NOT EXISTS ig_tokens (
  id            INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  access_token  TEXT        NOT NULL,
  token_type    TEXT,
  ig_user_id    TEXT,
  username      TEXT,
  expires_at    TIMESTAMPTZ NOT NULL,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- All media: feed posts, carousels, reels, stories
CREATE TABLE IF NOT EXISTS posts (
  id                 TEXT PRIMARY KEY,          -- IG media id
  caption            TEXT,
  media_type         TEXT,                      -- IMAGE | VIDEO | CAROUSEL_ALBUM
  media_product_type TEXT,                      -- FEED | REELS | STORY
  media_url          TEXT,
  thumbnail_url      TEXT,
  permalink          TEXT,
  posted_at          TIMESTAMPTZ,
  story_expires_at   TIMESTAMPTZ,
  like_count         INTEGER,
  comments_count     INTEGER,
  reach              INTEGER,
  views              INTEGER,
  saves              INTEGER,
  shares             INTEGER,
  total_interactions INTEGER,
  raw                JSONB,
  synced_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS posts_posted_at_idx ON posts (posted_at DESC);
CREATE INDEX IF NOT EXISTS posts_story_idx ON posts (media_product_type)
  WHERE media_product_type = 'STORY';

-- Append-only metric history per post (lets us chart trends over time)
CREATE TABLE IF NOT EXISTS post_insight_snapshots (
  id          BIGSERIAL PRIMARY KEY,
  post_id     TEXT        NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  metric      TEXT        NOT NULL,
  value       NUMERIC     NOT NULL DEFAULT 0,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pis_post_metric_time_idx
  ON post_insight_snapshots (post_id, metric, recorded_at);

-- Daily account-level KPI history
CREATE TABLE IF NOT EXISTS account_snapshots (
  snapshot_date   DATE PRIMARY KEY,
  followers_count INTEGER,
  follows_count   INTEGER,
  media_count     INTEGER,
  recorded_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sync run log
CREATE TABLE IF NOT EXISTS sync_log (
  id          BIGSERIAL PRIMARY KEY,
  started_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  status      TEXT NOT NULL DEFAULT 'running', -- running | ok | error
  message     TEXT
);
