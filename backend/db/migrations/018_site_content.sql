-- Small admin-edited content surfaces for the root & feed pages.

-- Key/JSON singletons: lokesh_profile, now_next_watching, identity_hero
CREATE TABLE IF NOT EXISTS site_singletons (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- "In the Media" — press mentions of the collective
CREATE TABLE IF NOT EXISTS media_mentions (
  id           BIGSERIAL PRIMARY KEY,
  outlet       TEXT NOT NULL,
  quote        TEXT,
  url          TEXT NOT NULL,
  logo_url     TEXT,
  published_at DATE,
  sort_order   INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- "Trending Now" — ranked topic chips (admin-set; movement recomputed weekly)
CREATE TABLE IF NOT EXISTS trending_topics (
  id         BIGSERIAL PRIMARY KEY,
  label      TEXT NOT NULL,
  url        TEXT,
  rank       INT NOT NULL DEFAULT 0,
  movement   INT NOT NULL DEFAULT 0,             -- +/- vs last week
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
