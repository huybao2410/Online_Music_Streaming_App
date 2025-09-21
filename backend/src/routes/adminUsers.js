// backend/src/routes/adminUsers.js
const express = require('express');
const pool = require('../config/db');
const { verifyToken, requireAdmin } = require('../middlewares/auth');
const router = express.Router();

router.use(verifyToken, requireAdmin);

router.get('/users', async (req, res) => {
  const [rows] = await pool.query('SELECT id, username, email, role, status, created_at FROM users ORDER BY id DESC LIMIT ?', [100]);
  res.json({ users: rows });
});

router.patch('/users/:id/role', async (req, res) => {
  const { role } = req.body;
  if (!['user','admin'].includes(role)) return res.status(400).json({ message: 'Invalid role' });
  await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
  res.json({ message: 'Role updated' });
});

router.patch('/users/:id/status', async (req, res) => {
  const { status } = req.body;
  if (!['active','inactive','banned'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
  await pool.query('UPDATE users SET status = ? WHERE id = ?', [status, req.params.id]);
  res.json({ message: 'Status updated' });
});

module.exports = router;
