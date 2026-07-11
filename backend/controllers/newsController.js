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
 * Helper to format news object with full thumbnail URL
 */
const formatNews = (req, newsItem) => {
  if (!newsItem) return null;
  const host = req.protocol + '://' + req.get('host');
  return {
    ...newsItem,
    thumbnail_url: newsItem.thumbnail_url ? (newsItem.thumbnail_url.startsWith('http') ? newsItem.thumbnail_url : `${host}/${newsItem.thumbnail_url}`) : null
  };
};

/**
 * @desc Get all news
 * @route GET /api/news
 */
const getAllNews = async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM news ORDER BY published_at DESC');
    const formatted = rows.map(item => formatNews(req, item));
    return ApiResponse.success(res, 'News articles retrieved successfully', formatted);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Create new article
 * @route POST /api/news
 */
const createNews = async (req, res, next) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      if (req.file) deleteUploadedFile(`uploads/${req.file.filename}`);
      return ApiResponse.error(res, 'Headline and content are required', 400);
    }

    const thumbnailUrl = req.file ? `uploads/${req.file.filename}` : null;

    const query = `
      INSERT INTO news (title, content, published_at, created_at, thumbnail_url)
      VALUES (?, ?, NOW(), NOW(), ?)
    `;
    const [result] = await pool.execute(query, [title, content, thumbnailUrl]);

    // Log activity
    try {
      await pool.execute(
        'INSERT INTO recent_activities (activity_type, description) VALUES (?, ?)',
        ['news_created', `Published news article "${title}"`]
      );
    } catch (err) {
      console.warn('Recent activity logging failed', err.message);
    }

    const [newRow] = await pool.execute('SELECT * FROM news WHERE id = ?', [result.insertId]);
    return ApiResponse.success(res, 'News article created successfully', formatNews(req, newRow[0]), 201);
  } catch (error) {
    if (req.file) deleteUploadedFile(`uploads/${req.file.filename}`);
    next(error);
  }
};

/**
 * @desc Update news article
 * @route PUT /api/news/:id
 */
const updateNews = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;

    if (!title || !content) {
      if (req.file) deleteUploadedFile(`uploads/${req.file.filename}`);
      return ApiResponse.error(res, 'Headline and content are required', 400);
    }

    // Check if article exists
    const [existing] = await pool.execute('SELECT * FROM news WHERE id = ?', [id]);
    if (existing.length === 0) {
      if (req.file) deleteUploadedFile(`uploads/${req.file.filename}`);
      return ApiResponse.error(res, 'News article not found', 404);
    }

    let thumbnailUrl = existing[0].thumbnail_url;
    // If new thumbnail uploaded, delete the old one
    if (req.file) {
      if (thumbnailUrl) deleteUploadedFile(thumbnailUrl);
      thumbnailUrl = `uploads/${req.file.filename}`;
    }

    const query = `
      UPDATE news 
      SET title = ?, content = ?, thumbnail_url = ?
      WHERE id = ?
    `;
    await pool.execute(query, [title, content, thumbnailUrl, id]);

    // Log activity
    try {
      await pool.execute(
        'INSERT INTO recent_activities (activity_type, description) VALUES (?, ?)',
        ['news_updated', `Updated news article "${title}"`]
      );
    } catch (err) {
      console.warn('Recent activity logging failed', err.message);
    }

    const [updatedRow] = await pool.execute('SELECT * FROM news WHERE id = ?', [id]);
    return ApiResponse.success(res, 'News article updated successfully', formatNews(req, updatedRow[0]));
  } catch (error) {
    if (req.file) deleteUploadedFile(`uploads/${req.file.filename}`);
    next(error);
  }
};

/**
 * @desc Delete news article
 * @route DELETE /api/news/:id
 */
const deleteNews = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute('SELECT * FROM news WHERE id = ?', [id]);
    if (existing.length === 0) {
      return ApiResponse.error(res, 'News article not found', 404);
    }

    // Delete thumbnail file if exists
    if (existing[0].thumbnail_url) {
      deleteUploadedFile(existing[0].thumbnail_url);
    }

    await pool.execute('DELETE FROM news WHERE id = ?', [id]);

    // Log activity
    try {
      await pool.execute(
        'INSERT INTO recent_activities (activity_type, description) VALUES (?, ?)',
        ['news_deleted', `Deleted news article "${existing[0].title}"`]
      );
    } catch (err) {
      console.warn('Recent activity logging failed', err.message);
    }

    return ApiResponse.success(res, 'News article deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllNews,
  createNews,
  updateNews,
  deleteNews
};
