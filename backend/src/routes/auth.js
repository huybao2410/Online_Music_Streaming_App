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
  body('username').isLength({ min: 3 }),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  async (req, res) => {
    const errors = validationResult(req); if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { username, email, password, date_of_birth, avatar_url } = req.body;
    try {
      const [exists] = await pool.query('SELECT id FROM users WHERE email = ? OR username = ?', [email, username]);
      if (exists.length) return res.status(400).json({ message: 'Email or username already used' });

      const hash = await bcrypt.hash(password, 10);
      const [result] = await pool.query(
        `INSERT INTO users (username, email, password_hash, avatar_url, date_of_birth)
         VALUES (?, ?, ?, ?, ?)`,
        [username, email, hash, avatar_url || null, date_of_birth || null]
      );

      const token = jwt.sign({ id: result.insertId, username, role: 'user' }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
      return res.status(201).json({ token, user: { id: result.insertId, username, email, role: 'user' } });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
    }
  }
);

// Login
router.post('/login',
  body('email').isEmail(),
  body('password').notEmpty(),
  async (req, res) => {
    const errors = validationResult(req); if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    try {
      const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
      if (!rows.length) return res.status(400).json({ message: 'User not found' });

      const user = rows[0];
      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) return res.status(400).json({ message: 'Invalid credentials' });
      if (user.status !== 'active') return res.status(403).json({ message: `User ${user.status}` });

      const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
      return res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role, avatar_url: user.avatar_url } });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
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
