// backend/src/routes/auth.js
const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { verifyToken } = require('../middlewares/auth');
require('dotenv').config();

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { phone_number, email, password } = req.body;

    if (!phone_number || !password) {
      return res.status(400).json({ success: false, message: "Thiếu số điện thoại hoặc mật khẩu" });
    }

    const [exists] = await pool.query(
      "SELECT id FROM users WHERE phone_number = ? OR email = ?",
      [phone_number, email]
    );

    if (exists.length > 0) {
      return res.status(400).json({ success: false, message: "Tài khoản đã tồn tại" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      "INSERT INTO users (phone_number, email, password_hash, is_premium) VALUES (?, ?, ?, 0)",
      [phone_number, email || null, hashed]
    );

    const userId = result.insertId;

    // ✅ Kiểm tra JWT_SECRET
    if (!process.env.JWT_SECRET) {
      console.error("🚨 JWT_SECRET chưa được thiết lập trong .env");
      return res.status(500).json({ success: false, message: "Lỗi máy chủ (thiếu JWT_SECRET)" });
    }

    const token = jwt.sign({ id: userId, phone_number, email }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });

    res.json({
      success: true,
      message: "Đăng ký thành công",
      token,
      user: {
        id: userId,
        phone_number,
        email,
      },
    });
  } catch (error) {
    console.error("❌ Lỗi đăng ký:", error);
    res.status(500).json({ success: false, message: "Đăng ký thất bại" });
  }
});

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

module.exports = router;
