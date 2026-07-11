const { pool } = require('../config/db');

class AdminModel {
  /**
   * Find an admin by email
   * @param {string} email 
   * @returns {Promise<Object|null>}
   */
  static async findByEmail(email) {
    const query = 'SELECT * FROM admins WHERE email = ? LIMIT 1';
    const [rows] = await pool.execute(query, [email]);
    if (rows.length === 0) {
      return null;
    }
    return rows[0];
  }

  /**
   * Find an admin by ID
   * @param {number} id 
   * @returns {Promise<Object|null>}
   */
  static async findById(id) {
    const query = 'SELECT id, name, email, role, created_at, updated_at FROM admins WHERE id = ? LIMIT 1';
    const [rows] = await pool.execute(query, [id]);
    if (rows.length === 0) {
      return null;
    }
    return rows[0];
  }

  /**
   * Create a new admin (helper for potential future operations)
   * @param {Object} adminData 
   * @returns {Promise<number>} Inserted admin ID
   */
  static async create({ name, email, password, role }) {
    const query = `
      INSERT INTO admins (name, email, password, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, NOW(), NOW())
    `;
    const [result] = await pool.execute(query, [name, email, password, role || 'admin']);
    return result.insertId;
  }
}

module.exports = AdminModel;
