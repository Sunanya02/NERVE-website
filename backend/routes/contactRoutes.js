const express = require('express');
const { getAllMessages, updateMessageStatus, deleteMessage } = require('../controllers/contactController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Mapped prefix: /api/contacts
router.get('/', protect, getAllMessages);
router.patch('/:id/status', protect, updateMessageStatus);
router.delete('/:id', protect, deleteMessage);

module.exports = router;
