-- Website visitors who sign in with Google (distinct from the single owner login)
CREATE TABLE IF NOT EXISTS community_members (
  id           BIGSERIAL PRIMARY KEY,
  google_sub   TEXT UNIQUE NOT NULL,
  email        TEXT,
  name         TEXT,
  avatar_url   TEXT,
  handle       TEXT UNIQUE,                       -- display handle (derived from email, editable)
  role         TEXT NOT NULL DEFAULT 'member',    -- member | owner
  is_blocked   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
