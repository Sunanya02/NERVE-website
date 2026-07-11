const express = require('express');
const { getAllNews, createNews, updateNews, deleteNews } = require('../controllers/newsController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = Router = express.Router();

// Mapped prefix: /api/news
router.get('/', getAllNews);
router.post('/', protect, upload.single('thumbnail'), createNews);
router.put('/:id', protect, upload.single('thumbnail'), updateNews);
router.delete('/:id', protect, deleteNews);

module.exports = router;
