// backend/src/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/adminUsers');
const playlistRoutes = require('./routes/playlists');
const userRoutes = require('./routes/users');
const artistRoutes = require('./routes/artists');
const songRoutes = require('./routes/songs');
const genreRoutes = require('./routes/genres');
const favoriteArtistsRoutes = require('./routes/favoriteArtists');
const subscriptionsRoutes = require('./routes/subscriptions');
const albumRoutes = require('./routes/albums');
const adminAlbumsRoutes = require('./routes/adminAlbums');
const paymentsRoutes = require('./routes/payments');
const searchRoutes = require('./routes/search');
const listeningHistoryRoutes = require('./routes/listening-history');
const favoriteSongsRoutes = require('./routes/favorite-songs');

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000', credentials: true }));
app.use(express.json());

// Serve static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/users', userRoutes);
app.use('/api/artists', artistRoutes);
app.use('/api/songs', songRoutes);
app.use('/api/genres', genreRoutes);
app.use('/api/favorite-artists', favoriteArtistsRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/albums', albumRoutes);
app.use('/api/admin/albums', adminAlbumsRoutes);
app.use('/api', paymentsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/listening-history', listeningHistoryRoutes);
app.use('/api/favorite-songs', favoriteSongsRoutes);

app.get('/api/health', (req, res) => res.json({ message: 'Backend is running' }));

// Test endpoint to check songs
app.get('/api/test/songs', async (req, res) => {
  try {
    const pool = require('./config/db');
    const [songs] = await pool.query('SELECT * FROM songs LIMIT 5');
    res.json({ 
      success: true, 
      message: 'Songs table is working',
      count: songs.length,
      songs 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

console.log("JWT_SECRET:", process.env.JWT_SECRET);
console.log("JWT_EXPIRES_IN:", process.env.JWT_EXPIRES_IN);

const pool = require('./config/db');

(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("MySQL connected!");
    
    // Auto-create songs table if not exists
    await conn.query(`
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
      )
    `);
    console.log("Songs table ready");

    // Auto-create playlist_songs junction table if not exists
    await conn.query(`
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
      )
    `);
    console.log("Playlist_songs table ready");

    // Check if songs table is empty and insert sample data
    const [rows] = await conn.query('SELECT COUNT(*) as count FROM songs');
    if (rows[0].count === 0) {
      console.log("Inserting sample songs...");
      await conn.query(`
        INSERT INTO songs (title, artist_id, album, duration, genre) VALUES
        ('Sample Song 1', 1, 'Sample Album', 180, 'Pop'),
        ('Sample Song 2', 1, 'Sample Album', 210, 'Rock'),
        ('Sample Song 3', 1, 'Sample Album', 240, 'Jazz')
      `);
      console.log("Sample songs inserted");
    }
    
    conn.release();
  } catch (err) {
    console.error("MySQL connection error:", err.message);
  }
})();

