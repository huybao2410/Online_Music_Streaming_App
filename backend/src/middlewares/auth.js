// backend/src/middlewares/auth.js
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
require('dotenv').config();

const verifyToken = async (req, res, next) => {
  const authHeader = req.header('Authorization');
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // --- QUAN TRỌNG: KIỂM TRA LẠI TRẠNG THÁI TỪ DB ---
    // Mỗi request đều check DB để đảm bảo user chưa bị ban sau khi login
    const [users] = await pool.query('SELECT id, role, status, email FROM users WHERE id = ?', [decoded.id]);
    
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'Tài khoản không tồn tại' });
    }

    const user = users[0];

    // Nếu bị ban, chặn ngay lập tức
    if (user.status === 'banned') {
      return res.status(403).json({ 
        success: false, 
        message: 'Tài khoản của bạn đã bị khóa. Vui lòng đăng xuất.' 
      });
    }
    
    // Nếu trạng thái inactive (tùy logic của bạn, có thể chặn hoặc cho phép hạn chế)
    if (user.status === 'inactive') {
        // return res.status(403).json({ success: false, message: 'Tài khoản chưa kích hoạt' });
    }

    // Cập nhật thông tin mới nhất vào req.user (phòng trường hợp role bị đổi khi đang login)
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role // Luôn lấy role mới nhất từ DB
    };
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    return res.status(403).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};

module.exports = { verifyToken };