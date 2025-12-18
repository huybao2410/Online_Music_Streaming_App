// backend/src/routes/adminUsers.js
const express = require('express');
const pool = require('../config/db');
const { verifyToken } = require('../middlewares/auth');
const router = express.Router();

// Middleware to check admin role
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false,
      message: 'Không có quyền truy cập' 
    });
  }
  next();
};

// Thống kê admin: số lượng user premium theo ngày, số lượng user free/premium, tổng thu nhập
// API Thống kê chi tiết (Dashboard v2)
router.get('/statistics', verifyToken, isAdmin, async (req, res) => {
  try {
    // 1. Thống kê tổng quan (KPIs)
    const [[{ total_users }]] = await pool.query("SELECT COUNT(*) as total_users FROM users");
    const [[{ premium_users }]] = await pool.query("SELECT COUNT(DISTINCT user_id) as premium_users FROM user_subscriptions WHERE status = 'active'");
    const free_users = total_users - premium_users;
    
    const [[{ total_revenue }]] = await pool.query("SELECT SUM(amount) as total_revenue FROM transactions WHERE status = 'completed'");

    // 2. Thống kê người dùng đăng ký mới trong 7 ngày qua (để vẽ biểu đồ)
    const [new_users_chart] = await pool.query(`
      SELECT DATE(created_at) as date, COUNT(*) as count 
      FROM users 
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) 
      GROUP BY DATE(created_at) 
      ORDER BY date ASC
    `);

    // 3. Thống kê đăng ký Premium trong 7 ngày qua
    const [new_premium_chart] = await pool.query(`
      SELECT DATE(start_date) as date, COUNT(*) as count 
      FROM user_subscriptions 
      WHERE start_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) 
      GROUP BY DATE(start_date) 
      ORDER BY date ASC
    `);

    // 4. Doanh thu theo ngày (7 ngày qua)
    const [revenue_chart] = await pool.query(`
      SELECT DATE(transaction_date) as date, SUM(amount) as total 
      FROM transactions 
      WHERE status = 'completed' AND transaction_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE(transaction_date) 
      ORDER BY date ASC
    `);

    // 5. Phân bổ doanh thu theo gói (Pie Chart)
    const [revenue_by_plan] = await pool.query(`
      SELECT plan_name, SUM(amount) as total 
      FROM transactions 
      WHERE status = 'completed' 
      GROUP BY plan_name
    `);

    // ⭐ 6. TOP 5 BÀI HÁT NGHE NHIỀU NHẤT
    const [top_songs] = await pool.query(`
      SELECT 
        s.song_id,
        s.title,
        GROUP_CONCAT(a.name SEPARATOR ', ') AS artist,
        s.play_count,
        s.cover_url,
        s.audio_url
      FROM songs s
      LEFT JOIN song_artists sa ON sa.song_id = s.song_id
      LEFT JOIN artists a ON a.artist_id = sa.artist_id
      GROUP BY s.song_id
      ORDER BY s.play_count DESC
      LIMIT 5
    `);

    return res.json({
      success: true,
      kpi: {
        total_users,
        premium_users,
        free_users,
        total_revenue: total_revenue || 0
      },
      charts: {
        new_users: new_users_chart,
        new_premium: new_premium_chart,
        revenue: revenue_chart,
        revenue_by_plan: revenue_by_plan,
        top_songs: top_songs
      }
    });

  } catch (err) {
    console.error('Error in statistics:', err);
    return res.status(500).json({ success: false, message: 'Lỗi thống kê', error: err.message });
  }
});

