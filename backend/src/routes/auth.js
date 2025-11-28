// backend/src/routes/auth.js
const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { verifyToken } = require('../middlewares/auth');
require('dotenv').config();

const router = express.Router();

// --- ĐĂNG KÝ ---
router.post('/register',
  body('phone_number').optional(),
  body('email').optional().isEmail().withMessage('Email không hợp lệ'),
  body('password').isLength({ min: 6 }).withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
  async (req, res) => {
    const errors = validationResult(req); 
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { phone_number, email, password } = req.body;

    try {
      // Kiểm tra số điện thoại
      if (phone_number) {
        const [existsPhone] = await pool.query('SELECT id FROM users WHERE phone_number = ?', [phone_number]);
        if (existsPhone.length) return res.status(400).json({ message: 'Số điện thoại đã được sử dụng' });
      }

      // Kiểm tra email
      if (email) {
        const [existsEmail] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existsEmail.length) return res.status(400).json({ message: 'Email đã được sử dụng' });
      }

      // Hash password
      const hash = await bcrypt.hash(password, 10);

      // Thêm user
      const [result] = await pool.query(
        `INSERT INTO users (phone_number, email, password_hash, status, role) VALUES (?, ?, ?, 'active', 'user')`,
        [phone_number || null, email || null, hash]
      );

      // Tạo token
      const token = jwt.sign(
        { id: result.insertId, role: 'user' },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      return res.status(201).json({
        message: 'Đăng ký thành công',
        token,
        user: { 
          id: result.insertId, 
          phone_number, 
          email,
          role: 'user' 
        }
      });

    } catch (err) {
      console.error('Register error: ', err.message);
      return res.status(500).json({ message: 'Lỗi server khi đăng ký' });
    }
  }
);

// --- ĐĂNG NHẬP THƯỜNG ---
router.post('/login',
  body('identifier').notEmpty().withMessage('Email hoặc số điện thoại không được để trống'),
  body('password').notEmpty().withMessage('Mật khẩu không được để trống'),
  async (req, res) => {
    const errors = validationResult(req); 
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { identifier, password } = req.body;

    try {
      const isEmail = identifier.includes('@');
      let query = isEmail ? 'SELECT * FROM users WHERE email = ?' : 'SELECT * FROM users WHERE phone_number = ?';
      
      const [rows] = await pool.query(query, [identifier]);
      if (!rows.length) {
        return res.status(400).json({ message: 'Tài khoản không tồn tại' });
      }

      const user = rows[0];
      
      // --- CHECK TRẠNG THÁI BANNED ---
      if (user.status === 'banned') {
        return res.status(403).json({ 
          message: 'Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.' 
        });
      }
      if (user.status === 'inactive') {
        return res.status(403).json({ message: 'Tài khoản chưa được kích hoạt.' });
      }
      // -------------------------------

      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) return res.status(400).json({ message: 'Mật khẩu không đúng' });

      const token = jwt.sign(
        { id: user.id, role: user.role, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      return res.json({
        token,
        user: { 
          id: user.id, 
          username: user.username,
          email: user.email,
          role: user.role, 
          avatar_url: user.avatar_url 
        }
      });

    } catch (err) {
      console.error('Login error:', err.message);
      return res.status(500).json({ message: 'Lỗi server khi đăng nhập' });
    }
  }
);

// --- LẤY THÔNG TIN USER (ME) ---
router.get('/me', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, username, email, phone_number, avatar_url, role, status FROM users WHERE id = ?', 
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'User not found' });
    
    const user = rows[0];
    
    // Fix avatar url nếu cần
    if (user.avatar_url && !user.avatar_url.startsWith('http') && !user.avatar_url.startsWith('/')) {
        // user.avatar_url = ... logic fix path của bạn
    }
    
    res.json({ user });
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// --- ĐĂNG NHẬP GOOGLE ---
router.post('/google', async (req, res) => {
  const { credential, email, name, avatar, google_id } = req.body;

  // Hỗ trợ cả 2 cách gửi: credential (JWT từ Google Button cũ) hoặc thông tin trực tiếp (từ Custom Button mới)
  let userEmail = email;
  let userName = name;
  let userAvatar = avatar;

  try {
    // Nếu gửi credential (cách cũ hoặc dùng thư viện Google One Tap), cần verify
    if (credential) {
        const { OAuth2Client } = require('google-auth-library');
        const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        userEmail = payload.email;
        userName = payload.name;
        userAvatar = payload.picture;
    }

    if (!userEmail) {
        return res.status(400).json({ message: 'Không lấy được email từ Google' });
    }

    // Check user tồn tại
    const [existingUsers] = await pool.query('SELECT * FROM users WHERE email = ?', [userEmail]);

    let userId;
    let userRole = 'user';
    let isNewUser = false;

    if (existingUsers.length > 0) {
      const existingUser = existingUsers[0];
      
      // --- CHECK TRẠNG THÁI BANNED ---
      if (existingUser.status === 'banned') {
        return res.status(403).json({ 
          message: 'Tài khoản Google này đã bị cấm truy cập hệ thống.' 
        });
      }
      // -------------------------------

      userId = existingUser.id;
      userRole = existingUser.role;
      
      // Cập nhật avatar nếu thay đổi
      if (userAvatar && existingUser.avatar_url !== userAvatar) {
        await pool.query('UPDATE users SET avatar_url = ? WHERE id = ?', [userAvatar, userId]);
      }
    } else {
      // Tạo user mới
      const googlePlaceholder = '$2a$10$GOOGLE_OAUTH_USER_NO_PASSWORD_HASH_PLACEHOLDER';
      const [result] = await pool.query(
        `INSERT INTO users (email, username, avatar_url, password_hash, status, role) 
         VALUES (?, ?, ?, ?, 'active', 'user')`,
        [userEmail, userName, userAvatar, googlePlaceholder]
      );
      userId = result.insertId;
      isNewUser = true;
    }

    const token = jwt.sign(
      { id: userId, email: userEmail, role: userRole },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    return res.status(isNewUser ? 201 : 200).json({
      message: isNewUser ? 'Đăng ký Google thành công' : 'Đăng nhập Google thành công',
      token,
      user: {
        id: userId,
        email: userEmail,
        username: userName,
        avatar_url: userAvatar,
        role: userRole,
        auth_type: 'google'
      }
    });

  } catch (err) {
    console.error('Google auth error:', err);
    return res.status(500).json({ message: 'Lỗi xác thực Google', error: err.message });
  }
});

module.exports = router;