-- Migration: Simple Google OAuth Support
-- Description: Make password_hash nullable to allow Google accounts (password = NULL)

-- Make password_hash nullable (Google users don't have password)
ALTER TABLE users 
MODIFY COLUMN password_hash VARCHAR(255) NULL;
