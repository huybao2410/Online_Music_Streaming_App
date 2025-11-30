const jwt = require('jsonwebtoken');
const pool = require('../config/db');
require('dotenv').config();

const verifyToken = async (req, res, next) => {
  const authHeader = req.header('Authorization');
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [users] = await pool.query(
      'SELECT id, role, status, email FROM users WHERE id = ?',
      [decoded.id]
    );

    if (!users.length) {
      return res.status(404).json({ success: false, message: 'Tài khoản không tồn tại' });
    }

    const user = users[0];

    if (user.status === 'banned') {
      return res.status(403).json({ success: false, message: 'Tài khoản bị khóa' });
    }

    req.user = { id: user.id, email: user.email, role: user.role };

    next();
  } catch (err) {
    console.error('verifyToken error:', err);
    return res.status(403).json({ success: false, message: 'Token không hợp lệ' });
  }
};

const authenticate = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = header.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

module.exports = { authenticate, verifyToken };
