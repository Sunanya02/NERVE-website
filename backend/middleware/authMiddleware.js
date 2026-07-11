const jwt = require('jsonwebtoken');
const ApiResponse = require('../utils/apiResponse');
const AdminModel = require('../models/adminModel');
const { pool } = require('../config/db');

/**
 * Protect routes by verifying JWT tokens
 */
const protect = async (req, res, next) => {
  let token;

  // Retrieve token from cookie or Authorization header
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // If token is missing
  if (!token) {
    return ApiResponse.error(res, 'Access denied. No token provided.', 401);
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_nerve_admin_jwt_key_12345');

    // Fetch the admin user from database to ensure they still exist
    const admin = await AdminModel.findById(decoded.id);
    if (!admin) {
      return ApiResponse.error(res, 'Authentication failed. User no longer exists.', 401);
    }

    // Attach admin info to request
    req.admin = admin;
    next();
  } catch (error) {
    return ApiResponse.error(res, 'Access denied. Invalid or expired token.', 401);
  }
};

/**
 * Protect routes by verifying User JWT tokens
 */
const protectUser = async (req, res, next) => {
  let token;

  // Retrieve token from cookie or Authorization header
  if (req.cookies && req.cookies.userToken) {
    token = req.cookies.userToken;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // If token is missing
  if (!token) {
    return ApiResponse.error(res, 'Access denied. No token provided.', 401);
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_nerve_admin_jwt_key_12345');

    // Fetch the user from database to ensure they still exist and are active
    const [rows] = await pool.execute(
      'SELECT id, name, email, role, is_active, created_at FROM users WHERE id = ? LIMIT 1',
      [decoded.id]
    );

    if (rows.length === 0) {
      return ApiResponse.error(res, 'Authentication failed. User no longer exists.', 401);
    }

    const user = rows[0];

    // Check if user is active
    if (!user.is_active) {
      return ApiResponse.error(res, 'Access denied. User account is deactivated.', 403);
    }

    // Attach user info to request
    req.user = user;
    next();
  } catch (error) {
    return ApiResponse.error(res, 'Access denied. Invalid or expired token.', 401);
  }
};

module.exports = { protect, protectUser };
