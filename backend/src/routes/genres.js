// backend/src/routes/genres.js
const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/db');
const { verifyToken } = require('../middlewares/auth');

const router = express.Router();

// Middleware to check admin role
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false,
      message: 'Không có quyền truy cập' 
    });
  }
  next();
};

// Get all genres (public)
router.get('/', async (req, res) => {
  try {
    const { search, limit = 50, offset = 0 } = req.query;
    
    let query = `
      SELECT g.*, COUNT(DISTINCT s.song_id) as song_count
      FROM genres g
      LEFT JOIN songs s ON g.genre_id = s.genre_id
    `;
    const params = [];

    if (search) {
      query += ' WHERE g.name LIKE ?';
      params.push(`%${search}%`);
    }

    query += ' GROUP BY g.genre_id ORDER BY g.name ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [genres] = await pool.query(query, params);

    return res.json({
      success: true,
      genres
    });
  } catch (error) {
    console.error('Error fetching genres:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Lỗi khi tải danh sách thể loại' 
    });
  }
});

// Get genre by ID
router.get('/:id', async (req, res) => {
  try {
    const [genres] = await pool.query(
      `SELECT g.*, COUNT(DISTINCT s.song_id) as song_count
       FROM genres g
       LEFT JOIN songs s ON g.genre_id = s.genre_id
       WHERE g.genre_id = ?
       GROUP BY g.genre_id`,
      [req.params.id]
    );

    if (!genres.length) {
      return res.status(404).json({ 
        success: false,
        message: 'Không tìm thấy thể loại' 
      });
    }

    return res.json({
      success: true,
      genre: genres[0]
    });
  } catch (error) {
    console.error('Error fetching genre:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Lỗi khi tải thông tin thể loại' 
    });
  }
});

// Create new genre (admin only)
router.post('/',
  verifyToken,
  isAdmin,
  body('name').trim().notEmpty().withMessage('Tên thể loại không được để trống')
    .isLength({ max: 50 }).withMessage('Tên thể loại tối đa 50 ký tự'),
  body('description').optional().trim()
    .isLength({ max: 500 }).withMessage('Mô tả tối đa 500 ký tự'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const { name, description } = req.body;

    try {
      // Check if genre already exists
      const [existing] = await pool.query(
        'SELECT genre_id FROM genres WHERE name = ?',
        [name]
      );

      if (existing.length > 0) {
        return res.status(400).json({ 
          success: false,
          message: 'Thể loại đã tồn tại' 
        });
      }

      const [result] = await pool.query(
        'INSERT INTO genres (name, description) VALUES (?, ?)',
        [name, description || null]
      );

      const [newGenre] = await pool.query(
        'SELECT * FROM genres WHERE genre_id = ?',
        [result.insertId]
      );

      return res.status(201).json({
        success: true,
        message: 'Thêm thể loại thành công',
        genre: newGenre[0]
      });
    } catch (error) {
      console.error('Error creating genre:', error);
      return res.status(500).json({ 
        success: false,
        message: 'Lỗi khi thêm thể loại' 
      });
    }
  }
);

// Update genre (admin only)
router.put('/:id',
  verifyToken,
  isAdmin,
  body('name').optional().trim().notEmpty()
    .isLength({ max: 50 }).withMessage('Tên thể loại tối đa 50 ký tự'),
  body('description').optional().trim()
    .isLength({ max: 500 }).withMessage('Mô tả tối đa 500 ký tự'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    try {
      const [genres] = await pool.query(
        'SELECT * FROM genres WHERE genre_id = ?',
        [req.params.id]
      );

      if (!genres.length) {
        return res.status(404).json({ 
          success: false,
          message: 'Không tìm thấy thể loại' 
        });
      }

      const { name, description } = req.body;
      const updates = [];
      const values = [];

      if (name !== undefined) {
        updates.push('name = ?');
        values.push(name);
      }
      if (description !== undefined) {
        updates.push('description = ?');
        values.push(description);
      }

      if (updates.length === 0) {
        return res.status(400).json({ 
          success: false,
          message: 'Không có thông tin để cập nhật' 
        });
      }

      values.push(req.params.id);

      await pool.query(
        `UPDATE genres SET ${updates.join(', ')} WHERE genre_id = ?`,
        values
      );

      const [updatedGenre] = await pool.query(
        'SELECT * FROM genres WHERE genre_id = ?',
        [req.params.id]
      );

      return res.json({
        success: true,
        message: 'Cập nhật thể loại thành công',
        genre: updatedGenre[0]
      });
    } catch (error) {
      console.error('Error updating genre:', error);
      return res.status(500).json({ 
        success: false,
        message: 'Lỗi khi cập nhật thể loại' 
      });
    }
  }
);

// Delete genre (admin only)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    // Check if genre has songs
    const [songs] = await pool.query(
      'SELECT COUNT(*) as count FROM songs WHERE genre_id = ?',
      [req.params.id]
    );

    if (songs[0].count > 0) {
      return res.status(400).json({ 
        success: false,
        message: `Không thể xóa thể loại có ${songs[0].count} bài hát. Vui lòng xóa bài hát trước.` 
      });
    }

    // Get genre
    const [genres] = await pool.query(
      'SELECT * FROM genres WHERE genre_id = ?',
      [req.params.id]
    );

    if (!genres.length) {
      return res.status(404).json({ 
        success: false,
        message: 'Không tìm thấy thể loại' 
      });
    }

    // Delete genre
    await pool.query('DELETE FROM genres WHERE genre_id = ?', [req.params.id]);

    return res.json({
      success: true,
      message: 'Xóa thể loại thành công'
    });
  } catch (error) {
    console.error('Error deleting genre:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Lỗi khi xóa thể loại' 
    });
  }
});

module.exports = router;
