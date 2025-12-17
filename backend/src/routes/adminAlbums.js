const express = require('express');
const router = express.Router();
const adminAlbumsController = require('../controllers/adminAlbumsController');

// Lấy danh sách album
router.get('/', adminAlbumsController.getAlbums);

// Thêm album (KHÔNG upload file)
router.post('/', adminAlbumsController.createAlbum);

// Sửa album (KHÔNG upload file)
router.put('/:id', adminAlbumsController.updateAlbum);

// Xóa album
router.delete('/:id', adminAlbumsController.deleteAlbum);

module.exports = router;
