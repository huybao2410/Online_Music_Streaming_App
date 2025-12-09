const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken } = require('../middlewares/auth');

// Hàm xử lý URL: Fix lỗi double URL và lỗi IP 10.0.2.2 của Android Emulator
const processUrl = (url) => {
  if (!url) return null;
  
  // Nếu URL đã là tuyệt đối (có http)
  if (url.startsWith('http')) {
    // Thay thế IP của Android Emulator (10.0.2.2) thành localhost để chạy trên Web
    return url.replace('10.0.2.2', 'localhost');
  }
  
  // Nếu là đường dẫn tương đối (ví dụ: /uploads/...), nối thêm domain vào
  return `http://localhost:8081/music_API/online_music/${url.startsWith('/') ? url.slice(1) : url}`;
};

// 1. Lấy danh sách bài hát yêu thích của user
router.get('/', verifyToken, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    const query = `
      SELECT 
        s.song_id,
        fs.added_at,
        s.title,
        s.duration,
        s.audio_url,
        s.cover_url,
        s.release_date,
        sa.artist_id,
        a.name as artist_name,
        s.genre_id,
        g.name as genre_name,
        GROUP_CONCAT(DISTINCT al.name SEPARATOR ', ') as album_names
      FROM favorites_songs fs
      JOIN songs s ON fs.song_id = s.song_id
      LEFT JOIN song_artists sa ON s.song_id = sa.song_id
      LEFT JOIN artists a ON sa.artist_id = a.artist_id
      LEFT JOIN genres g ON s.genre_id = g.genre_id
      LEFT JOIN album_songs als ON s.song_id = als.song_id
      LEFT JOIN albums al ON als.album_id = al.album_id
      WHERE fs.user_id = ?
      GROUP BY s.song_id, fs.added_at, s.title, s.duration, s.audio_url, s.cover_url, s.release_date, sa.artist_id, a.name, s.genre_id, g.name
      ORDER BY fs.added_at DESC
      LIMIT ? OFFSET ?
    `;

    const [favorites] = await pool.query(query, [req.user.id, parseInt(limit), parseInt(offset)]);

    return res.json({
      success: true,
      count: favorites.length,
      favorites: favorites.map(item => ({
        id: item.song_id,
        song_id: item.song_id,
        title: item.title,
        artist: item.artist_name,
        artist_id: item.artist_id,
        genre: item.genre_name,
        genre_id: item.genre_id,
        album: item.album_names || '-',
        duration: item.duration,
        added_at: item.added_at,
        audio: processUrl(item.audio_url),
        cover: processUrl(item.cover_url),
        release_date: item.release_date
      }))
    });
  } catch (error) {
    console.error('Error fetching favorite songs:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tải bài hát yêu thích'
    });
  }
});

// 2. Thêm bài hát vào yêu thích
router.post('/add', verifyToken, async (req, res) => {
  try {
    const { song_id } = req.body;
    
    if (!song_id) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin bài hát' });
    }

    // Kiểm tra bài hát có tồn tại không
    const [songs] = await pool.query('SELECT song_id FROM songs WHERE song_id = ?', [song_id]);
    if (songs.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài hát' });
    }

    // Kiểm tra đã thích chưa
    const [existing] = await pool.query(
      'SELECT song_id FROM favorites_songs WHERE user_id = ? AND song_id = ?',
      [req.user.id, song_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Đã có trong danh sách yêu thích' });
    }

    // Thêm vào DB
    await pool.query(
      'INSERT INTO favorites_songs (user_id, song_id) VALUES (?, ?)',
      [req.user.id, song_id]
    );

    return res.json({ success: true, message: 'Đã thêm vào bài hát yêu thích' });
  } catch (error) {
    console.error('Error adding to favorites:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server khi thêm yêu thích' });
  }
});

// 3. Xóa bài hát khỏi yêu thích
router.delete('/remove/:song_id', verifyToken, async (req, res) => {
  try {
    const { song_id } = req.params;

    const [result] = await pool.query(
      'DELETE FROM favorites_songs WHERE user_id = ? AND song_id = ?',
      [req.user.id, song_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Bài hát không có trong danh sách yêu thích' });
    }

    return res.json({ success: true, message: 'Đã xóa khỏi bài hát yêu thích' });
  } catch (error) {
    console.error('Error removing from favorites:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server khi xóa yêu thích' });
  }
});

// 4. Kiểm tra trạng thái yêu thích của một bài hát
router.get('/check/:song_id', verifyToken, async (req, res) => {
  try {
    const { song_id } = req.params;

    const [favorite] = await pool.query(
      'SELECT song_id FROM favorites_songs WHERE user_id = ? AND song_id = ?',
      [req.user.id, song_id]
    );

    return res.json({ 
      success: true, 
      is_favorite: favorite.length > 0 
    });
  } catch (error) {
    console.error('Error checking favorite status:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

module.exports = router;