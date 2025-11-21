// backend/src/routes/songs.js
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken } = require('../middlewares/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for song cover upload
const coverStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads/song-covers');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'cover-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Configure multer for audio file upload
const audioStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads/songs');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'song-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadCover = multer({
  storage: coverStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Chỉ chấp nhận file ảnh (jpeg, jpg, png, gif, webp)'));
  }
});

const uploadAudio = multer({
  storage: audioStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /mp3|wav|m4a|flac/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || file.mimetype === 'audio/mpeg';
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Chỉ chấp nhận file audio (mp3, wav, m4a, flac)'));
  }
});

// Middleware to check admin role
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false,
      message: 'Không có quyền truy cập' 
    });
  }
  next();
};

// GET all songs (public)
router.get('/', async (req, res) => {
  try {
    console.log('GET /api/songs - Request received');
    const { search, artist_id, limit = 50, offset = 0 } = req.query;
    
    let query = `
      SELECT s.*, a.name as artist_name, a.avatar_url as artist_avatar
      FROM songs s
      LEFT JOIN artists a ON s.artist_id = a.artist_id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ' AND (s.title LIKE ? OR a.name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (artist_id) {
      query += ' AND s.artist_id = ?';
      params.push(artist_id);
    }

    query += ' ORDER BY s.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    console.log('Executing query:', query);
    console.log('With params:', params);

    const [songs] = await pool.query(query, params);
    console.log('Found songs:', songs.length);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM songs s LEFT JOIN artists a ON s.artist_id = a.artist_id WHERE 1=1';
    const countParams = [];
    
    if (search) {
      countQuery += ' AND (s.title LIKE ? OR a.name LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }
    
    if (artist_id) {
      countQuery += ' AND s.artist_id = ?';
      countParams.push(artist_id);
    }

    const [countResult] = await pool.query(countQuery, countParams);

    return res.json({
      success: true,
      songs,
      total: countResult[0].total
    });
  } catch (error) {
    console.error('Error fetching songs:', error);
    console.error('Error details:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tải danh sách bài hát',
      error: error.message
    });
  }
});

// Upsert (import) song from external source (e.g., PHP API) so it can be referenced by playlist
// This lets the frontend send minimal metadata + a stable external key and receive a numeric id.
router.post('/import', async (req, res) => {
  try {
    const { external_url, title, artist_name, cover_url } = req.body;
    if (!external_url || !title) {
      return res.status(400).json({ success: false, message: 'external_url và title là bắt buộc' });
    }

    // Try to find existing by audio_url (assuming external_url is the playback URL)
    const [existing] = await pool.query('SELECT song_id as id FROM songs WHERE audio_url = ? LIMIT 1', [external_url]);
    if (existing.length) {
      return res.json({ success: true, song: existing[0], imported: false });
    }

    // Optionally resolve / create artist if provided
    let artistId = null;
    if (artist_name) {
      const [artistRows] = await pool.query('SELECT artist_id as id FROM artists WHERE name = ? LIMIT 1', [artist_name]);
      if (artistRows.length) {
        artistId = artistRows[0].id;
      } else {
        const [insertArtist] = await pool.query('INSERT INTO artists (name) VALUES (?)', [artist_name]);
        artistId = insertArtist.insertId;
      }
    }

    // Get default genre_id (first genre or create "Khác")
    let genreId = 1; // Default
    const [genres] = await pool.query('SELECT genre_id FROM genres LIMIT 1');
    if (genres.length) {
      genreId = genres[0].genre_id;
    }

    const [insertSong] = await pool.query(
      `INSERT INTO songs (title, artist_id, audio_url, cover_url, duration, genre_id)
       VALUES (?, ?, ?, ?, 0, ?)`,
      [title, artistId, external_url, cover_url || null, genreId]
    );

    return res.status(201).json({
      success: true,
      song: { id: insertSong.insertId, song_id: insertSong.insertId },
      imported: true
    });
  } catch (error) {
    console.error('Error importing song:', error);
    return res.status(500).json({ success: false, message: 'Lỗi khi import bài hát' });
  }
});

// GET song by ID
router.get('/:id', async (req, res) => {
  try {
    const [songs] = await pool.query(
      `SELECT s.*, a.name as artist_name, a.avatar_url as artist_avatar,
        (SELECT COUNT(*) FROM playlist_songs WHERE song_id = s.id) as playlist_count
      FROM songs s
      LEFT JOIN artists a ON s.artist_id = a.artist_id
      WHERE s.id = ?`,
      [req.params.id]
    );

    if (!songs.length) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài hát'
      });
    }

    return res.json({
      success: true,
      song: songs[0]
    });
  } catch (error) {
    console.error('Error fetching song:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tải thông tin bài hát'
    });
  }
});

// POST create song (admin only)
router.post('/',
  verifyToken,
  isAdmin,
  (req, res, next) => {
    const upload = multer({
      storage: multer.memoryStorage()
    }).fields([
      { name: 'cover', maxCount: 1 },
      { name: 'audio', maxCount: 1 }
    ]);
    
    upload(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      const { title, artist_id, album, duration, genre } = req.body;

      if (!title || !artist_id) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng nhập đầy đủ thông tin bắt buộc (title, artist_id)'
        });
      }

      // Check if artist exists
      const [artists] = await pool.query('SELECT id FROM artists WHERE id = ?', [artist_id]);
      if (!artists.length) {
        return res.status(404).json({
          success: false,
          message: 'Nghệ sĩ không tồn tại'
        });
      }

      let coverUrl = null;
      let audioUrl = null;

      // Handle cover upload
      if (req.files && req.files.cover) {
        const coverFile = req.files.cover[0];
        const uploadDir = path.join(__dirname, '../../uploads/song-covers');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        const filename = 'cover-' + Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(coverFile.originalname);
        const filepath = path.join(uploadDir, filename);
        fs.writeFileSync(filepath, coverFile.buffer);
        coverUrl = '/uploads/song-covers/' + filename;
      }

      // Handle audio upload
      if (req.files && req.files.audio) {
        const audioFile = req.files.audio[0];
        const uploadDir = path.join(__dirname, '../../uploads/songs');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        const filename = 'song-' + Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(audioFile.originalname);
        const filepath = path.join(uploadDir, filename);
        fs.writeFileSync(filepath, audioFile.buffer);
        audioUrl = '/uploads/songs/' + filename;
      }

      const [result] = await pool.query(
        `INSERT INTO songs (title, artist_id, album, duration, genre, cover_url, audio_url)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [title, artist_id, album || null, duration || 0, genre || null, coverUrl, audioUrl]
      );

      return res.status(201).json({
        success: true,
        message: 'Tạo bài hát thành công',
        song: {
          id: result.insertId,
          title,
          artist_id,
          album,
          duration,
          genre,
          cover_url: coverUrl,
          audio_url: audioUrl
        }
      });
    } catch (error) {
      console.error('Error creating song:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi tạo bài hát'
      });
    }
  }
);

