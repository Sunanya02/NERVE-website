const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

const importSchema = async () => {
  // First connect without specifying database to create it if it doesn't exist
  let connection;
  try {
    console.log('Connecting to MySQL host...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true
    });
    console.log('Connected to MySQL host.');
  } catch (err) {
    console.error('Failed to connect to MySQL host:', err.message);
    process.exit(1);
  }

  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    console.log(`Reading schema file: ${schemaPath}`);
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Executing schema queries...');
    await connection.query(sql);
    console.log('Schema imported successfully!');
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('Failed to import schema:', error.message);
    if (connection) await connection.end();
    process.exit(1);
  }
};

importSchema();
