const express = require('express');
const router = express.Router();
const adminAlbumsController = require('../controllers/adminAlbumsController');

// Lấy danh sách album (phân trang)
router.get('/', adminAlbumsController.getAlbums);
// Thêm album mới
router.post('/', adminAlbumsController.createAlbum);
// Sửa album
router.put('/:id', adminAlbumsController.updateAlbum);
// Xóa album
router.delete('/:id', adminAlbumsController.deleteAlbum);

module.exports = router;
