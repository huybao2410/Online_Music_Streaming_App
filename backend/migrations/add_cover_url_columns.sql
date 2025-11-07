-- Add cover_url column to playlists table
ALTER TABLE playlists 
ADD COLUMN cover_url VARCHAR(255) NULL AFTER description;

-- Add avatar_url column to users table for future feature
ALTER TABLE users 
ADD COLUMN avatar_url VARCHAR(255) NULL AFTER username;

-- Update existing records to have NULL values (default)
UPDATE playlists SET cover_url = NULL WHERE cover_url IS NULL;
UPDATE users SET avatar_url = NULL WHERE avatar_url IS NULL;
