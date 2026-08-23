-- Let a rule optionally target one specific post instead of every post on the account
ALTER TABLE automation_rules
  ADD COLUMN IF NOT EXISTS post_id TEXT REFERENCES posts(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS automation_rules_post_idx
  ON automation_rules (post_id) WHERE post_id IS NOT NULL;
