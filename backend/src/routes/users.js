// backend/src/routes/users.js
const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/db');
const { verifyToken } = require('../middlewares/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Configure multer for avatar upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads/avatars');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
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

// Get current user profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, username, email, avatar_url, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!users.length) {
      return res.status(404).json({ 
        success: false,
        message: 'Không tìm thấy người dùng' 
      });
    }

    const user = users[0];
    
    // Process avatar URL
    if (user.avatar_url && !user.avatar_url.startsWith('http')) {
      user.avatar_url = `http://localhost:5000${user.avatar_url}`;
    }

    return res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Lỗi khi tải thông tin người dùng' 
    });
  }
});

// Update user profile (username)
router.put('/profile',
  verifyToken,
  body('username').optional().trim().notEmpty()
    .isLength({ min: 3, max: 50 }).withMessage('Tên người dùng phải từ 3-50 ký tự'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    try {
      const { username } = req.body;

      if (!username) {
        return res.status(400).json({ 
          success: false,
          message: 'Không có thông tin để cập nhật' 
        });
      }

      // Check if username already exists (excluding current user)
      const [existing] = await pool.query(
        'SELECT id FROM users WHERE username = ? AND id != ?',
        [username, req.user.id]
      );

      if (existing.length > 0) {
        return res.status(400).json({ 
          success: false,
          message: 'Tên người dùng đã tồn tại' 
        });
      }

      // Update username
      await pool.query(
        'UPDATE users SET username = ? WHERE id = ?',
        [username, req.user.id]
      );

      const [updatedUser] = await pool.query(
        'SELECT id, username, email, avatar_url, role FROM users WHERE id = ?',
        [req.user.id]
      );

      return res.json({
        success: true,
        message: 'Cập nhật tên người dùng thành công',
        user: updatedUser[0]
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      return res.status(500).json({ 
        success: false,
        message: 'Lỗi khi cập nhật thông tin' 
      });
    }
  }
);

// Upload avatar
router.post('/avatar',
  verifyToken,
  upload.single('avatar'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          success: false,
          message: 'Vui lòng chọn file ảnh' 
        });
      }

      // Get current user's avatar
      const [users] = await pool.query(
        'SELECT avatar_url FROM users WHERE id = ?',
        [req.user.id]
      );

      // Delete old avatar if exists
      if (users.length && users[0].avatar_url) {
        const oldAvatarPath = path.join(__dirname, '../..', users[0].avatar_url);
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
        }
      }

      // Update avatar URL in database
      const avatarUrl = `/uploads/avatars/${req.file.filename}`;
      await pool.query(
        'UPDATE users SET avatar_url = ? WHERE id = ?',
        [avatarUrl, req.user.id]
      );

      return res.json({
        success: true,
        message: 'Cập nhật ảnh đại diện thành công',
        avatar_url: `http://localhost:5000${avatarUrl}`
      });
    } catch (error) {
      // Clean up uploaded file if error occurs
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      console.error('Error uploading avatar:', error);
      return res.status(500).json({ 
        success: false,
        message: 'Lỗi khi tải lên ảnh đại diện' 
      });
    }
  }
);

// Delete avatar
router.delete('/avatar', verifyToken, async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT avatar_url FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length && users[0].avatar_url) {
      // Delete file from disk
      const avatarPath = path.join(__dirname, '../..', users[0].avatar_url);
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);
      }

      // Update database
      await pool.query(
        'UPDATE users SET avatar_url = NULL WHERE id = ?',
        [req.user.id]
      );
    }

    return res.json({
      success: true,
      message: 'Xóa ảnh đại diện thành công'
    });
  } catch (error) {
    console.error('Error deleting avatar:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Lỗi khi xóa ảnh đại diện' 
    });
  }
});

module.exports = router;