// Get all users with pagination an`d search
router.get('/users', verifyToken, isAdmin, async (req, res) => {
  try {
    console.log('Admin users route hit, user:', req.user);
    const { search, limit = 50, offset = 0 } = req.query;

    // Simple query without subqueries for now
    let query = `
      SELECT id, username, email, phone_number, avatar_url, 
             role, status,
             password_hash, created_at
      FROM users
    `;
    const params = [];

    if (search) {
      query += ' WHERE username LIKE ? OR email LIKE ?';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    console.log('Executing query:', query);
    console.log('With params:', params);

    const [users] = await pool.query(query, params);

    // Add counts, provider, and premium status manually
    for (let user of users) {
      // Xác định provider
      if (user.password_hash && user.password_hash.includes('GOOGLE_OAUTH_USER_NO_PASSWORD_HASH_PLACEHOLDER')) {
        user.provider = 'google';
      } else {
        user.provider = 'local';
      }
      try {
        // Try to get playlist count
        const [playlists] = await pool.query(
          'SELECT COUNT(*) as count FROM playlists WHERE user_id = ?',
          [user.id]
        );
        user.playlist_count = playlists[0].count;
      } catch (err) {
        user.playlist_count = 0;
      }
      try {
        // Try to get favorites count (might not exist)
        const [favorites] = await pool.query(
          'SELECT COUNT(*) as count FROM favorites WHERE user_id = ?',
          [user.id]
        );
        user.favorite_count = favorites[0].count;
      } catch (err) {
        user.favorite_count = 0;
      }
      try {
        // Kiểm tra trạng thái premium từ bảng user_subscriptions
        const [subs] = await pool.query(
          'SELECT status FROM user_subscriptions WHERE user_id = ? ORDER BY start_date DESC LIMIT 1',
          [user.id]
        );
        user.premium = subs.length > 0 && subs[0].status === 'active';
      } catch (err) {
        user.premium = false;
      }
      // Không xử lý status user nữa
    }

    console.log('Found users:', users.length);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM users';
    if (search) {
      countQuery += ' WHERE username LIKE ? OR email LIKE ?';
    }
    const [countResult] = await pool.query(
      countQuery, 
      search ? [`%${search}%`, `%${search}%`] : []
    );

    return res.json({ 
      success: true,
      users,
      total: countResult[0].total
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Lỗi khi tải danh sách người dùng',
      error: error.message
    });
  }
});

// Get user by ID
router.get('/users/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const [users] = await pool.query(
      `SELECT id, username, email, phone_number, avatar_url,
              role, status,
              password_hash, created_at
       FROM users WHERE id = ?`,
      [req.params.id]
    );

    if (!users.length) {
      return res.status(404).json({ 
        success: false,
        message: 'Không tìm thấy người dùng' 
      });
    }

    const user = users[0];
    // Xác định provider
    if (user.password_hash && user.password_hash.includes('GOOGLE_OAUTH_USER_NO_PASSWORD_HASH_PLACEHOLDER')) {
      user.provider = 'google';
    } else {
      user.provider = 'local';
    }
    // Add counts safely
    try {
      const [playlists] = await pool.query(
        'SELECT COUNT(*) as count FROM playlists WHERE user_id = ?',
        [user.id]
      );
      user.playlist_count = playlists[0].count;
    } catch (err) {
      user.playlist_count = 0;
    }
    try {
      const [favorites] = await pool.query(
        'SELECT COUNT(*) as count FROM favorites WHERE user_id = ?',
        [user.id]
      );
      user.favorite_count = favorites[0].count;
    } catch (err) {
      user.favorite_count = 0;
    }
    try {
      const [history] = await pool.query(
        'SELECT COUNT(*) as count FROM listening_history WHERE user_id = ?',
        [user.id]
      );
      user.listen_count = history[0].count;
    } catch (err) {
      user.listen_count = 0;
    }
    return res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Lỗi khi tải thông tin người dùng' 
    });
  }
});

// Update user role
router.patch('/users/:id/role', verifyToken, isAdmin, async (req, res) => {
  try {
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ 
        success: false,
        message: 'Role không hợp lệ' 
      });
    }

    // Don't allow changing own role
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ 
        success: false,
        message: 'Không thể thay đổi role của chính mình' 
      });
    }

    await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);

    return res.json({ 
      success: true,
      message: 'Cập nhật role thành công' 
    });
  } catch (error) {
    console.error('Error updating role:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Lỗi khi cập nhật role' 
    });
  }
});

// Update user status
router.patch('/users/:id/status', verifyToken, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['active', 'banned'].includes(status)) {
      return res.status(400).json({ 
        success: false,
        message: 'Trạng thái không hợp lệ' 
      });
    }

    // Don't allow changing own status
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ 
        success: false,
        message: 'Không thể thay đổi trạng thái của chính mình' 
      });
    }

    await pool.query('UPDATE users SET status = ? WHERE id = ?', [status, req.params.id]);

    return res.json({ 
      success: true,
      message: 'Cập nhật trạng thái thành công' 
    });
  } catch (error) {
    console.error('Error updating status:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Lỗi khi cập nhật trạng thái' 
    });
  }
});

// Delete user
router.delete('/users/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    // Don't allow deleting yourself
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ 
        success: false,
        message: 'Không thể xóa tài khoản của chính mình' 
      });
    }

    // Check if user exists
    const [users] = await pool.query('SELECT id FROM users WHERE id = ?', [req.params.id]);

    if (!users.length) {
      return res.status(404).json({ 
        success: false,
        message: 'Không tìm thấy người dùng' 
      });
    }

    // Delete user (cascade will handle related records)
    await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);

    return res.json({ 
      success: true,
      message: 'Xóa người dùng thành công' 
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Lỗi khi xóa người dùng' 
    });
  }
});

module.exports = router;