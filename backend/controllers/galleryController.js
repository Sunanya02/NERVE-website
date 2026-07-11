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
 * Helper to format gallery item with full image URL
 */
const formatGallery = (req, galleryItem) => {
  if (!galleryItem) return null;
  const host = req.protocol + '://' + req.get('host');
  return {
    ...galleryItem,
    image_url: galleryItem.image_url ? (galleryItem.image_url.startsWith('http') ? galleryItem.image_url : `${host}/${galleryItem.image_url}`) : null
  };
};

/**
 * @desc Get all gallery items
 * @route GET /api/gallery
 */
const getAllGallery = async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM gallery ORDER BY created_at DESC');
    const formatted = rows.map(item => formatGallery(req, item));
    return ApiResponse.success(res, 'Gallery items retrieved successfully', formatted);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Upload gallery image
 * @route POST /api/gallery
 */
const uploadGalleryImage = async (req, res, next) => {
  try {
    const { title, category } = req.body;

    if (!title) {
      if (req.file) deleteUploadedFile(`uploads/${req.file.filename}`);
      return ApiResponse.error(res, 'Image caption/title is required', 400);
    }

    if (!req.file) {
      return ApiResponse.error(res, 'Please upload an image file', 400);
    }

    const imageUrl = `uploads/${req.file.filename}`;
    const itemCategory = category || 'General';

    const query = `
      INSERT INTO gallery (title, image_url, category, created_at)
      VALUES (?, ?, ?, NOW())
    `;
    const [result] = await pool.execute(query, [title, imageUrl, itemCategory]);

    // Log activity
    try {
      await pool.execute(
        'INSERT INTO recent_activities (activity_type, description) VALUES (?, ?)',
        ['gallery_uploaded', `Uploaded new image "${title}" to category "${itemCategory}"`]
      );
    } catch (err) {
      console.warn('Recent activity logging failed', err.message);
    }

    const [newRow] = await pool.execute('SELECT * FROM gallery WHERE id = ?', [result.insertId]);
    return ApiResponse.success(res, 'Gallery image uploaded successfully', formatGallery(req, newRow[0]), 201);
  } catch (error) {
    if (req.file) deleteUploadedFile(`uploads/${req.file.filename}`);
    next(error);
  }
};

/**
 * @desc Delete gallery image
 * @route DELETE /api/gallery/:id
 */
const deleteGalleryImage = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute('SELECT * FROM gallery WHERE id = ?', [id]);
    if (existing.length === 0) {
      return ApiResponse.error(res, 'Gallery item not found', 404);
    }

    // Delete file if exists
    if (existing[0].image_url) {
      deleteUploadedFile(existing[0].image_url);
    }

    await pool.execute('DELETE FROM gallery WHERE id = ?', [id]);

    // Log activity
    try {
      await pool.execute(
        'INSERT INTO recent_activities (activity_type, description) VALUES (?, ?)',
        ['gallery_deleted', `Deleted gallery image "${existing[0].title}"`]
      );
    } catch (err) {
      console.warn('Recent activity logging failed', err.message);
    }

    return ApiResponse.success(res, 'Gallery image deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllGallery,
  uploadGalleryImage,
  deleteGalleryImage
};
