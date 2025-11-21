// backend/src/routes/playlists.js
const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/db');
const { verifyToken } = require('../middlewares/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads/playlist-covers');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'cover-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Chỉ cho phép file ảnh (jpeg, jpg, png, gif)'));
    }
  }
});

const router = express.Router();

// Get all playlists of current user
router.get('/my-playlists', verifyToken, async (req, res) => {
  try {
    const [playlists] = await pool.query(
      `SELECT p.*, 
        COUNT(DISTINCT ps.song_id) as song_count,
        GROUP_CONCAT(DISTINCT s.cover_url ORDER BY ps.added_at LIMIT 4) as cover_images
       FROM playlists p
       LEFT JOIN playlist_songs ps ON p.playlist_id = ps.playlist_id
       LEFT JOIN songs s ON ps.song_id = s.song_id
       WHERE p.user_id = ?
       GROUP BY p.playlist_id
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );

    return res.json({ 
      success: true,
      playlists: playlists.map(p => ({
        ...p,
        cover_images: p.cover_images ? p.cover_images.split(',') : []
      }))
    });
  } catch (error) {
    console.error('Error fetching playlists:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Lỗi khi tải danh sách playlist' 
    });
  }
});

// Get playlist by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const [playlists] = await pool.query(
      `SELECT p.*, u.username as owner_name
       FROM playlists p
       JOIN users u ON p.user_id = u.id
       WHERE p.playlist_id = ? AND (p.is_public = 1 OR p.user_id = ?)`,
      [req.params.id, req.user.id]
    );

    if (!playlists.length) {
      return res.status(404).json({ 
        success: false,
        message: 'Không tìm thấy playlist' 
      });
    }

    // Get songs in playlist
    const [songs] = await pool.query(
      `SELECT s.song_id, s.title, s.audio_url, s.cover_url, s.duration,
              a.name as artist_name, a.artist_id,
              ps.added_at
       FROM playlist_songs ps
       JOIN songs s ON ps.song_id = s.song_id
       LEFT JOIN artists a ON s.artist_id = a.artist_id
       WHERE ps.playlist_id = ?
       ORDER BY ps.added_at DESC`,
      [req.params.id]
    );
    
    console.log(`Playlist ${req.params.id} has ${songs.length} songs`);

    return res.json({
      success: true,
      playlist: {
        ...playlists[0],
        songs
      }
    });
  } catch (error) {
    console.error('Error fetching playlist:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Lỗi khi tải playlist' 
    });
  }
});

// Create new playlist
router.post('/',
  verifyToken,
  body('name').trim().notEmpty().withMessage('Tên playlist không được để trống')
    .isLength({ max: 100 }).withMessage('Tên playlist tối đa 100 ký tự'),
  body('is_public').optional().isBoolean().withMessage('is_public phải là boolean'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const { name, is_public } = req.body;

    try {
      const [result] = await pool.query(
        `INSERT INTO playlists (user_id, name, is_public) 
         VALUES (?, ?, ?)`,
        [req.user.id, name, is_public ? 1 : 0]
      );

      const [newPlaylist] = await pool.query(
        'SELECT * FROM playlists WHERE playlist_id = ?',
        [result.insertId]
      );

      return res.status(201).json({
        success: true,
        message: 'Tạo playlist thành công',
        playlist: newPlaylist[0]
      });
    } catch (error) {
      console.error('Error creating playlist:', error);
      return res.status(500).json({ 
        success: false,
        message: 'Lỗi khi tạo playlist' 
      });
    }
  }
);

// Update playlist (with cover image upload)
router.put('/:id',
  verifyToken,
  upload.single('cover_image'),
  body('name').optional().trim().notEmpty()
    .isLength({ max: 100 }).withMessage('Tên playlist tối đa 100 ký tự'),
  body('is_public').optional(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Clean up uploaded file if validation fails
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    try {
      // Check if playlist exists and belongs to user
      const [playlists] = await pool.query(
        'SELECT * FROM playlists WHERE playlist_id = ? AND user_id = ?',
        [req.params.id, req.user.id]
      );

      if (!playlists.length) {
        // Clean up uploaded file if playlist not found
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(404).json({ 
          success: false,
          message: 'Không tìm thấy playlist hoặc bạn không có quyền chỉnh sửa' 
        });
      }

      const { name, is_public } = req.body;
      const updates = [];
      const values = [];

      if (name !== undefined) {
        updates.push('name = ?');
        values.push(name);
      }
      if (is_public !== undefined) {
        updates.push('is_public = ?');
        values.push(is_public === '1' || is_public === 'true' || is_public === true ? 1 : 0);
      }

      // Handle cover image upload
      if (req.file) {
        const coverUrl = `/uploads/playlist-covers/${req.file.filename}`;
        updates.push('cover_url = ?');
        values.push(coverUrl);

        // Delete old cover image if exists
        if (playlists[0].cover_url) {
          const oldImagePath = path.join(__dirname, '../..', playlists[0].cover_url);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }
      }

      if (updates.length === 0) {
        return res.status(400).json({ 
          success: false,
          message: 'Không có thông tin để cập nhật' 
        });
      }

      values.push(req.params.id, req.user.id);

      await pool.query(
        `UPDATE playlists SET ${updates.join(', ')} WHERE playlist_id = ? AND user_id = ?`,
        values
      );

      const [updatedPlaylist] = await pool.query(
        'SELECT * FROM playlists WHERE playlist_id = ?',
        [req.params.id]
      );

      return res.json({
        success: true,
        message: 'Cập nhật playlist thành công',
        playlist: updatedPlaylist[0]
      });
    } catch (error) {
      // Clean up uploaded file if error occurs
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      console.error('Error updating playlist:', error);
      return res.status(500).json({ 
        success: false,
        message: 'Lỗi khi cập nhật playlist' 
      });
    }
  }
);

// Delete playlist
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM playlists WHERE playlist_id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Không tìm thấy playlist hoặc bạn không có quyền xóa' 
      });
    }

    return res.json({
      success: true,
      message: 'Xóa playlist thành công'
    });
  } catch (error) {
    console.error('Error deleting playlist:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Lỗi khi xóa playlist' 
    });
  }
});

// Add song to playlist
router.post('/:id/songs',
  verifyToken,
  body('song_id').isInt().withMessage('song_id phải là số nguyên'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const { song_id } = req.body;

    try {
      // Check if playlist belongs to user
      const [playlists] = await pool.query(
        'SELECT * FROM playlists WHERE playlist_id = ? AND user_id = ?',
        [req.params.id, req.user.id]
      );

      if (!playlists.length) {
        return res.status(404).json({ 
          success: false,
          message: 'Không tìm thấy playlist' 
        });
      }

      // Check if song exists
      const [songs] = await pool.query('SELECT * FROM songs WHERE song_id = ?', [song_id]);
      if (!songs.length) {
        return res.status(404).json({ 
          success: false,
          message: 'Không tìm thấy bài hát' 
        });
      }

      // Check if song already in playlist
      const [existing] = await pool.query(
        'SELECT * FROM playlist_songs WHERE playlist_id = ? AND song_id = ?',
        [req.params.id, song_id]
      );

      if (existing.length) {
        return res.status(400).json({ 
          success: false,
          message: 'Bài hát đã có trong playlist' 
        });
      }

      // Add song to playlist
      await pool.query(
        'INSERT INTO playlist_songs (playlist_id, song_id) VALUES (?, ?)',
        [req.params.id, song_id]
      );

      return res.status(201).json({
        success: true,
        message: 'Thêm bài hát vào playlist thành công'
      });
    } catch (error) {
      console.error('Error adding song to playlist:', error);
      return res.status(500).json({ 
        success: false,
        message: 'Lỗi khi thêm bài hát vào playlist' 
      });
    }
  }
);

// Remove song from playlist
router.delete('/:id/songs/:song_id', verifyToken, async (req, res) => {
  try {
    // Check if playlist belongs to user
    const [playlists] = await pool.query(
      'SELECT * FROM playlists WHERE playlist_id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (!playlists.length) {
      return res.status(404).json({ 
        success: false,
        message: 'Không tìm thấy playlist' 
      });
    }

    const [result] = await pool.query(
      'DELETE FROM playlist_songs WHERE playlist_id = ? AND song_id = ?',
      [req.params.id, req.params.song_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Bài hát không có trong playlist' 
      });
    }

    return res.json({
      success: true,
      message: 'Xóa bài hát khỏi playlist thành công'
    });
  } catch (error) {
    console.error('Error removing song from playlist:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Lỗi khi xóa bài hát khỏi playlist' 
      });
  }
});

// Remove multiple songs from playlist
router.post('/:id/songs/remove-batch',
  verifyToken,
  body('song_ids').isArray().withMessage('song_ids phải là mảng'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const { song_ids } = req.body;

    if (!song_ids || song_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Danh sách bài hát không được rỗng'
      });
    }

    try {
      // Check if playlist belongs to user
      const [playlists] = await pool.query(
        'SELECT * FROM playlists WHERE playlist_id = ? AND user_id = ?',
        [req.params.id, req.user.id]
      );

      if (!playlists.length) {
        return res.status(404).json({ 
          success: false,
          message: 'Không tìm thấy playlist' 
        });
      }

      // Delete songs from playlist
      const placeholders = song_ids.map(() => '?').join(',');
      const [result] = await pool.query(
        `DELETE FROM playlist_songs WHERE playlist_id = ? AND song_id IN (${placeholders})`,
        [req.params.id, ...song_ids]
      );

      return res.json({
        success: true,
        message: `Đã xóa ${result.affectedRows} bài hát khỏi playlist`,
        removed_count: result.affectedRows
      });
    } catch (error) {
      console.error('Error removing songs from playlist:', error);
      return res.status(500).json({ 
        success: false,
        message: 'Lỗi khi xóa bài hát khỏi playlist' 
      });
    }
  }
);

// Update only playlist name
router.patch('/:id/name',
  verifyToken,
  body('name').trim().notEmpty().withMessage('Tên playlist không được để trống')
    .isLength({ max: 100 }).withMessage('Tên playlist tối đa 100 ký tự'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    try {
      // Check if playlist belongs to user
      const [playlists] = await pool.query(
        'SELECT * FROM playlists WHERE playlist_id = ? AND user_id = ?',
        [req.params.id, req.user.id]
      );

      if (!playlists.length) {
        return res.status(404).json({ 
          success: false,
          message: 'Không tìm thấy playlist hoặc bạn không có quyền chỉnh sửa' 
        });
      }

      const { name } = req.body;

      await pool.query(
        'UPDATE playlists SET name = ? WHERE playlist_id = ? AND user_id = ?',
        [name, req.params.id, req.user.id]
      );

      return res.json({
        success: true,
        message: 'Cập nhật tên playlist thành công'
      });
    } catch (error) {
      console.error('Error updating playlist name:', error);
      return res.status(500).json({ 
        success: false,
        message: 'Lỗi khi cập nhật tên playlist' 
      });
    }
  }
);

module.exports = router;
