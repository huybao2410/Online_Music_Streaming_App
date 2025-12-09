// backend/src/routes/artists.js
const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/db');
const { verifyToken } = require('../middlewares/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// =====================================
// CONFIG
// =====================================
const BASE_URL = "http://10.0.2.2:8081/music_API/online_music";
const AVATAR_DIR = path.join("C:", "xampp", "htdocs", "music_API", "online_music", "artist", "artist_avatar");

// Ensure directory exists
if (!fs.existsSync(AVATAR_DIR)) {
  fs.mkdirSync(AVATAR_DIR, { recursive: true });
}

// =====================================
// MULTER UPLOAD
// =====================================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, AVATAR_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "artist-" + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    const allowed = /jpeg|jpg|png|gif/;
    const extValid = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeValid = allowed.test(file.mimetype);
    if (extValid && mimeValid) cb(null, true);
    else cb(new Error("Only image files allowed."));
  }
});

// =====================================
// ADMIN CHECK
// =====================================
const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Không có quyền truy cập" });
  }
  next();
};

// =====================================
// GET ALL ARTISTS (ADMIN)
// =====================================
router.get('/admin/all', async (req, res) => {
  try {
    const query = `
      SELECT a.artist_id, a.name, a.bio, a.avatar_url,
      COUNT(DISTINCT s.song_id) AS song_count
      FROM artists a
      LEFT JOIN song_artists sa ON sa.artist_id = a.artist_id
      LEFT JOIN songs s ON sa.song_id = s.song_id
      WHERE a.bio <> '' AND a.avatar_url <> ''
      GROUP BY a.artist_id
      ORDER BY a.name ASC
    `;

    const [artists] = await pool.query(query);

    return res.json({
      status: true,
      success: true,
      count: artists.length,
      artists
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// =====================================
// CREATE ARTIST
// =====================================
router.post(
  '/',
  verifyToken,
  isAdmin,
  upload.single('avatar'),
  body('name').notEmpty().withMessage("Tên nghệ sĩ không được để trống"),
  async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, bio, avatar_url } = req.body;

    try {
      const [exists] = await pool.query("SELECT artist_id FROM artists WHERE name = ?", [name]);
      if (exists.length > 0) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(400).json({ success: false, message: "Nghệ sĩ đã tồn tại" });
      }

      let finalAvatarUrl = avatar_url || null;

      // Nếu file upload qua multer → backend tự tạo full URL
      if (req.file) {
        finalAvatarUrl = `${BASE_URL}/artist_avatar/${req.file.filename}`;
      }

      await pool.query(
        "INSERT INTO artists (name, bio, avatar_url) VALUES (?, ?, ?)",
        [name, bio || null, finalAvatarUrl]
      );

      return res.status(201).json({ success: true, message: "Thêm nghệ sĩ thành công" });
    } catch (err) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(500).json({ success: false, message: "Lỗi khi thêm nghệ sĩ" });
    }
  }
);

// =====================================
// UPDATE ARTIST
// =====================================
router.put(
  '/:id',
  verifyToken,
  isAdmin,
  upload.single('avatar'),
  async (req, res) => {

    try {
      const [artists] = await pool.query("SELECT * FROM artists WHERE artist_id = ?", [req.params.id]);
      if (!artists.length) return res.status(404).json({ success: false, message: "Không tìm thấy nghệ sĩ" });

      const { name, bio, avatar_url } = req.body;
      const updates = [];
      const values = [];

      if (name !== undefined) { updates.push("name = ?"); values.push(name); }
      if (bio !== undefined) { updates.push("bio = ?"); values.push(bio); }

      // Avatar update
      if (req.file) {
        const finalAvatarUrl = `${BASE_URL}/artist_avatar/${req.file.filename}`;
        updates.push("avatar_url = ?");
        values.push(finalAvatarUrl);

        // Delete old avatar
        const oldPath = path.join(AVATAR_DIR, path.basename(artists[0].avatar_url || ""));
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      } 
      else if (avatar_url) {
        // Nếu React gửi avatar_url → dùng luôn
        updates.push("avatar_url = ?");
        values.push(avatar_url);
      }

      if (updates.length === 0) {
        return res.status(400).json({ success: false, message: "Không có thông tin để cập nhật" });
      }

      values.push(req.params.id);

      await pool.query(`UPDATE artists SET ${updates.join(', ')} WHERE artist_id = ?`, values);

      return res.json({ success: true, message: "Cập nhật nghệ sĩ thành công" });
    } catch (err) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(500).json({ success: false, message: "Lỗi khi cập nhật nghệ sĩ" });
    }
  }
);

// =====================================
// DELETE ARTIST
// =====================================
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const [artists] = await pool.query("SELECT avatar_url FROM artists WHERE artist_id = ?", [req.params.id]);
    if (!artists.length) return res.status(404).json({ success: false, message: "Không tìm thấy nghệ sĩ" });

    // Remove avatar
    if (artists[0].avatar_url) {
      const fileName = path.basename(artists[0].avatar_url);
      const fullPath = path.join(AVATAR_DIR, fileName);
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    }

    await pool.query("DELETE FROM artists WHERE artist_id = ?", [req.params.id]);

    return res.json({ success: true, message: "Xóa nghệ sĩ thành công" });

  } catch (err) {
    return res.status(500).json({ success: false, message: "Lỗi khi xóa nghệ sĩ" });
  }
});

module.exports = router;
