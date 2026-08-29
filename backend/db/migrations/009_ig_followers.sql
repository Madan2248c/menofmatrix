-- 009: Cached Instagram follower list (scraped via Apify, served publicly from cache only)
CREATE TABLE IF NOT EXISTS ig_followers (
  account_id      INT NOT NULL,
  follower_id     TEXT NOT NULL,
  username        TEXT,
  full_name       TEXT,
  profile_pic_url TEXT,
  is_private      BOOLEAN,
  is_verified     BOOLEAN,
  synced_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (account_id, follower_id)
);
CREATE INDEX IF NOT EXISTS idx_ig_followers_account ON ig_followers (account_id, synced_at DESC);