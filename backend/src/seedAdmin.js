// backend/src/seedAdmin.js
require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function seedAdmin() {
  const pool = await mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'music_app',
    waitForConnections: true,
    connectionLimit: 5,
  });

  try {
    const email = 'admin1@example.com';
    const username = 'admin1';
    const plainPassword = 'admin123'; // mật khẩu test bạn muốn dùng
    const dob = '1990-01-01';

    // Tạo hash bằng bcrypt (same lib as backend)
    const hash = await bcrypt.hash(plainPassword, 10);

    // Kiểm tra user đã tồn tại chưa
    const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);

    if (rows.length) {
      // Update user hiện tại (set password_hash, role, status)
      await pool.query(
        'UPDATE users SET username = ?, password_hash = ?, role = ?, status = ? WHERE email = ?',
        [username, hash, 'admin', 'active', email]
      );
      console.log(`✅ Updated existing admin (${email}). Password set to '${plainPassword}'`);
    } else {
      // Insert mới
      await pool.query(
        `INSERT INTO users (username, email, password_hash, avatar_url, date_of_birth, role, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [username, email, hash, null, dob, 'admin', 'active']
      );
      console.log(`✅ Inserted admin (${email}) with password '${plainPassword}'`);
    }
  } catch (err) {
    console.error('❌ Seed admin failed:', err);
  } finally {
    await pool.end();
  }
}

seedAdmin();
