-- YouTube integration: accounts, videos, Shorts, analytics snapshots
CREATE TABLE IF NOT EXISTS youtube_accounts (
  id              SERIAL PRIMARY KEY,
  youtube_channel_id TEXT UNIQUE NOT NULL,
  channel_title   TEXT,
  access_token    TEXT        NOT NULL,
  refresh_token   TEXT        NOT NULL,
  expires_at      TIMESTAMPTZ NOT NULL,
  connected_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS youtube_videos (
  id              TEXT PRIMARY KEY,          -- YouTube video id
  account_id      INTEGER NOT NULL REFERENCES youtube_accounts(id) ON DELETE CASCADE,
  title           TEXT,
  description     TEXT,
  thumbnail_url   TEXT,
  video_url       TEXT,
  duration_seconds INTEGER,
  is_short        BOOLEAN NOT NULL DEFAULT FALSE,
  privacy_status  TEXT,
  published_at    TIMESTAMPTZ,
  view_count      BIGINT,
  like_count      BIGINT,
  comment_count   BIGINT,
  raw             JSONB,
  synced_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS youtube_videos_published_idx ON youtube_videos (published_at DESC);
CREATE INDEX IF NOT EXISTS youtube_videos_shorts_idx ON youtube_videos (is_short) WHERE is_short = TRUE;

CREATE TABLE IF NOT EXISTS youtube_video_snapshots (
  id            BIGSERIAL PRIMARY KEY,
  video_id      TEXT NOT NULL REFERENCES youtube_videos(id) ON DELETE CASCADE,
  metric        TEXT NOT NULL,
  value         NUMERIC NOT NULL DEFAULT 0,
  recorded_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS yvs_video_metric_time_idx
  ON youtube_video_snapshots (video_id, metric, recorded_at);

CREATE TABLE IF NOT EXISTS youtube_account_snapshots (
  account_id      INTEGER NOT NULL REFERENCES youtube_accounts(id) ON DELETE CASCADE,
  snapshot_date   DATE NOT NULL,
  subscriber_count BIGINT,
  view_count      BIGINT,
  video_count     BIGINT,
  recorded_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (account_id, snapshot_date)
);
