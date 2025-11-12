// backend/src/routes/auth.js
const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { verifyToken } = require('../middlewares/auth');
require('dotenv').config();

const router = express.Router();

// Register
router.post('/register',
  body('phone_number').isMobilePhone().withMessage('Số điện thoại không hợp lệ'),
  body('email').optional().isEmail().withMessage('Email không hợp lệ'),
  body('password').isLength({ min: 6 }).withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
  async (req, res) => {
    const errors = validationResult(req); 
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { phone_number, email, password } = req.body;

    try {
      // Kiểm tra số điện thoại đã tồn tại chưa
      const [existsPhone] = await pool.query('SELECT id FROM users WHERE phone_number = ?', [phone_number]);
      if (existsPhone.length) return res.status(400).json({ message: 'Số điện thoại đã được sử dụng' });

      // Kiểm tra email đã tồn tại chưa (nếu có email)
      if (email) {
        const [existsEmail] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existsEmail.length) return res.status(400).json({ message: 'Email đã được sử dụng' });
      }

      // Hash password
      const hash = await bcrypt.hash(password, 10);

      // Thêm user mới
      const [result] = await pool.query(
        `INSERT INTO users (phone_number, email, password_hash, status) VALUES (?, ?, ?, ?)`,
        [phone_number, email || null, hash, 'active']
      );

      // Tạo token
      const token = jwt.sign(
        { id: result.insertId, phone_number, email: email || null, role: 'user' },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      return res.status(201).json({
        message: 'Đăng ký thành công',
        token,
        user: { 
          id: result.insertId, 
          phone_number, 
          email: email || null,
          role: 'user' 
        }
      });

    } catch (err) {
      console.error('Register error: ', err.message);
      return res.status(500).json({ message: err.message });
    }
  }
);


// Login bằng phone_number hoặc email
router.post('/login',
  body('identifier').notEmpty().withMessage('Email hoặc số điện thoại không được để trống'), // identifier có thể là email hoặc phone
  body('password').notEmpty().withMessage('Mật khẩu không được để trống'),
  async (req, res) => {
    const errors = validationResult(req); 
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { identifier, password } = req.body;

    try {
      // Kiểm tra identifier là email hay phone_number
      const isEmail = identifier.includes('@');
      
      let query, params;
      if (isEmail) {
        query = 'SELECT * FROM users WHERE email = ?';
        params = [identifier];
      } else {
        query = 'SELECT * FROM users WHERE phone_number = ?';
        params = [identifier];
      }

      // Tìm user
      const [rows] = await pool.query(query, params);
      if (!rows.length) {
        return res.status(400).json({ 
          message: isEmail ? 'Email không tồn tại' : 'Số điện thoại không tồn tại' 
        });
      }

      const user = rows[0];
      
      // Kiểm tra password
      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) return res.status(400).json({ message: 'Mật khẩu không đúng' });
      
      // Kiểm tra trạng thái
      if (user.status !== 'active') {
        return res.status(403).json({ message: `Tài khoản đang ở trạng thái ${user.status}` });
      }

      // Tạo token JWT
      const token = jwt.sign(
        { 
          id: user.id, 
          phone_number: user.phone_number, 
          email: user.email,
          role: user.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      return res.json({
        token,
        user: { 
          id: user.id, 
          username: user.username,
          phone_number: user.phone_number,
          email: user.email,
          role: user.role, 
          avatar_url: user.avatar_url 
        }
      });

    } catch (err) {
      console.error('Login error:', err.message);
      return res.status(500).json({ message: err.message });
    }
  }
);


// Current user profile (protected)
router.get('/me', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, username, email, avatar_url, date_of_birth, role, status FROM users WHERE id = ?', [req.user.id]);
    if (!rows.length) return res.status(404).json({ message: 'User not found' });
    res.json({ user: rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Google OAuth Login
router.post('/google', async (req, res) => {
  const { credential } = req.body; // Google ID Token

  if (!credential) {
    return res.status(400).json({ message: 'Google credential không được để trống' });
  }

  try {
    // Import google-auth-library
    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: google_id, email, name, picture } = payload;

    // Check if user already exists
    const [existingUsers] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    let userId;
    let isNewUser = false;

    if (existingUsers.length > 0) {
      // User exists - login
      userId = existingUsers[0].id;
      
      // Update avatar if changed
      if (picture && existingUsers[0].avatar_url !== picture) {
        await pool.query(
          'UPDATE users SET avatar_url = ? WHERE id = ?',
          [picture, userId]
        );
      }
    } else {
      // Create new user with Google account
      const [result] = await pool.query(
        `INSERT INTO users (email, username, avatar_url, password_hash, status, role) 
         VALUES (?, ?, ?, NULL, 'active', 'user')`,
        [email, name, picture]
      );
      userId = result.insertId;
      isNewUser = true;
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: userId, 
        email, 
        role: existingUsers[0]?.role || 'user' 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    return res.status(isNewUser ? 201 : 200).json({
      message: isNewUser ? 'Đăng ký Google thành công' : 'Đăng nhập Google thành công',
      token,
      user: {
        id: userId,
        email,
        username: name,
        avatar_url: picture,
        role: existingUsers[0]?.role || 'user',
        auth_type: 'google'
      }
    });

  } catch (err) {
    console.error('Google auth error:', err);
    
    if (err.message.includes('Token used too late')) {
      return res.status(400).json({ message: 'Google token đã hết hạn, vui lòng thử lại' });
    }
    
    return res.status(500).json({ 
      message: 'Lỗi xác thực Google', 
      error: err.message 
    });
  }
});

module.exports = router;
