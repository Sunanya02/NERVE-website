const express = require('express');
const { getAllApplications, updateApplicationStatus, uploadPitchDeck, deleteApplication } = require('../controllers/applicationController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// Mapped prefix: /api/applications
router.get('/', protect, getAllApplications);
router.patch('/:id/status', protect, updateApplicationStatus);
router.post('/:id/pitch-deck', protect, upload.single('pitch_deck'), uploadPitchDeck);
router.delete('/:id', protect, deleteApplication);

module.exports = router;
