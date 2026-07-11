const { pool } = require('../config/db');
const ApiResponse = require('../utils/apiResponse');

/**
 * @desc Get all contact messages
 * @route GET /api/contacts
 */
const getAllMessages = async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM contact_messages ORDER BY created_at DESC');
    return ApiResponse.success(res, 'Contact messages retrieved successfully', rows);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Update contact message status (e.g. read/unread)
 * @route PATCH /api/contacts/:id/status
 */
const updateMessageStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['read', 'unread'].includes(status.toLowerCase())) {
      return ApiResponse.error(res, 'Invalid status. Must be "read" or "unread"', 400);
    }

    const [existing] = await pool.execute('SELECT * FROM contact_messages WHERE id = ?', [id]);
    if (existing.length === 0) {
      return ApiResponse.error(res, 'Message not found', 404);
    }

    await pool.execute('UPDATE contact_messages SET status = ? WHERE id = ?', [status.toLowerCase(), id]);

    // Log activity
    try {
      await pool.execute(
        'INSERT INTO recent_activities (activity_type, description) VALUES (?, ?)',
        ['contact_message_status', `Marked message #${id} from "${existing[0].name}" as ${status.toLowerCase()}`]
      );
    } catch (err) {
      console.warn('Recent activity logging failed', err.message);
    }

    return ApiResponse.success(res, `Message status updated to ${status.toLowerCase()}`, { status });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Delete contact message
 * @route DELETE /api/contacts/:id
 */
const deleteMessage = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute('SELECT * FROM contact_messages WHERE id = ?', [id]);
    if (existing.length === 0) {
      return ApiResponse.error(res, 'Message not found', 404);
    }

    await pool.execute('DELETE FROM contact_messages WHERE id = ?', [id]);

    // Log activity
    try {
      await pool.execute(
        'INSERT INTO recent_activities (activity_type, description) VALUES (?, ?)',
        ['contact_message_deleted', `Deleted contact message from "${existing[0].name}" (#${id})`]
      );
    } catch (err) {
      console.warn('Recent activity logging failed', err.message);
    }

    return ApiResponse.success(res, 'Contact message deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllMessages,
  updateMessageStatus,
  deleteMessage
};
