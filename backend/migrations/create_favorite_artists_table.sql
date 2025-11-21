-- Migration: Create favorite_artists table
-- Description: Store user's favorite artists

CREATE TABLE IF NOT EXISTS favorite_artists (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  artist_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (artist_id) REFERENCES artists(artist_id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_artist (user_id, artist_id),
  INDEX idx_user_id (user_id),
  INDEX idx_artist_id (artist_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
