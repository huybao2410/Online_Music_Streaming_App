const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

// Multer config for temp upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../../uploads/temp'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = 'album_' + Date.now() + ext;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// POST /api/upload-album-cover
router.post('/', upload.single('cover_file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    // Gửi file sang API PHP
    const form = new FormData();
    form.append('cover_file', fs.createReadStream(req.file.path));
    // Gửi sang PHP API mới (chỉ nhận file và trả về cover_url)
    const phpApiUrl = 'http://localhost:8081/music_API/online_music/album/upload_cover.php';
    let phpRes;
    try {
      phpRes = await axios.post(phpApiUrl, form, { headers: form.getHeaders() });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Upload to PHP API failed', error: err.message });
    }
    // Xóa file tạm
    fs.unlinkSync(req.file.path);
    // Trả về cover_url từ PHP
    if (phpRes.data && phpRes.data.url) {
      return res.json({ success: true, cover_url: phpRes.data.url });
    } else {
      return res.status(500).json({ success: false, message: 'PHP API did not return cover_url' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
