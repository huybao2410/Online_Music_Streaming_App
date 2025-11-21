// backend/src/routes/listening-history.js
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken } = require('../middlewares/auth');

// Get user's listening history
router.get('/', verifyToken, async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    
    const query = `
      SELECT 
        lh.id,
        lh.song_id,
        lh.listened_at,
        s.title,
        s.duration,
        s.audio_url,
        s.cover_url,
        s.artist_id,
        a.name as artist_name,
        s.genre_id,
        g.name as genre_name
      FROM listening_history lh
      JOIN songs s ON lh.song_id = s.song_id
      LEFT JOIN artists a ON s.artist_id = a.artist_id
      LEFT JOIN genres g ON s.genre_id = g.genre_id
      WHERE lh.user_id = ?
      ORDER BY lh.listened_at DESC
      LIMIT ? OFFSET ?
    `;

    const [history] = await pool.query(query, [req.user.id, parseInt(limit), parseInt(offset)]);

    return res.json({
      success: true,
      history: history.map(item => ({
        id: item.id,
        song_id: item.song_id,
        title: item.title,
        artist: item.artist_name,
        artist_id: item.artist_id,
        genre: item.genre_name,
        genre_id: item.genre_id,
        duration: item.duration,
        played_at: item.listened_at,
        audio: item.audio_url ? `http://localhost:8081/music_API/online_music/${item.audio_url}` : null,
        cover: item.cover_url ? `http://localhost:8081/music_API/online_music/${item.cover_url}` : null
      }))
    });
  } catch (error) {
    console.error('Error fetching listening history:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tải lịch sử nghe nhạc'
    });
  }
});

// Add song to listening history
router.post('/', verifyToken, async (req, res) => {
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

    // Insert into listening history
    await pool.query(
      'INSERT INTO listening_history (user_id, song_id) VALUES (?, ?)',
      [req.user.id, song_id]
    );

    // Update play count
    await pool.query(
      'UPDATE songs SET play_count = play_count + 1 WHERE song_id = ?',
      [song_id]
    );

    return res.json({
      success: true,
      message: 'Đã lưu lịch sử nghe nhạc'
    });
  } catch (error) {
    console.error('Error adding to listening history:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lưu lịch sử nghe nhạc'
    });
  }
});

// Clear listening history
router.delete('/', verifyToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM listening_history WHERE user_id = ?', [req.user.id]);

    return res.json({
      success: true,
      message: 'Đã xóa lịch sử nghe nhạc'
    });
  } catch (error) {
    console.error('Error clearing listening history:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa lịch sử nghe nhạc'
    });
  }
});

module.exports = router;