// PUT update song (admin only)
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { title, artist_id, album, duration, genre } = req.body;

    // Check if song exists
    const [songs] = await pool.query('SELECT * FROM songs WHERE id = ?', [req.params.id]);
    if (!songs.length) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài hát'
      });
    }

    // Check if artist exists
    if (artist_id) {
      const [artists] = await pool.query('SELECT id FROM artists WHERE id = ?', [artist_id]);
      if (!artists.length) {
        return res.status(404).json({
          success: false,
          message: 'Nghệ sĩ không tồn tại'
        });
      }
    }

    await pool.query(
      `UPDATE songs 
       SET title = COALESCE(?, title),
           artist_id = COALESCE(?, artist_id),
           album = COALESCE(?, album),
           duration = COALESCE(?, duration),
           genre = COALESCE(?, genre)
       WHERE id = ?`,
      [title, artist_id, album, duration, genre, req.params.id]
    );

    return res.json({
      success: true,
      message: 'Cập nhật bài hát thành công'
    });
  } catch (error) {
    console.error('Error updating song:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật bài hát'
    });
  }
});

// DELETE song (admin only)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    // Check if song exists
    const [songs] = await pool.query('SELECT * FROM songs WHERE id = ?', [req.params.id]);
    if (!songs.length) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài hát'
      });
    }

    const song = songs[0];

    // Delete cover file if exists
    if (song.cover_url) {
      const coverPath = path.join(__dirname, '../..', song.cover_url);
      if (fs.existsSync(coverPath)) {
        fs.unlinkSync(coverPath);
      }
    }

    // Delete audio file if exists
    if (song.audio_url) {
      const audioPath = path.join(__dirname, '../..', song.audio_url);
      if (fs.existsSync(audioPath)) {
        fs.unlinkSync(audioPath);
      }
    }

    // Delete from database
    await pool.query('DELETE FROM songs WHERE id = ?', [req.params.id]);

    return res.json({
      success: true,
      message: 'Xóa bài hát thành công'
    });
  } catch (error) {
    console.error('Error deleting song:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa bài hát'
    });
  }
});

module.exports = router;
