-- Lokesh's Picks / Built: curated tools + shipped ideas.
-- Also powers the root "This Week's Pick" (is_featured) and feed "Ship Log" (in_ship_log).
CREATE TABLE IF NOT EXISTS picks (
  id          BIGSERIAL PRIMARY KEY,
  title       TEXT NOT NULL,
  url         TEXT,
  blurb       TEXT,                               -- one-line why
  category    TEXT,                               -- tool | app | site
  origin      TEXT NOT NULL DEFAULT 'curated',    -- curated | built
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,     -- root "This Week's Pick"
  in_ship_log BOOLEAN NOT NULL DEFAULT FALSE,     -- feed "Ship Log"
  shipped_at  TIMESTAMPTZ,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS picks_origin_idx ON picks (origin, sort_order);
