const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'nerve_admin',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Helper to check DB connection on startup
const checkConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log(`Successfully connected to MySQL database: ${process.env.DB_NAME}`);
    connection.release();
    return true;
  } catch (error) {
    console.error(`Database connection failed: ${error.message}`);
    return false;
  }
};

module.exports = {
  pool,
  checkConnection
};
