const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Hủy đăng ký gói Premium cho user
router.post('/cancel-subscription', async (req, res) => {
  try {
    const { user_id } = req.body;
    if (!user_id) {
      return res.status(400).json({ status: 'error', message: 'Thiếu user_id' });
    }
    // Tìm subscription active mới nhất
    const [subs] = await pool.query(
      `SELECT id FROM user_subscriptions WHERE user_id = ? AND status = 'active' ORDER BY start_date DESC LIMIT 1`,
      [user_id]
    );
    if (!subs.length) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy gói Premium đang hoạt động.' });
    }
    const subId = subs[0].id;
    // Cập nhật trạng thái thành canceled
    await pool.query(
      `UPDATE user_subscriptions SET status = 'canceled', payment_status = 'failed' WHERE id = ?`,
      [subId]
    );
    return res.json({ status: 'success', message: 'Đã hủy gói Premium thành công.' });
  } catch (err) {
    console.error('Cancel subscription error:', err);
    res.status(500).json({ status: 'error', message: 'Lỗi server.' });
  }
});

module.exports = router;
