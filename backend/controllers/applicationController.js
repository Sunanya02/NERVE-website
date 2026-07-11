const { pool } = require('../config/db');
const ApiResponse = require('../utils/apiResponse');
const fs = require('fs');
const path = require('path');

// Helper to delete local upload files safely
const deleteUploadedFile = (filePath) => {
  if (!filePath) return;
  try {
    const absolutePath = path.join(__dirname, '..', filePath);
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }
  } catch (err) {
    console.warn(`Failed to delete file: ${filePath}`, err.message);
  }
};

/**
 * Helper to format application object with full pitch deck URL
 */
const formatApplication = (req, appItem) => {
  if (!appItem) return null;
  const host = req.protocol + '://' + req.get('host');
  return {
    ...appItem,
    pitch_deck_url: appItem.pitch_deck_url ? (appItem.pitch_deck_url.startsWith('http') ? appItem.pitch_deck_url : `${host}/${appItem.pitch_deck_url}`) : null
  };
};

/**
 * @desc Get all applications
 * @route GET /api/applications
 */
const getAllApplications = async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM applications ORDER BY id DESC');
    const formatted = rows.map(item => formatApplication(req, item));
    return ApiResponse.success(res, 'Applications retrieved successfully', formatted);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Update application workflow status
 * @route PATCH /api/applications/:id/status
 */
const updateApplicationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ['pending', 'approved', 'rejected', 'reviewed'];
    if (!status || !allowedStatuses.includes(status.toLowerCase())) {
      return ApiResponse.error(res, 'Invalid status type. Must be Pending, Approved, Rejected, or Reviewed', 400);
    }

    const [existing] = await pool.execute('SELECT * FROM applications WHERE id = ?', [id]);
    if (existing.length === 0) {
      return ApiResponse.error(res, 'Application not found', 404);
    }

    // Capitalize status properly
    const normalizedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

    await pool.execute('UPDATE applications SET status = ? WHERE id = ?', [normalizedStatus, id]);

    // Log activity
    try {
      await pool.execute(
        'INSERT INTO recent_activities (activity_type, description) VALUES (?, ?)',
        ['application_status', `Updated application for "${existing[0].startup_name}" status to ${normalizedStatus}`]
      );
    } catch (err) {
      console.warn('Recent activity logging failed:', err.message);
    }

    const [updatedRow] = await pool.execute('SELECT * FROM applications WHERE id = ?', [id]);
    return ApiResponse.success(res, `Application status updated to ${normalizedStatus}`, formatApplication(req, updatedRow[0]));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Upload pitch deck PDF / Document
 * @route POST /api/applications/:id/pitch-deck
 */
const uploadPitchDeck = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return ApiResponse.error(res, 'Please upload a PDF document or image file', 400);
    }

    const [existing] = await pool.execute('SELECT * FROM applications WHERE id = ?', [id]);
    if (existing.length === 0) {
      deleteUploadedFile(`uploads/${req.file.filename}`);
      return ApiResponse.error(res, 'Application not found', 404);
    }

    let pitchDeckUrl = existing[0].pitch_deck_url;
    // Delete old pitch deck from disk if it exists
    if (pitchDeckUrl) {
      deleteUploadedFile(pitchDeckUrl);
    }

    pitchDeckUrl = `uploads/${req.file.filename}`;
    await pool.execute('UPDATE applications SET pitch_deck_url = ? WHERE id = ?', [pitchDeckUrl, id]);

    // Log activity
    try {
      await pool.execute(
        'INSERT INTO recent_activities (activity_type, description) VALUES (?, ?)',
        ['application_deck_upload', `Uploaded pitch deck document for startup "${existing[0].startup_name}"`]
      );
    } catch (err) {
      console.warn('Recent activity logging failed:', err.message);
    }

    const [updatedRow] = await pool.execute('SELECT * FROM applications WHERE id = ?', [id]);
    return ApiResponse.success(res, 'Pitch deck uploaded successfully', formatApplication(req, updatedRow[0]));
  } catch (error) {
    if (req.file) deleteUploadedFile(`uploads/${req.file.filename}`);
    next(error);
  }
};

/**
 * @desc Delete application
 * @route DELETE /api/applications/:id
 */
const deleteApplication = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute('SELECT * FROM applications WHERE id = ?', [id]);
    if (existing.length === 0) {
      return ApiResponse.error(res, 'Application not found', 404);
    }

    // Delete pitch deck file if exists
    if (existing[0].pitch_deck_url) {
      deleteUploadedFile(existing[0].pitch_deck_url);
    }

    await pool.execute('DELETE FROM applications WHERE id = ?', [id]);

    // Log activity
    try {
      await pool.execute(
        'INSERT INTO recent_activities (activity_type, description) VALUES (?, ?)',
        ['application_deleted', `Removed application for startup "${existing[0].startup_name}"`]
      );
    } catch (err) {
      console.warn('Recent activity logging failed:', err.message);
    }

    return ApiResponse.success(res, 'Application deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllApplications,
  updateApplicationStatus,
  uploadPitchDeck,
  deleteApplication
};
