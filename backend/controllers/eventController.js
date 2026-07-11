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
 * Helper to format event object with full image URL
 */
const formatEvent = (req, event) => {
  if (!event) return null;
  const host = req.protocol + '://' + req.get('host');
  return {
    ...event,
    image_url: event.image_url ? (event.image_url.startsWith('http') ? event.image_url : `${host}/${event.image_url}`) : null
  };
};

/**
 * @desc Get all events (Admin view: shows both published and unpublished)
 * @route GET /api/events
 */
const getAllEvents = async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM events ORDER BY event_date DESC');
    const formatted = rows.map(item => formatEvent(req, item));
    return ApiResponse.success(res, 'Events retrieved successfully', formatted);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Create new event
 * @route POST /api/events
 */
const createEvent = async (req, res, next) => {
  try {
    const { title, description, event_date, location, is_published } = req.body;

    if (!title || !event_date || !location) {
      if (req.file) deleteUploadedFile(`uploads/${req.file.filename}`);
      return ApiResponse.error(res, 'Title, date, and location are required', 400);
    }

    const imageUrl = req.file ? `uploads/${req.file.filename}` : null;
    const published = is_published === undefined ? 1 : parseInt(is_published);

    const query = `
      INSERT INTO events (title, description, event_date, location, image_url, is_published, created_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;
    const [result] = await pool.execute(query, [title, description || '', event_date, location, imageUrl, published]);

    // Log activity
    try {
      await pool.execute(
        'INSERT INTO recent_activities (activity_type, description) VALUES (?, ?)',
        ['event_created', `Added new event "${title}"`]
      );
    } catch (err) {
      console.warn('Recent activity logging failed', err.message);
    }

    const [newRow] = await pool.execute('SELECT * FROM events WHERE id = ?', [result.insertId]);
    return ApiResponse.success(res, 'Event created successfully', formatEvent(req, newRow[0]), 201);
  } catch (error) {
    if (req.file) deleteUploadedFile(`uploads/${req.file.filename}`);
    next(error);
  }
};

/**
 * @desc Update event
 * @route PUT /api/events/:id
 */
const updateEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, event_date, location, is_published } = req.body;

    if (!title || !event_date || !location) {
      if (req.file) deleteUploadedFile(`uploads/${req.file.filename}`);
      return ApiResponse.error(res, 'Title, date, and location are required', 400);
    }

    // Check if event exists
    const [existing] = await pool.execute('SELECT * FROM events WHERE id = ?', [id]);
    if (existing.length === 0) {
      if (req.file) deleteUploadedFile(`uploads/${req.file.filename}`);
      return ApiResponse.error(res, 'Event not found', 404);
    }

    let imageUrl = existing[0].image_url;
    // If new image uploaded, delete the old one
    if (req.file) {
      if (imageUrl) deleteUploadedFile(imageUrl);
      imageUrl = `uploads/${req.file.filename}`;
    }

    const published = is_published === undefined ? existing[0].is_published : parseInt(is_published);

    const query = `
      UPDATE events 
      SET title = ?, description = ?, event_date = ?, location = ?, image_url = ?, is_published = ?
      WHERE id = ?
    `;
    await pool.execute(query, [title, description || '', event_date, location, imageUrl, published, id]);

    // Log activity
    try {
      await pool.execute(
        'INSERT INTO recent_activities (activity_type, description) VALUES (?, ?)',
        ['event_updated', `Updated event "${title}"`]
      );
    } catch (err) {
      console.warn('Recent activity logging failed', err.message);
    }

    const [updatedRow] = await pool.execute('SELECT * FROM events WHERE id = ?', [id]);
    return ApiResponse.success(res, 'Event updated successfully', formatEvent(req, updatedRow[0]));
  } catch (error) {
    if (req.file) deleteUploadedFile(`uploads/${req.file.filename}`);
    next(error);
  }
};

/**
 * @desc Delete event
 * @route DELETE /api/events/:id
 */
const deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute('SELECT * FROM events WHERE id = ?', [id]);
    if (existing.length === 0) {
      return ApiResponse.error(res, 'Event not found', 404);
    }

    // Delete image file if exists
    if (existing[0].image_url) {
      deleteUploadedFile(existing[0].image_url);
    }

    await pool.execute('DELETE FROM events WHERE id = ?', [id]);

    // Log activity
    try {
      await pool.execute(
        'INSERT INTO recent_activities (activity_type, description) VALUES (?, ?)',
        ['event_deleted', `Deleted event "${existing[0].title}"`]
      );
    } catch (err) {
      console.warn('Recent activity logging failed', err.message);
    }

    return ApiResponse.success(res, 'Event deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Toggle Publish Status
 * @route PATCH /api/events/:id/toggle-publish
 */
const togglePublish = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute('SELECT * FROM events WHERE id = ?', [id]);
    if (existing.length === 0) {
      return ApiResponse.error(res, 'Event not found', 404);
    }

    const newStatus = existing[0].is_published ? 0 : 1;
    await pool.execute('UPDATE events SET is_published = ? WHERE id = ?', [newStatus, id]);

    // Log activity
    try {
      await pool.execute(
        'INSERT INTO recent_activities (activity_type, description) VALUES (?, ?)',
        ['event_published_toggle', `${newStatus ? 'Published' : 'Unpublished'} event "${existing[0].title}"`]
      );
    } catch (err) {
      console.warn('Recent activity logging failed', err.message);
    }

    return ApiResponse.success(res, `Event ${newStatus ? 'published' : 'unpublished'} successfully`, { is_published: newStatus });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  togglePublish
};
