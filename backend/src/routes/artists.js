// backend/src/routes/artists.js
const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/db');
const { verifyToken } = require('../middlewares/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Configure multer for artist avatar upload
// Upload to PHP API folder: C:/xampp/htdocs/music_API/online_music/artist/artist_avatar
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join('C:', 'xampp', 'htdocs', 'music_API', 'online_music', 'artist', 'artist_avatar');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'artist-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
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

// Get all artists for admin (no filter) - cho admin panel
router.get('/admin/all', async (req, res) => {
  try {
    const query = `
      SELECT 
        a.artist_id,
        a.name,
        a.bio,
        a.avatar_url,
        COUNT(DISTINCT s.song_id) as song_count
      FROM artists a
      LEFT JOIN songs s ON a.artist_id = s.artist_id
      GROUP BY a.artist_id, a.name, a.bio, a.avatar_url
      ORDER BY a.name ASC
    `;

    const [artists] = await pool.query(query);

    console.log(`✅ Admin: Retrieved ${artists.length} artists (all, no filter)`);

    // Avatar mặc định cho nghệ sĩ không có avatar
    const DEFAULT_AVATAR = 'https://ui-avatars.com/api/?name=';

    return res.json({
      status: true,
      success: true,
      count: artists.length,
      artists: artists.map(artist => ({
        artist_id: artist.artist_id,
        name: artist.name,
        bio: artist.bio || '',
        avatar_url: artist.avatar_url || `${DEFAULT_AVATAR}${encodeURIComponent(artist.name)}&background=4a9b9b&color=fff&size=200`,
        song_count: artist.song_count
      }))
    });
  } catch (error) {
    console.error('❌ Error in /api/artists/admin/all:', error);
    return res.status(500).json({
      status: false,
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
});

// Get all artists (public)
router.get('/', async (req, res) => {
  try {
    const { search, limit = 50, offset = 0 } = req.query;
    
    let query = `
      SELECT a.*, COUNT(DISTINCT s.song_id) as song_count
      FROM artists a
      LEFT JOIN songs s ON a.artist_id = s.artist_id
    `;
    const params = [];

    if (search) {
      query += ' WHERE a.name LIKE ?';
      params.push(`%${search}%`);
    }

    query += ' GROUP BY a.artist_id ORDER BY a.name ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [artists] = await pool.query(query, params);

    // Process avatar URLs - không cần thêm prefix vì đã dùng PHP API
    const processedArtists = artists.map(artist => ({
      ...artist,
      avatar_url: artist.avatar_url
    }));

    return res.json({
      success: true,
      artists: processedArtists
    });
  } catch (error) {
    console.error('Error fetching artists:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Lỗi khi tải danh sách nghệ sĩ' 
    });
  }
});

// Get artist by ID
router.get('/:id', async (req, res) => {
  try {
    const [artists] = await pool.query(
      `SELECT a.*, COUNT(DISTINCT s.song_id) as song_count
       FROM artists a
       LEFT JOIN songs s ON a.artist_id = s.artist_id
       WHERE a.artist_id = ?
       GROUP BY a.artist_id`,
      [req.params.id]
    );

    if (!artists.length) {
      return res.status(404).json({ 
        success: false,
        message: 'Không tìm thấy nghệ sĩ' 
      });
    }

    const artist = artists[0];

    return res.json({
      success: true,
      artist
    });
  } catch (error) {
    console.error('Error fetching artist:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Lỗi khi tải thông tin nghệ sĩ' 
    });
  }
});

// Create new artist (admin only)
router.post('/',
  verifyToken,
  isAdmin,
  upload.single('avatar'),
  body('name').trim().notEmpty().withMessage('Tên nghệ sĩ không được để trống')
    .isLength({ max: 100 }).withMessage('Tên nghệ sĩ tối đa 100 ký tự'),
  body('bio').optional().trim()
    .isLength({ max: 1000 }).withMessage('Tiểu sử tối đa 1000 ký tự'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const { name, bio } = req.body;

    try {
      // Check if artist already exists
      const [existing] = await pool.query(
        'SELECT artist_id FROM artists WHERE name = ?',
        [name]
      );

      if (existing.length > 0) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(400).json({ 
          success: false,
          message: 'Nghệ sĩ đã tồn tại' 
        });
      }

      // Lưu đường dẫn tương đối cho PHP API
      const avatarUrl = req.file ? `artist/artist_avatar/${req.file.filename}` : null;

      const [result] = await pool.query(
        'INSERT INTO artists (name, bio, avatar_url) VALUES (?, ?, ?)',
        [name, bio || null, avatarUrl]
      );

      const [newArtist] = await pool.query(
        'SELECT * FROM artists WHERE artist_id = ?',
        [result.insertId]
      );

      return res.status(201).json({
        success: true,
        message: 'Thêm nghệ sĩ thành công',
        artist: newArtist[0]
      });
    } catch (error) {
      if (req.file) fs.unlinkSync(req.file.path);
      console.error('Error creating artist:', error);
      return res.status(500).json({ 
        success: false,
        message: 'Lỗi khi thêm nghệ sĩ' 
      });
    }
  }
);

// Update artist (admin only)
router.put('/:id',
  verifyToken,
  isAdmin,
  upload.single('avatar'),
  body('name').optional().trim().notEmpty()
    .isLength({ max: 100 }).withMessage('Tên nghệ sĩ tối đa 100 ký tự'),
  body('bio').optional().trim()
    .isLength({ max: 1000 }).withMessage('Tiểu sử tối đa 1000 ký tự'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    try {
      const [artists] = await pool.query(
        'SELECT * FROM artists WHERE artist_id = ?',
        [req.params.id]
      );

      if (!artists.length) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(404).json({ 
          success: false,
          message: 'Không tìm thấy nghệ sĩ' 
        });
      }

      const { name, bio } = req.body;
      const updates = [];
      const values = [];

      if (name !== undefined) {
        updates.push('name = ?');
        values.push(name);
      }
      if (bio !== undefined) {
        updates.push('bio = ?');
        values.push(bio);
      }

      // Handle avatar upload
      if (req.file) {
        const avatarUrl = `artist/artist_avatar/${req.file.filename}`;
        updates.push('avatar_url = ?');
        values.push(avatarUrl);

        // Delete old avatar
        if (artists[0].avatar_url) {
          const oldPath = path.join('C:', 'xampp', 'htdocs', 'music_API', 'online_music', artists[0].avatar_url);
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
        }
      }

      if (updates.length === 0) {
        return res.status(400).json({ 
          success: false,
          message: 'Không có thông tin để cập nhật' 
        });
      }

      values.push(req.params.id);

      await pool.query(
        `UPDATE artists SET ${updates.join(', ')} WHERE artist_id = ?`,
        values
      );

      const [updatedArtist] = await pool.query(
        'SELECT * FROM artists WHERE artist_id = ?',
        [req.params.id]
      );

      return res.json({
        success: true,
        message: 'Cập nhật nghệ sĩ thành công',
        artist: updatedArtist[0]
      });
    } catch (error) {
      if (req.file) fs.unlinkSync(req.file.path);
      console.error('Error updating artist:', error);
      return res.status(500).json({ 
        success: false,
        message: 'Lỗi khi cập nhật nghệ sĩ' 
      });
    }
  }
);

