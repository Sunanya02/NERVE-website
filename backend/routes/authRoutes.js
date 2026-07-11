const express = require('express');
const { body } = require('express-validator');
const { register, login, verifyToken } = require('../controllers/authController');
const { protectUser } = require('../middleware/authMiddleware');

const router = express.Router();

// Validation rules for registration
const registerValidationRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email address format'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('role')
    .notEmpty().withMessage('Role is required')
    .isIn(['mentor', 'innovator', 'startup_member', 'investor'])
    .withMessage('Role must be one of: mentor, innovator, startup_member, investor')
];

// Validation rules for login
const loginValidationRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email address format'),
  body('password')
    .notEmpty().withMessage('Password is required')
];

// User Auth Routes
// Mapped prefix: /api/auth
router.post('/register', registerValidationRules, register);
router.post('/login', loginValidationRules, login);
router.get('/verify-token', protectUser, verifyToken);

module.exports = router;
