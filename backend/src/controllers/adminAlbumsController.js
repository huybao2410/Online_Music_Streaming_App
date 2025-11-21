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
    const { name, artist_id, description, release_date, cover_url, song_ids } = req.body;
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
    res.json({ success: true, album_id: albumId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Sửa album
exports.updateAlbum = async (req, res) => {
  try {
    const albumId = req.params.id;
    const { name, artist_id, description, release_date, cover_url, song_ids } = req.body;
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
    res.json({ success: true });
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
