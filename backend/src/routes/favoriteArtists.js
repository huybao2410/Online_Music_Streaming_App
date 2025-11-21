// backend/src/routes/favoriteArtists.js
const express = require('express');
const pool = require('../config/db');
const { verifyToken } = require('../middlewares/auth');

const router = express.Router();

// Get user's favorite artists
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [favorites] = await pool.query(
      `SELECT a.*, fa.created_at as favorited_at
       FROM favorite_artists fa
       JOIN artists a ON fa.artist_id = a.artist_id
       WHERE fa.user_id = ?
       ORDER BY fa.created_at DESC`,
      [userId]
    );

    return res.json({
      success: true,
      favoriteArtists: favorites
    });
  } catch (error) {
    console.error('Error fetching favorite artists:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Lỗi khi tải nghệ sĩ yêu thích' 
    });
  }
});

// Add artist to favorites
router.post('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { artist_id } = req.body;

    if (!artist_id) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu artist_id'
      });
    }

    // Check if artist exists
    const [artists] = await pool.query(
      'SELECT artist_id FROM artists WHERE artist_id = ?',
      [artist_id]
    );

    if (artists.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nghệ sĩ'
      });
    }

    // Add to favorites
    await pool.query(
      'INSERT IGNORE INTO favorite_artists (user_id, artist_id) VALUES (?, ?)',
      [userId, artist_id]
    );

    return res.json({
      success: true,
      message: 'Đã thêm vào yêu thích'
    });
  } catch (error) {
    console.error('Error adding favorite artist:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Lỗi khi thêm nghệ sĩ yêu thích' 
    });
  }
});

// Remove artist from favorites
router.delete('/:artist_id', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { artist_id } = req.params;

    await pool.query(
      'DELETE FROM favorite_artists WHERE user_id = ? AND artist_id = ?',
      [userId, artist_id]
    );

    return res.json({
      success: true,
      message: 'Đã xóa khỏi yêu thích'
    });
  } catch (error) {
    console.error('Error removing favorite artist:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Lỗi khi xóa nghệ sĩ yêu thích' 
    });
  }
});

// Save multiple favorite artists (for onboarding)
router.post('/bulk', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { artist_ids } = req.body;

    if (!Array.isArray(artist_ids) || artist_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Danh sách artist_ids không hợp lệ'
      });
    }

    // Insert multiple favorites
    const values = artist_ids.map(artist_id => [userId, artist_id]);
    await pool.query(
      'INSERT IGNORE INTO favorite_artists (user_id, artist_id) VALUES ?',
      [values]
    );

    return res.json({
      success: true,
      message: `Đã lưu ${artist_ids.length} nghệ sĩ yêu thích`
    });
  } catch (error) {
    console.error('Error saving favorite artists:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Lỗi khi lưu nghệ sĩ yêu thích' 
    });
  }
});

// Check if user has selected favorite artists (for onboarding check)
router.get('/check', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [result] = await pool.query(
      'SELECT COUNT(*) as count FROM favorite_artists WHERE user_id = ?',
      [userId]
    );

    return res.json({
      success: true,
      has_favorites: result[0].count > 0,
      count: result[0].count
    });
  } catch (error) {
    console.error('Error checking favorite artists:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Lỗi khi kiểm tra nghệ sĩ yêu thích' 
    });
  }
});

module.exports = router;
