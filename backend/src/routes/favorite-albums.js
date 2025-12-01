const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken } = require('../middlewares/auth');

// Hàm chuẩn hóa đường dẫn ảnh (Fix lỗi IP 10.0.2.2 và double URL)
function normalizeCoverUrl(url) {
  if (!url) return '';
  let result = url.replace('10.0.2.2', 'localhost');
  // Xóa prefix nếu bị lặp
  if (result.startsWith('http://localhost:8081/music_API/online_music/http')) {
    result = result.replace('http://localhost:8081/music_API/online_music/', '');
  }
  return result;
}

// 1. Lấy danh sách album yêu thích
router.get('/', verifyToken, async (req, res) => {
  const user_id = req.user.id;
  try {
    // Lấy thông tin album từ bảng favorite_albums và join với albums
    const [rows] = await pool.query(
      `SELECT a.album_id, a.name, a.cover_url, fa.id as favorite_id 
       FROM favorite_albums fa 
       JOIN albums a ON fa.album_id = a.album_id 
       WHERE fa.user_id = ?
       ORDER BY fa.created_at DESC`,
      [user_id]
    );
    
    const albums = rows.map(album => ({
      ...album,
      // Ưu tiên cover_url, nếu không có thì dùng cover (tùy tên cột trong DB của bạn)
      cover_url: normalizeCoverUrl(album.cover_url)
    }));
    
    res.json({ success: true, favorites: albums });
  } catch (err) {
    console.error("Lỗi lấy album yêu thích:", err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// 2. Toggle (Thêm/Xóa) album yêu thích
router.post('/toggle', verifyToken, async (req, res) => {
  const user_id = req.user.id;
  const { album_id } = req.body;
  
  if (!album_id) return res.status(400).json({ success: false, message: 'Thiếu album_id' });

  try {
    // Kiểm tra xem đã thích chưa
    const [existing] = await pool.query(
      'SELECT id FROM favorite_albums WHERE user_id = ? AND album_id = ?',
      [user_id, album_id]
    );

    if (existing.length > 0) {
      // Đã có -> Xóa
      await pool.query(
        'DELETE FROM favorite_albums WHERE user_id = ? AND album_id = ?',
        [user_id, album_id]
      );
      res.json({ success: true, status: 'removed', message: 'Đã xóa khỏi thư viện' });
    } else {
      // Chưa có -> Thêm
      await pool.query(
        'INSERT INTO favorite_albums (user_id, album_id) VALUES (?, ?)',
        [user_id, album_id]
      );
      res.json({ success: true, status: 'added', message: 'Đã thêm vào thư viện' });
    }
  } catch (err) {
    console.error("Lỗi toggle album:", err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

module.exports = router;