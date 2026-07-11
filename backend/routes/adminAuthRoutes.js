const express = require('express');
const { body } = require('express-validator');
const { login, verifyToken, getDashboardStats, getProfile, updateProfile, logout } = require('../controllers/adminAuthController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Validation rules for admin login
const loginValidationRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email address format'),
  body('password')
    .notEmpty().withMessage('Password is required')
];

// Admin Auth Routes
// Mapped prefix: /api/admin
router.post('/login', loginValidationRules, login);
router.get('/verify-token', protect, verifyToken);
router.get('/dashboard-stats', protect, getDashboardStats);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/logout', logout);

module.exports = router;
