-- Create songs table if not exists
CREATE TABLE IF NOT EXISTS songs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  artist_id INT,
  album VARCHAR(255),
  duration INT DEFAULT 0,
  genre VARCHAR(100),
  cover_url VARCHAR(500),
  audio_url VARCHAR(500),
  play_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE SET NULL,
  INDEX idx_artist (artist_id),
  INDEX idx_title (title),
  INDEX idx_created (created_at)
);

-- Create playlist_songs table if not exists (junction table)
CREATE TABLE IF NOT EXISTS playlist_songs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  playlist_id INT NOT NULL,
  song_id INT NOT NULL,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
  FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE,
  UNIQUE KEY unique_playlist_song (playlist_id, song_id),
  INDEX idx_playlist (playlist_id),
  INDEX idx_song (song_id)
);

-- Insert sample songs (if table is empty)
INSERT INTO songs (title, artist_id, album, duration, genre, cover_url, audio_url) 
SELECT 'Sample Song 1', 1, 'Sample Album', 180, 'Pop', NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM songs LIMIT 1);

INSERT INTO songs (title, artist_id, album, duration, genre, cover_url, audio_url) 
SELECT 'Sample Song 2', 1, 'Sample Album', 210, 'Rock', NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM songs WHERE title = 'Sample Song 2');

INSERT INTO songs (title, artist_id, album, duration, genre, cover_url, audio_url) 
SELECT 'Sample Song 3', 1, 'Sample Album', 240, 'Jazz', NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM songs WHERE title = 'Sample Song 3');
