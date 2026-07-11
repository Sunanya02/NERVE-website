const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const path = require('path');
const { checkConnection } = require('./config/db');
const adminAuthRoutes = require('./routes/adminAuthRoutes');
const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const newsRoutes = require('./routes/newsRoutes');
const galleryRoutes = require('./routes/galleryRoutes');
const contactRoutes = require('./routes/contactRoutes');
const userRoutes = require('./routes/userRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const ApiResponse = require('./utils/apiResponse');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware configuration
app.use(cors({
  origin: true, // Allow all origins for development, and support credential passing
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Root path heartbeat
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Nerve STPI Backend API is running'
  });
});

// Mount routes
app.use('/api/admin', adminAuthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/users', userRoutes);
app.use('/api/applications', applicationRoutes);

// Catch-all 404 handlers
app.use((req, res) => {
  return ApiResponse.error(res, `Route ${req.method} ${req.originalUrl} not found`, 404);
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error('Error occurred in server pipeline:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  return ApiResponse.error(res, message, statusCode);
});

// Start the server
const startServer = async () => {
  console.log('Verifying MySQL Database connection...');
  const isDbConnected = await checkConnection();

  if (!isDbConnected) {
    console.error('CRITICAL WARNING: Database connection failed. Please ensure MySQL is running, the schema.sql is imported, and the credentials in .env are correct.');
  }

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Test server URL: http://localhost:${PORT}`);
  });
};

startServer();
