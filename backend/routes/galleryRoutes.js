const express = require('express');
const { getAllGallery, uploadGalleryImage, deleteGalleryImage } = require('../controllers/galleryController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// Mapped prefix: /api/gallery
router.get('/', getAllGallery);
router.post('/', protect, upload.single('image'), uploadGalleryImage);
router.delete('/:id', protect, deleteGalleryImage);

module.exports = router;
