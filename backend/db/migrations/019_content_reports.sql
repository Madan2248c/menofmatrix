-- Report-to-hide moderation. Submissions post instantly; members can report,
-- and a target auto-hides once report_count crosses the threshold (see
-- communityService.autoHideThreshold). Owner can unhide/delete + block members.
CREATE TABLE IF NOT EXISTS content_reports (
  id          BIGSERIAL PRIMARY KEY,
  entity_type TEXT NOT NULL,                      -- idea | challenge_entry | ask_question
  entity_id   BIGINT NOT NULL,
  member_id   BIGINT NOT NULL REFERENCES community_members(id) ON DELETE CASCADE,
  reason      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (entity_type, entity_id, member_id)
);

CREATE INDEX IF NOT EXISTS content_reports_entity_idx ON content_reports (entity_type, entity_id);
