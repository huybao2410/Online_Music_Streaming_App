// backend/src/routes/users.js (phần bổ sung)
const express = require('express');
const pool = require('../config/db');
const { verifyToken } = require('../middlewares/auth');
const router = express.Router();

// ...các route khác...

// Kiểm tra trạng thái premium của user (public, không cần token, dùng cho client)
router.get('/:userId/check-premium', async (req, res) => {
  const userId = req.params.userId;
  if (!userId) {
    return res.status(400).json({ success: false, message: 'Thiếu userId' });
  }
  try {
    // Kiểm tra bảng user_subscriptions
    const [subs] = await pool.query(
      'SELECT status FROM user_subscriptions WHERE user_id = ? ORDER BY start_date DESC LIMIT 1',
      [userId]
    );
    const is_premium = subs.length > 0 && subs[0].status === 'active';
    return res.json({ success: true, is_premium });
  } catch (error) {
    console.error('Error checking premium:', error);
    return res.status(500).json({ success: false, message: 'Lỗi khi kiểm tra premium' });
  }
});

module.exports = router;
