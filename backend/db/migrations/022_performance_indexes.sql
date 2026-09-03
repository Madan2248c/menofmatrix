-- Performance indexes for hot query paths. All IF NOT EXISTS so this migration
-- is safe to re-run. Pure additions — no data or behaviour change.
--
-- Justified by real WHERE / ORDER BY / cascade paths in:
--   services/communityService.js (scoreRow, leaderboard, communityScore, listPolls)
--   services/newsService.js, services/blogService.js, routes/api.js, routes/youtube.js

-- Community scoring: leaderboard + per-member score fan out over these member_id
-- columns (UsageTracker + MatrixScore on the homepage). The PKs on the *_votes
-- tables lead with the content id, so member_id alone is unindexed today.
CREATE INDEX IF NOT EXISTS poll_votes_member_idx            ON poll_votes (member_id);
CREATE INDEX IF NOT EXISTS ideas_member_idx                 ON ideas (member_id) WHERE is_hidden = FALSE;
CREATE INDEX IF NOT EXISTS challenge_entries_member_idx     ON challenge_entries (member_id);
CREATE INDEX IF NOT EXISTS ask_questions_member_idx         ON ask_questions (member_id);
CREATE INDEX IF NOT EXISTS idea_votes_member_idx            ON idea_votes (member_id);
CREATE INDEX IF NOT EXISTS challenge_entry_votes_member_idx ON challenge_entry_votes (member_id);
CREATE INDEX IF NOT EXISTS ask_votes_member_idx             ON ask_votes (member_id);
CREATE INDEX IF NOT EXISTS content_reports_member_idx       ON content_reports (member_id);

-- Public news feed: matches latestNews() and admin list ordering exactly.
-- (Depends on the status / is_featured columns added in 021.)
DROP INDEX IF EXISTS news_items_status_published_idx;
CREATE INDEX IF NOT EXISTS news_items_status_featured_pub_idx
  ON news_items (status, is_featured DESC, published_at DESC NULLS LAST);

-- Published blog listing filters on status then orders by date.
CREATE INDEX IF NOT EXISTS blog_posts_status_published_idx
  ON blog_posts (status, published_at DESC NULLS LAST);

-- Instagram post reads always scope by account_id then order by posted_at.
CREATE INDEX IF NOT EXISTS posts_account_posted_idx
  ON posts (account_id, posted_at DESC NULLS LAST);

-- YouTube video/shorts listing and the public feed filter (account_id, is_short).
CREATE INDEX IF NOT EXISTS youtube_videos_account_short_pub_idx
  ON youtube_videos (account_id, is_short, published_at DESC NULLS LAST);
