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
      'SELECT id, username, email, phone_number, avatar_url, role, created_at FROM users WHERE id = ?',
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
      user: {
        user_id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone_number,
        avatar_url: user.avatar_url,
        role: user.role,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Lỗi khi tải thông tin người dùng' 
    });
  }
});

// Update user profile (username, email, phone, birthday, avatar)
router.put('/profile',
  verifyToken,
  upload.single('avatar'),
  body('username').optional().trim().notEmpty()
    .isLength({ min: 3, max: 50 }).withMessage('Tên người dùng phải từ 3-50 ký tự'),
  body('email').optional().isEmail().withMessage('Email không hợp lệ'),
  body('phone_number').optional().trim(),
  body('date_of_birth').optional().isISO8601().withMessage('Ngày sinh không hợp lệ'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    try {
      const { username, email, phone_number, date_of_birth } = req.body;
      
      // Check if user is Google account (based on password hash placeholder)
      const [currentUser] = await pool.query(
        'SELECT password_hash FROM users WHERE id = ?',
        [req.user.id]
      );
      
      const isGoogleAccount = currentUser.length > 0 && 
        currentUser[0].password_hash.includes('GOOGLE_OAUTH_USER_NO_PASSWORD_HASH_PLACEHOLDER');
      
      const updates = [];
      const values = [];

      // Build dynamic update query
      if (username) {
        // Check if username already exists
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
        updates.push('username = ?');
        values.push(username);
      }

      if (email) {
        // Prevent Google account from changing email
        if (isGoogleAccount) {
          return res.status(403).json({ 
            success: false,
            message: 'Tài khoản Google không thể thay đổi email' 
          });
        }
        
        // Check if email already exists
        const [existing] = await pool.query(
          'SELECT id FROM users WHERE email = ? AND id != ?',
          [email, req.user.id]
        );
        if (existing.length > 0) {
          return res.status(400).json({ 
            success: false,
            message: 'Email đã tồn tại' 
          });
        }
        updates.push('email = ?');
        values.push(email);
      }

      if (phone_number !== undefined) {
        updates.push('phone_number = ?');
        values.push(phone_number);
      }
      
      // Support 'phone' field as well (from frontend)
      if (req.body.phone !== undefined) {
        updates.push('phone_number = ?');
        values.push(req.body.phone);
      }

      if (date_of_birth) {
        updates.push('date_of_birth = ?');
        values.push(date_of_birth);
      }

      // Handle avatar upload
      if (req.file) {
        // Get current avatar
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

        const avatarUrl = `/uploads/avatars/${req.file.filename}`;
        updates.push('avatar_url = ?');
        values.push(avatarUrl);
      }

      if (updates.length === 0) {
        return res.status(400).json({ 
          success: false,
          message: 'Không có thông tin để cập nhật' 
        });
      }

      // Execute update
      values.push(req.user.id);
      await pool.query(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        values
      );

      // Get updated user
      const [updatedUser] = await pool.query(
        'SELECT id, username, email, phone_number, date_of_birth, avatar_url, role, status FROM users WHERE id = ?',
        [req.user.id]
      );

      // Process avatar URL
      if (updatedUser[0].avatar_url && !updatedUser[0].avatar_url.startsWith('http')) {
        updatedUser[0].avatar_url = `http://localhost:5000${updatedUser[0].avatar_url}`;
      }

      return res.json({
        success: true,
        message: 'Cập nhật hồ sơ thành công',
        user: updatedUser[0]
      });
    } catch (error) {
      // Clean up uploaded file if error occurs
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
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

// Change password
router.put('/change-password',
  verifyToken,
  body('currentPassword').notEmpty().withMessage('Vui lòng nhập mật khẩu hiện tại'),
  body('newPassword')
    .notEmpty().withMessage('Vui lòng nhập mật khẩu mới')
    .isLength({ min: 6 }).withMessage('Mật khẩu mới phải có ít nhất 6 ký tự'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    try {
      const { currentPassword, newPassword } = req.body;

      // Get current user
      const [users] = await pool.query(
        'SELECT id, password_hash FROM users WHERE id = ?',
        [req.user.id]
      );

      if (!users.length) {
        return res.status(404).json({ 
          success: false,
          message: 'Không tìm thấy người dùng' 
        });
      }

      // Check if user is Google account (based on password hash placeholder)
      const isGoogleAccount = users[0].password_hash.includes('GOOGLE_OAUTH_USER_NO_PASSWORD_HASH_PLACEHOLDER');
      if (isGoogleAccount) {
        return res.status(403).json({ 
          success: false,
          message: 'Tài khoản Google không thể đổi mật khẩu. Vui lòng quản lý mật khẩu qua Google Account.' 
        });
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, users[0].password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ 
          success: false,
          message: 'Mật khẩu hiện tại không đúng' 
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await pool.query(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, req.user.id]
      );

      return res.json({
        success: true,
        message: 'Đổi mật khẩu thành công'
      });
    } catch (error) {
      console.error('Error changing password:', error);
      return res.status(500).json({ 
        success: false,
        message: 'Lỗi khi đổi mật khẩu' 
      });
    }
  }
);

module.exports = router;
