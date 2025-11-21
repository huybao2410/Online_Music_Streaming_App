const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken } = require('../middlewares/auth');

// Get user's favorite songs
router.get('/', verifyToken, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    const query = `
      SELECT 
        s.song_id,
        fs.added_at,
        s.title,
        s.duration,
        s.audio_url,
        s.cover_url,
        s.release_date,
        s.artist_id,
        a.name as artist_name,
        s.genre_id,
        g.name as genre_name
      FROM favorites_songs fs
      JOIN songs s ON fs.song_id = s.song_id
      LEFT JOIN artists a ON s.artist_id = a.artist_id
      LEFT JOIN genres g ON s.genre_id = g.genre_id
      WHERE fs.user_id = ?
      ORDER BY fs.added_at DESC
      LIMIT ? OFFSET ?
    `;

    const [favorites] = await pool.query(query, [req.user.id, parseInt(limit), parseInt(offset)]);

    return res.json({
      success: true,
      count: favorites.length,
      favorites: favorites.map(item => ({
        id: item.id,
        song_id: item.song_id,
        title: item.title,
        artist: item.artist_name,
        artist_id: item.artist_id,
        genre: item.genre_name,
        genre_id: item.genre_id,
        duration: item.duration,
        added_at: item.added_at,
        audio: item.audio_url ? `http://localhost:8081/music_API/online_music/${item.audio_url}` : null,
        cover: item.cover_url ? `http://localhost:8081/music_API/online_music/${item.cover_url}` : null,
        release_date: item.release_date
      }))
    });
  } catch (error) {
    console.error('Error fetching favorite songs:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tải bài hát yêu thích'
    });
  }
});

// Add song to favorites
router.post('/add', verifyToken, async (req, res) => {
  try {
    const { song_id } = req.body;

    if (!song_id) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bài hát'
      });
    }

    // Check if song exists
    const [songs] = await pool.query('SELECT song_id FROM songs WHERE song_id = ?', [song_id]);
    if (songs.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài hát'
      });
    }

    // Check if already favorited
    const [existing] = await pool.query(
      'SELECT user_id, song_id FROM favorites_songs WHERE user_id = ? AND song_id = ?',
      [req.user.id, song_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Bài hát đã có trong danh sách yêu thích'
      });
    }

    // Add to favorites
    await pool.query(
      'INSERT IGNORE INTO favorites_songs (user_id, song_id) VALUES (?, ?)',
      [req.user.id, song_id]
    );

    return res.json({
      success: true,
      message: 'Đã thêm vào bài hát yêu thích'
    });
  } catch (error) {
    console.error('Error adding to favorites:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi thêm bài hát yêu thích'
    });
  }
});

// Remove song from favorites
router.delete('/remove/:song_id', verifyToken, async (req, res) => {
  try {
    const { song_id } = req.params;

    const [result] = await pool.query(
      'DELETE FROM favorites_songs WHERE user_id = ? AND song_id = ?',
      [req.user.id, song_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Bài hát không có trong danh sách yêu thích'
      });
    }

    return res.json({
      success: true,
      message: 'Đã xóa khỏi bài hát yêu thích'
    });
  } catch (error) {
    console.error('Error removing from favorites:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa bài hát yêu thích'
    });
  }
});

// Check if song is favorited
router.get('/check/:song_id', verifyToken, async (req, res) => {
  try {
    const { song_id } = req.params;

    const [favorite] = await pool.query(
      'SELECT id FROM favorite_songs WHERE user_id = ? AND song_id = ?',
      [req.user.id, song_id]
    );

    return res.json({
      success: true,
      is_favorite: favorite.length > 0
    });
  } catch (error) {
    console.error('Error checking favorite status:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi kiểm tra trạng thái yêu thích'
    });
  }
});

module.exports = router;
