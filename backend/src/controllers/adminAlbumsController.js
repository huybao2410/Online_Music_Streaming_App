const db = require('../config/db');

// Lấy danh sách album (phân trang)
exports.getAlbums = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    const [albums] = await db.query(
      `SELECT al.*, ar.name AS artist_name,
        (SELECT COUNT(*) FROM album_songs WHERE album_id = al.album_id) AS song_count
       FROM albums al
       LEFT JOIN artists ar ON al.artist_id = ar.artist_id
       ORDER BY al.album_id DESC
       LIMIT ? OFFSET ?`, [limit, offset]
    );
    res.json({ success: true, albums });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Thêm album mới
exports.createAlbum = async (req, res) => {
  try {
    let { name, artist_id, description, release_date, cover_url, song_ids } = req.body;
    // Upload file cover sang API PHP nếu có file
    if (req.file) {
      const FormData = require('form-data');
      const fs = require('fs');
      const axios = require('axios');
      const form = new FormData();
      form.append('cover_file', fs.createReadStream(req.file.path));
      form.append('name', name);
      form.append('artist_id', artist_id);
      form.append('description', description);
      form.append('release_date', release_date);
      form.append('songs', song_ids);
      form.append('save', '1');
      // Gửi sang API PHP
      const phpApiUrl = 'http://localhost:8081/music_API/online_music/album/manage_albums.php';
      let phpRes;
      try {
        phpRes = await axios.post(phpApiUrl, form, { headers: form.getHeaders() });
      } catch (err) {
        return res.status(500).json({ success: false, message: 'Upload cover to PHP API failed', error: err.message });
      }
      // Lấy cover_url từ DB sau khi PHP xử lý
      // (Hoặc parse từ phpRes nếu API trả về)
      // Ở đây chỉ upload ảnh, vẫn cần insert album vào DB Node.js
      cover_url = null;
      if (phpRes && phpRes.request && phpRes.request.res && phpRes.request.res.responseUrl) {
        // Nếu PHP trả về redirect, lấy cover_url từ DB
        // (Hoặc cần sửa PHP trả về cover_url)
      }
      // Đường dẫn file đã upload sẽ là dạng http://10.0.2.2:8081/music_API/online_music/album/album_cover/xxx.jpg
      // Nếu cần, lấy lại cover_url từ DB bằng SELECT mới nhất
      // Nếu không có file, dùng cover_url truyền lên
    }
    const [result] = await db.query(
      `INSERT INTO albums (name, artist_id, description, cover_url, release_date)
       VALUES (?, ?, ?, ?, ?)`, [name, artist_id, description, cover_url, release_date]
    );
    const albumId = result.insertId;
    if (song_ids && song_ids.length) {
      for (let i = 0; i < song_ids.length; i++) {
        await db.query(
          `INSERT INTO album_songs (album_id, song_id, track_number) VALUES (?, ?, ?)`,
          [albumId, song_ids[i], i + 1]
        );
      }
    }
    res.json({ success: true, album_id: albumId, cover_url });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Sửa album
exports.updateAlbum = async (req, res) => {
  try {
    const albumId = req.params.id;
    let { name, artist_id, description, release_date, cover_url, song_ids } = req.body;
    // Nếu có file upload, lấy đường dẫn file
    if (req.file) {
      const fileName = req.file.filename;
      cover_url = `http://10.0.2.2:8081/music_API/online_music/album/album_cover/${fileName}`;
    }
    await db.query(
      `UPDATE albums SET name=?, artist_id=?, description=?, cover_url=?, release_date=? WHERE album_id=?`,
      [name, artist_id, description, cover_url, release_date, albumId]
    );
    await db.query(`DELETE FROM album_songs WHERE album_id=?`, [albumId]);
    if (song_ids && song_ids.length) {
      for (let i = 0; i < song_ids.length; i++) {
        await db.query(
          `INSERT INTO album_songs (album_id, song_id, track_number) VALUES (?, ?, ?)`,
          [albumId, song_ids[i], i + 1]
        );
      }
    }
    res.json({ success: true, cover_url });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Xóa album
exports.deleteAlbum = async (req, res) => {
  try {
    const albumId = req.params.id;
    await db.query(`DELETE FROM albums WHERE album_id=?`, [albumId]);
    await db.query(`DELETE FROM album_songs WHERE album_id=?`, [albumId]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
