-- Idea Board: AI tool/product ideas submitted by members, upvoted by the community
CREATE TABLE IF NOT EXISTS ideas (
  id            BIGSERIAL PRIMARY KEY,
  member_id     BIGINT NOT NULL REFERENCES community_members(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  body          TEXT,
  status        TEXT NOT NULL DEFAULT 'new',      -- new | picked | built
  built_pick_id BIGINT,                           -- -> picks(id) once shipped (closes the loop)
  is_hidden     BOOLEAN NOT NULL DEFAULT FALSE,
  report_count  INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ideas_visible_idx ON ideas (is_hidden, created_at DESC);

CREATE TABLE IF NOT EXISTS idea_votes (
  idea_id    BIGINT NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  member_id  BIGINT NOT NULL REFERENCES community_members(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (idea_id, member_id)
);