// Delete artist (admin only)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    // Check if artist has songs
    const [songs] = await pool.query(
      'SELECT COUNT(*) as count FROM songs WHERE artist_id = ?',
      [req.params.id]
    );

    if (songs[0].count > 0) {
      return res.status(400).json({ 
        success: false,
        message: `Không thể xóa nghệ sĩ có ${songs[0].count} bài hát. Vui lòng xóa bài hát trước.` 
      });
    }

    // Get artist to delete avatar file
    const [artists] = await pool.query(
      'SELECT avatar_url FROM artists WHERE artist_id = ?',
      [req.params.id]
    );

    if (!artists.length) {
      return res.status(404).json({ 
        success: false,
        message: 'Không tìm thấy nghệ sĩ' 
      });
    }

    // Delete avatar file
    if (artists[0].avatar_url) {
      const avatarPath = path.join('C:', 'xampp', 'htdocs', 'music_API', 'online_music', artists[0].avatar_url);
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);
      }
    }

    // Delete artist
    await pool.query('DELETE FROM artists WHERE artist_id = ?', [req.params.id]);

    return res.json({
      success: true,
      message: 'Xóa nghệ sĩ thành công'
    });
  } catch (error) {
    console.error('Error deleting artist:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Lỗi khi xóa nghệ sĩ' 
    });
  }
});

module.exports = router;
