const express = require('express');
const router = express.Router();
const pool = require('../config/db'); // Đảm bảo đã có file db.js kết nối MySQL

// Lấy danh sách hóa đơn/giao dịch (bao gồm cả pending, failed, completed)
router.get('/orders', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        t.id AS order_id,
        u.username AS user_name,
        u.email,
        t.plan_name,
        t.amount,
        t.transaction_date,
        t.status AS payment_status,
        t.payment_method AS payment_gateway
      FROM transactions t
      LEFT JOIN users u ON t.user_id = u.id
      ORDER BY t.transaction_date DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
