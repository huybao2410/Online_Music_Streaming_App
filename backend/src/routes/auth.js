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
  body('phone_number').isMobilePhone(), // kiểm tra số điện thoại hợp lệ
  body('password').isLength({ min: 6 }), // password tối thiểu 6 ký tự
  async (req, res) => {
    const errors = validationResult(req); 
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { phone_number, password } = req.body;

    try {
      // Kiểm tra số điện thoại đã tồn tại chưa
      const [exists] = await pool.query('SELECT id FROM users WHERE phone_number = ?', [phone_number]);
      if (exists.length) return res.status(400).json({ message: 'Phone number have already used' });

      // Hash password
      const hash = await bcrypt.hash(password, 10);

      // Thêm user mới
      const [result] = await pool.query(
        `INSERT INTO users (phone_number, password_hash, status) VALUES (?, ?, ?)`,
        [phone_number, hash, 'active']
      );

      // Tạo token
      const token = jwt.sign(
        { id: result.insertId, phone_number, role: 'user' },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      return res.status(201).json({
        token,
        user: { id: result.insertId, phone_number, role: 'user' }
      });

    } catch (err) {
      console.error('Register error: ', err.message);
      return res.status(500).json({ message: err.message });
    }
  }
);


// Login bằng phone_number
router.post('/login',
  body('phone_number').isMobilePhone(), // kiểm tra số điện thoại hợp lệ
  body('password').notEmpty(),           // password không rỗng
  async (req, res) => {
    const errors = validationResult(req); 
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { phone_number, password } = req.body;

    try {
      // Tìm user theo số điện thoại
      const [rows] = await pool.query('SELECT * FROM users WHERE phone_number = ?', [phone_number]);
      if (!rows.length) return res.status(400).json({ message: 'User not found' });

      const user = rows[0];
      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) return res.status(400).json({ message: 'Invalid credentials' });
      if (user.status !== 'active') return res.status(403).json({ message: `User ${user.status}` });

      // Tạo token JWT
      const token = jwt.sign(
        { id: user.id, phone_number: user.phone_number, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      return res.json({
        token,
        user: { id: user.id, phone_number: user.phone_number, role: user.role, avatar_url: user.avatar_url }
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
