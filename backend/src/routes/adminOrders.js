const express = require('express');
const router = express.Router();
const pool = require('../config/db'); // Đảm bảo đã có file db.js kết nối MySQL

// Lấy danh sách hóa đơn/subscription
router.get('/orders', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        us.id AS order_id,
        u.username AS user_name,
        u.email,
        sp.name AS plan_name,
        sp.price AS amount,
        us.start_date AS transaction_date,
        us.status,
        us.payment_status,
        us.payment_gateway
      FROM user_subscriptions us
      LEFT JOIN users u ON us.user_id = u.id
      LEFT JOIN subscription_plans sp ON us.subscription_plan_id = sp.id
      ORDER BY us.start_date DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
