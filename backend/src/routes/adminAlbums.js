const express = require('express');
const router = express.Router();
const adminAlbumsController = require('../controllers/adminAlbumsController');
const uploadAlbumCover = require('../middlewares/uploadAlbumCover');

// Lấy danh sách album (phân trang)
router.get('/', adminAlbumsController.getAlbums);
// Thêm album mới (hỗ trợ upload cover)
router.post('/', uploadAlbumCover.single('cover_file'), adminAlbumsController.createAlbum);
// Sửa album (hỗ trợ upload cover)
router.put('/:id', uploadAlbumCover.single('cover_file'), adminAlbumsController.updateAlbum);
// Xóa album
router.delete('/:id', adminAlbumsController.deleteAlbum);

module.exports = router;
