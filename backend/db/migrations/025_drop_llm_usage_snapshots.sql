-- Removes the never-actually-live Chrome extension usage table. The extension
-- (5-hour/weekly limit tracking for Claude/ChatGPT) and its widget were added
-- and un-rendered in consecutive commits, so this table was almost certainly
-- never created in production, but drop it defensively in case any deployment
-- did create it via the now-deleted /api/usage route's lazy CREATE TABLE.
DROP TABLE IF EXISTS llm_usage_snapshots;
