-- RESERVED for the Tool Usage Rankings ("The Stack") feature.
-- No data flows in yet — the /api/community/rankings endpoint returns [] until
-- a usage tracker (browser extension / API) is built and writes member_tool_usage.

CREATE TABLE IF NOT EXISTS tools_catalog (
  slug     TEXT PRIMARY KEY,
  name     TEXT NOT NULL,
  category TEXT,
  icon_url TEXT
);

CREATE TABLE IF NOT EXISTS member_tool_usage (
  id          BIGSERIAL PRIMARY KEY,
  member_id   BIGINT NOT NULL REFERENCES community_members(id) ON DELETE CASCADE,
  tool_slug   TEXT NOT NULL REFERENCES tools_catalog(slug) ON DELETE CASCADE,
  weight      NUMERIC NOT NULL DEFAULT 1,         -- usage share/count, filled by the future tracker
  source      TEXT NOT NULL DEFAULT 'manual',     -- manual | extension | api
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (member_id, tool_slug, source)
);

-- Weekly snapshot used to compute the "Stack Diff" (rank movement vs last week)
CREATE TABLE IF NOT EXISTS tool_usage_rollups (
  week_start DATE NOT NULL,
  tool_slug  TEXT NOT NULL,
  members    INT NOT NULL DEFAULT 0,
  share      NUMERIC NOT NULL DEFAULT 0,
  rank       INT,
  prev_rank  INT,
  PRIMARY KEY (week_start, tool_slug)
);
