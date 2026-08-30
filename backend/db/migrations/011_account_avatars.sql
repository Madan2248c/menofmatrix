-- Persist the account's own profile picture so public pages can show a real avatar
-- instead of just a platform icon.
ALTER TABLE ig_accounts      ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;
ALTER TABLE youtube_accounts ADD COLUMN IF NOT EXISTS avatar_url TEXT;
