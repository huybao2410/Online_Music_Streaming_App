// backend/src/routes/albums.js
const express = require('express');
const pool = require('../config/db');
const { verifyToken } = require('../middlewares/auth');

const router = express.Router();

// Get albums by user's favorite artists
router.get('/by-favorite-artists', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [albums] = await pool.query(
      `SELECT DISTINCT 
        a.artist_id as album_id,
        a.name as album_name,
        a.avatar_url as cover_url,
        a.artist_id,
        COUNT(DISTINCT s.song_id) as song_count
       FROM favorite_artists fa
       JOIN artists a ON fa.artist_id = a.artist_id
       LEFT JOIN songs s ON a.artist_id = s.artist_id
       WHERE fa.user_id = ?
       GROUP BY a.artist_id
       HAVING song_count > 0
       ORDER BY a.name ASC`,
      [userId]
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
       JOIN artists a ON s.artist_id = a.artist_id
       WHERE s.artist_id = ?
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
      'SELECT COUNT(*) as count FROM favorite_artists WHERE user_id = ? AND artist_id = ?',
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
        'INSERT IGNORE INTO favorite_artists (user_id, artist_id) VALUES (?, ?)',
        [userId, albumId]
      );
      return res.json({
        success: true,
        message: 'Đã thêm vào yêu thích'
      });
    } else if (action === 'remove') {
      await pool.query(
        'DELETE FROM favorite_artists WHERE user_id = ? AND artist_id = ?',
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
