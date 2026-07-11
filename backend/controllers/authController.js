const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const { pool } = require('../config/db');
const ApiResponse = require('../utils/apiResponse');

/**
 * @desc    User Registration
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    // Check validation errors from express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return ApiResponse.error(res, 'Validation error', 400, errors.array());
    }

    const { name, email, password, role } = req.body;

    // Check if user already exists
    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
    if (existing.length > 0) {
      return ApiResponse.error(res, 'Email already in use', 400);
    }

    // Hash password with bcryptjs
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into database (is_active is true/1 by default)
    const query = `
      INSERT INTO users (name, email, password, role, is_active, created_at)
      VALUES (?, ?, ?, ?, 1, NOW())
    `;
    const [result] = await pool.execute(query, [name, email, hashedPassword, role]);

    // Log the user registration activity
    try {
      await pool.execute(
        'INSERT INTO recent_activities (activity_type, description) VALUES (?, ?)',
        ['user_registered', `New user "${name}" registered as ${role}`]
      );
    } catch (err) {
      console.warn('Could not log activity in database:', err.message);
    }

    // Return success
    return ApiResponse.success(res, 'User registered successfully', {
      user: {
        id: result.insertId,
        name,
        email,
        role
      }
    }, 201);

  } catch (error) {
    next(error);
  }
};

/**
 * @desc    User Login
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    // Check validation errors from express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return ApiResponse.error(res, 'Validation error', 400, errors.array());
    }

    const { email, password } = req.body;

    // Check if user exists in database
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
    if (rows.length === 0) {
      return ApiResponse.error(res, 'Invalid email or password', 401);
    }

    const user = rows[0];

    // Check if user account is active
    if (!user.is_active) {
      return ApiResponse.error(res, 'Access denied. Your account is deactivated.', 403);
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return ApiResponse.error(res, 'Invalid email or password', 401);
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'super_secret_nerve_admin_jwt_key_12345',
      { expiresIn: process.env.JWT_EXPIRE || '24h' }
    );

    // Set HTTP-only Cookie for user session
    res.cookie('userToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 Hours
    });

    // Return response with user details and token
    return ApiResponse.success(res, 'User logged in successfully', {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify user JWT Token
 * @route   GET /api/auth/verify-token
 * @access  Private (User Only)
 */
const verifyToken = async (req, res, next) => {
  try {
    return ApiResponse.success(res, 'Token is valid', {
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        created_at: req.user.created_at
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  verifyToken
};
