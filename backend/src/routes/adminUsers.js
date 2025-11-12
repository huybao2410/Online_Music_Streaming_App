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

// Get all users with pagination and search
router.get('/users', verifyToken, isAdmin, async (req, res) => {
  try {
    console.log('Admin users route hit, user:', req.user);
    const { search, limit = 50, offset = 0 } = req.query;
    
    // Simple query without subqueries for now
    let query = `
      SELECT id, username, email, phone_number, avatar_url, 
             role, status, is_premium, premium_expire,
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
    
    // Add counts manually
    for (let user of users) {
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
              role, status, is_premium, premium_expire,
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
    
    if (!['active', 'inactive', 'banned'].includes(status)) {
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
