const express = require('express');
const { getAllUsers, updateUser, toggleUserStatus, deleteUser } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Mapped prefix: /api/users
router.get('/', protect, getAllUsers);
router.put('/:id', protect, updateUser);
router.patch('/:id/toggle-status', protect, toggleUserStatus);
router.delete('/:id', protect, deleteUser);

module.exports = router;
