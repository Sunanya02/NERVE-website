const { pool } = require('../config/db');
const ApiResponse = require('../utils/apiResponse');

/**
 * @desc Get all users
 * @route GET /api/users
 */
const getAllUsers = async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM users ORDER BY id DESC');
    return ApiResponse.success(res, 'Users retrieved successfully', rows);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Update user info (name, email, role)
 * @route PUT /api/users/:id
 */
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;

    if (!name || !email || !role) {
      return ApiResponse.error(res, 'Name, email, and role are required', 400);
    }

    // Check if user exists
    const [existing] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
    if (existing.length === 0) {
      return ApiResponse.error(res, 'User not found', 404);
    }

    // Check if email is already used by another user
    const [emailCheck] = await pool.execute('SELECT * FROM users WHERE email = ? AND id != ?', [email, id]);
    if (emailCheck.length > 0) {
      return ApiResponse.error(res, 'Email already in use', 400);
    }

    const query = 'UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?';
    await pool.execute(query, [name, email, role, id]);

    // Log activity
    try {
      await pool.execute(
        'INSERT INTO recent_activities (activity_type, description) VALUES (?, ?)',
        ['user_updated', `Updated user "${name}" details`]
      );
    } catch (err) {
      console.warn('Recent activity logging failed:', err.message);
    }

    const [updatedRow] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
    return ApiResponse.success(res, 'User updated successfully', updatedRow[0]);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Toggle user active status (Activate/Deactivate)
 * @route PATCH /api/users/:id/toggle-status
 */
const toggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
    if (existing.length === 0) {
      return ApiResponse.error(res, 'User not found', 404);
    }

    const newStatus = existing[0].is_active ? 0 : 1;
    await pool.execute('UPDATE users SET is_active = ? WHERE id = ?', [newStatus, id]);

    // Log activity
    try {
      await pool.execute(
        'INSERT INTO recent_activities (activity_type, description) VALUES (?, ?)',
        ['user_status_toggle', `${newStatus ? 'Activated' : 'Deactivated'} user account "${existing[0].name}"`]
      );
    } catch (err) {
      console.warn('Recent activity logging failed:', err.message);
    }

    return ApiResponse.success(res, `User account ${newStatus ? 'activated' : 'deactivated'} successfully`, { is_active: newStatus });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Delete user
 * @route DELETE /api/users/:id
 */
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
    if (existing.length === 0) {
      return ApiResponse.error(res, 'User not found', 404);
    }

    await pool.execute('DELETE FROM users WHERE id = ?', [id]);

    // Log activity
    try {
      await pool.execute(
        'INSERT INTO recent_activities (activity_type, description) VALUES (?, ?)',
        ['user_deleted', `Deleted user account "${existing[0].name}"`]
      );
    } catch (err) {
      console.warn('Recent activity logging failed:', err.message);
    }

    return ApiResponse.success(res, 'User deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  updateUser,
  toggleUserStatus,
  deleteUser
};
