// backend/src/seedAdmin.js
require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function seedAdmin() {
  const pool = await mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'dinh1806',
    database: process.env.DB_NAME || 'music_app',
    waitForConnections: true,
    connectionLimit: 5,
  });

  try {
    const email = 'admin1@example.com';
    const username = 'admin1';
    const plainPassword = 'admin123'; // mật khẩu test
    const dob = '1990-01-01';
    const phoneNumber = '0329944649'; // ✅ thêm số điện thoại

    // Tạo hash bcrypt
    const hash = await bcrypt.hash(plainPassword, 10);

    // Kiểm tra user đã tồn tại chưa
    const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);

    if (rows.length) {
      // ✅ Update user hiện tại, thêm cập nhật phone_number
      await pool.query(
        `UPDATE users 
         SET username = ?, password_hash = ?, role = ?, status = ?, phone_number = ?
         WHERE email = ?`,
        [username, hash, 'admin', 'active', phoneNumber, email]
      );
      console.log(`✅ Updated existing admin (${email}). Password: '${plainPassword}', Phone: ${phoneNumber}`);
    } else {
      // ✅ Insert mới có phone_number
      await pool.query(
        `INSERT INTO users (username, email, phone_number, password_hash, avatar_url, date_of_birth, role, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [username, email, phoneNumber, hash, null, dob, 'admin', 'active']
      );
      console.log(`✅ Inserted new admin (${email}) with password '${plainPassword}' and phone '${phoneNumber}'`);
    }
  } catch (err) {
    console.error('❌ Seed admin failed:', err);
  } finally {
    await pool.end();
  }
}

seedAdmin();
