const express = require('express');
const { getAllEvents, createEvent, updateEvent, deleteEvent, togglePublish } = require('../controllers/eventController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// Mapped prefix: /api/events
router.get('/', getAllEvents);
router.post('/', protect, upload.single('image'), createEvent);
router.put('/:id', protect, upload.single('image'), updateEvent);
router.delete('/:id', protect, deleteEvent);
router.patch('/:id/toggle-publish', protect, togglePublish);

module.exports = router;
