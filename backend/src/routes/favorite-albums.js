const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken } = require('../middlewares/auth');

// Chuẩn hóa đường dẫn cover
function normalizeCoverUrl(url) {
  if (!url) return '';
  let result = url.replace('10.0.2.2', 'localhost');
  if (result.startsWith('http://localhost/http')) {
    result = result.replace('http://localhost/', '');
  }
  return result;
}

// 1. Lấy danh sách album yêu thích
router.get('/', verifyToken, async (req, res) => {
  const user_id = req.user.id;
  try {
    // FIX QUAN TRỌNG: Sửa a.id thành a.album_id
    const [rows] = await pool.query(
      'SELECT a.*, fa.id as favorite_id FROM favorite_albums fa JOIN albums a ON fa.album_id = a.album_id WHERE fa.user_id = ?',
      [user_id]
    );
    
    const albums = rows.map(album => ({
      ...album,
      cover: normalizeCoverUrl(album.cover_url || album.cover) // Xử lý cả 2 trường hợp tên cột
    }));
    
    res.json({ success: true, favorites: albums });
  } catch (err) {
    console.error("Lỗi lấy album yêu thích:", err); // Log lỗi để dễ debug
    res.status(500).json({ success: false, message: 'Lỗi lấy album yêu thích' });
  }
});

// 2. Thêm album yêu thích
router.post('/add', verifyToken, async (req, res) => {
  const user_id = req.user.id;
  const { album_id } = req.body;
  
  if (!album_id) return res.status(400).json({ success: false, message: 'Thiếu album_id' });
  
  try {
    // Dùng INSERT IGNORE để tránh lỗi nếu đã tồn tại
    await pool.query('INSERT IGNORE INTO favorite_albums (user_id, album_id) VALUES (?, ?)', [user_id, album_id]);
    res.json({ success: true, message: 'Đã thêm vào thư viện' });
  } catch (err) {
    console.error("Lỗi thêm album:", err);
    res.status(500).json({ success: false, message: 'Lỗi thêm album yêu thích' });
  }
});

// 3. Xóa album yêu thích
router.delete('/remove/:album_id', verifyToken, async (req, res) => {
  const user_id = req.user.id;
  const { album_id } = req.params;
  
  try {
    await pool.query('DELETE FROM favorite_albums WHERE user_id = ? AND album_id = ?', [user_id, album_id]);
    res.json({ success: true, message: 'Đã xóa khỏi thư viện' });
  } catch (err) {
    console.error("Lỗi xóa album:", err);
    res.status(500).json({ success: false, message: 'Lỗi xóa album yêu thích' });
  }
});

module.exports = router;