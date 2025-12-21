const db = require("../config/db");
const path = require("path");
const fs = require("fs");
const mm = require("music-metadata");

const BASE_URL = "http://10.0.2.2:8081/music_API/online_music";
const XAMPP_ROOT = "C:/xampp/htdocs";

// ================== GET ALL SONGS ==================
exports.getAllSongs = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        s.song_id,
        s.title,
        s.cover_url,
        s.audio_url,
        s.duration,
        g.name AS genre,
        p.name AS provider_name,
        GROUP_CONCAT(sa.artist_id) AS artist_ids
      FROM songs s
      LEFT JOIN genres g ON s.genre_id = g.genre_id
      LEFT JOIN music_providers p ON s.provider_id = p.provider_id
      LEFT JOIN song_artists sa ON s.song_id = sa.song_id
      GROUP BY s.song_id
      ORDER BY s.song_id DESC
    `);

    const songs = rows.map(row => ({
      ...row,
      artist_ids: row.artist_ids
        ? row.artist_ids.split(",").map(Number)
        : []
    }));

    res.json({ success: true, songs });
  } catch (err) {
    console.error("getAllSongs error:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// ================== CREATE SONG ==================
exports.createSong = async (req, res) => {
  try {
    let { title, genre_id, provider_id, artists } = req.body;

    if (!title || !artists) {
      return res.status(400).json({
        message: "Vui lòng nhập đầy đủ thông tin bắt buộc (title, artists)"
      });
    }

    artists = JSON.parse(artists).filter(id => Number(id));

    if (!artists.length) {
      return res.status(400).json({
        message: "Phải chọn ít nhất 1 nghệ sĩ hợp lệ"
      });
    }

    let coverUrl = null;
    let audioUrl = null;
    let duration = null;

    if (req.files?.cover?.[0]) {
      coverUrl = `${BASE_URL}/cover/${req.files.cover[0].filename}`;
    }

    if (req.files?.audio?.[0]) {
      const audioFile = req.files.audio[0];
      audioUrl = `${BASE_URL}/audio/${audioFile.filename}`;

      try {
        const metadata = await mm.parseFile(audioFile.path);
        duration = Math.floor(metadata.format.duration || 0);
      } catch {}
    }

    const [result] = await db.query(
      `INSERT INTO songs
       (title, genre_id, provider_id, cover_url, audio_url, duration)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title, genre_id || null, provider_id || null, coverUrl, audioUrl, duration]
    );

    for (const artistId of artists) {
      await db.query(
        `INSERT INTO song_artists (song_id, artist_id)
         VALUES (?, ?)`,
        [result.insertId, artistId]
      );
    }

    res.json({ success: true, message: "Thêm bài hát thành công" });
  } catch (err) {
    console.error("createSong error:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

const removeFile = (url) => {
  if (!url) return;
  const relative = url.replace("http://10.0.2.2:8081/", "");
  const fullPath = path.join("C:/xampp/htdocs", relative);
  if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
};

exports.updateSong = async (req, res) => {
  try {
    const { id } = req.params;
    let { title, genre_id, provider_id, artists } = req.body;

    if (!title || !artists) {
      return res.status(400).json({
        message: "Thiếu dữ liệu bắt buộc"
      });
    }

    artists = JSON.parse(artists).filter(a => Number(a));
    if (!artists.length) {
      return res.status(400).json({
        message: "Phải chọn ít nhất 1 nghệ sĩ"
      });
    }

    // lấy dữ liệu cũ
    const [[oldSong]] = await db.query(
      "SELECT cover_url, audio_url FROM songs WHERE song_id = ?",
      [id]
    );

    if (!oldSong) {
      return res.status(404).json({ message: "Không tìm thấy bài hát" });
    }

    let coverUrl = oldSong.cover_url;
    let audioUrl = oldSong.audio_url;
    let duration = null;

    // ===== HANDLE COVER =====
    if (req.files?.cover?.[0]) {
      // xóa cover cũ
      removeFile(oldSong.cover_url);
      coverUrl = `${BASE_URL}/cover/${req.files.cover[0].filename}`;
    }

    // ===== HANDLE AUDIO =====
    if (req.files?.audio?.[0]) {
      removeFile(oldSong.audio_url);
      const audioFile = req.files.audio[0];
      audioUrl = `${BASE_URL}/audio/${audioFile.filename}`;

      try {
        const meta = await mm.parseFile(audioFile.path);
        duration = Math.floor(meta.format.duration || 0);
      } catch {}
    }

    // ===== UPDATE SONG =====
    await db.query(
      `UPDATE songs
       SET title = ?, genre_id = ?, provider_id = ?, cover_url = ?, audio_url = ?, duration = COALESCE(?, duration)
       WHERE song_id = ?`,
      [
        title,
        genre_id || null,
        provider_id || null,
        coverUrl,
        audioUrl,
        duration,
        id
      ]
    );

    // ===== UPDATE ARTISTS =====
    await db.query("DELETE FROM song_artists WHERE song_id = ?", [id]);
    for (const artistId of artists) {
      await db.query(
        "INSERT INTO song_artists (song_id, artist_id) VALUES (?, ?)",
        [id, artistId]
      );
    }

    res.json({ success: true, message: "Cập nhật bài hát thành công" });
  } catch (err) {
    console.error("updateSong error:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};


// ================== DELETE SONG ==================
exports.deleteSong = async (req, res) => {
  try {
    const { id } = req.params;

    const [[song]] = await db.query(
      "SELECT cover_url, audio_url FROM songs WHERE song_id = ?",
      [id]
    );

    const removeFile = (url) => {
      if (!url) return;
      const relative = url.replace("http://10.0.2.2:8081/", "");
      const fullPath = path.join(XAMPP_ROOT, relative);
      fs.existsSync(fullPath) && fs.unlinkSync(fullPath);
    };

    removeFile(song.cover_url);
    removeFile(song.audio_url);

    await db.query("DELETE FROM song_artists WHERE song_id = ?", [id]);
    await db.query("DELETE FROM songs WHERE song_id = ?", [id]);

    res.json({ success: true });
  } catch (err) {
    console.error("deleteSong error:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};
