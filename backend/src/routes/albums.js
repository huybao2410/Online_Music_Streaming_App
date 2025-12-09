// backend/src/routes/albums.js
const express = require('express');
const pool = require('../config/db');
const { verifyToken } = require('../middlewares/auth');

const router = express.Router();

// Get albums by user's favorite artists
router.get('/by-favorite-artists', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    // Lấy danh sách artist_id yêu thích
    const [favoriteArtists] = await pool.query(
      'SELECT artist_id FROM user_favorite_artists WHERE user_id = ?',
      [userId]
    );
    const artistIds = favoriteArtists.map(a => a.artist_id);
    if (artistIds.length === 0) {
      return res.json({ success: true, status: 'success', albums: [] });
    }
    // Truy vấn album có bài hát của nghệ sĩ yêu thích
    const [albums] = await pool.query(
      `SELECT DISTINCT
        al.album_id,
        al.name as album_name,
        al.cover_url,
        COUNT(DISTINCT als.song_id) as song_count
      FROM albums al
      JOIN album_songs als ON al.album_id = als.album_id
      JOIN song_artists sa ON als.song_id = sa.song_id
      WHERE sa.artist_id IN (?)
      GROUP BY al.album_id
      HAVING song_count > 0
      ORDER BY al.name ASC`,
      [artistIds]
    );
    // Format cover URLs
    const formattedAlbums = albums.map(album => ({
      ...album,
      cover_url: album.cover_url 
        ? `http://10.0.2.2:8081/music_API/online_music/${album.cover_url}`
        : 'https://placehold.co/300x300'
    }));
    return res.json({
      success: true,
      status: 'success',
      albums: formattedAlbums
    });
  } catch (error) {
    console.error('Error fetching albums by favorite artists:', error);
    return res.status(500).json({ 
      success: false,
      status: 'error',
      message: 'Lỗi khi tải albums' 
    });
  }
});

// Get songs in an album (by artist)
router.get('/:albumId/songs', async (req, res) => {
  try {
    const { albumId } = req.params;
    
    const [songs] = await pool.query(
      `SELECT 
        s.song_id,
        s.title,
        s.duration,
        s.cover_url,
        s.audio_url,
        a.name as artist,
        a.artist_id
       FROM songs s
      LEFT JOIN song_artists sa ON s.song_id = sa.song_id
      JOIN artists a ON sa.artist_id = a.artist_id
      WHERE sa.artist_id = ?
       ORDER BY s.title ASC`,
      [albumId]
    );

    // Format URLs
    const formattedSongs = songs.map(song => ({
      ...song,
      cover_url: song.cover_url 
        ? `http://10.0.2.2:8081/music_API/online_music/${song.cover_url}`
        : 'https://placehold.co/300x300',
      audio_url: song.audio_url 
        ? `http://10.0.2.2:8081/music_API/online_music/${song.audio_url}`
        : null
    }));

    return res.json({
      success: true,
      songs: formattedSongs
    });
  } catch (error) {
    console.error('Error fetching album songs:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Lỗi khi tải bài hát' 
    });
  }
});

// Check if album is favorited
router.get('/:albumId/favorite-status', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { albumId } = req.params;
    
    const [result] = await pool.query(
      'SELECT COUNT(*) as count FROM user_favorite_artists WHERE user_id = ? AND artist_id = ?',
      [userId, albumId]
    );

    return res.json({
      success: true,
      status: true,
      is_favorite: result[0].count > 0
    });
  } catch (error) {
    console.error('Error checking favorite status:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Lỗi khi kiểm tra trạng thái yêu thích' 
    });
  }
});

// Toggle favorite album (add/remove)
router.post('/:albumId/favorite', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { albumId } = req.params;
    const { action } = req.body; // 'add' or 'remove'

    if (action === 'add') {
      await pool.query(
        'INSERT IGNORE INTO user_favorite_artists (user_id, artist_id) VALUES (?, ?)',
        [userId, albumId]
      );
      return res.json({
        success: true,
        message: 'Đã thêm vào yêu thích'
      });
    } else if (action === 'remove') {
      await pool.query(
        'DELETE FROM user_favorite_artists WHERE user_id = ? AND artist_id = ?',
        [userId, albumId]
      );
      return res.json({
        success: true,
        message: 'Đã xóa khỏi yêu thích'
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Action không hợp lệ'
      });
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Lỗi khi cập nhật yêu thích' 
    });
  }
});

module.exports = router;