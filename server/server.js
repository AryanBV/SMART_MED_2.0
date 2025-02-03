// server/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profiles');
const familyRoutes = require('./routes/family');
const documentsRouter = require('./routes/documents');

require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'your-production-domain' 
    : 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Disposition'] // Add this line
}));

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Content-Security-Policy', "frame-ancestors 'self'");
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  setHeaders: (res, path) => {
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Content-Security-Policy', "frame-ancestors 'self'");
  }
}));
app.use(express.static('public'));

// Logging middleware
app.use((req, res, next) => {
 console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
 next();
});

// Database
const db = require('./config/database');

// Test database connection
const testConnection = async () => {
 try {
   await db.query('SELECT 1');
   console.log('Database connection successful');
 } catch (error) {
   console.error('Database connection failed:', error);
 }
};

testConnection();

// Basic route
app.get('/', (req, res) => {
 res.json({ message: 'Welcome to SMART_MED_2.0 API' });
});

app.get('/favicon.ico', (req, res) => {
 res.status(204).end();
});

// Test routes
app.get('/api/test', (req, res) => {
 res.json({ message: 'API is accessible' });
});

app.get('/api/auth/test', (req, res) => {
 res.json({ message: 'Auth routes are accessible' });
});

// API Routes in correct order
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/family', familyRoutes);
app.use('/api/documents', documentsRouter);

// Log available routes
app.use((req, res, next) => {
 console.log('Available routes:', app._router.stack
   .filter(r => r.route)
   .map(r => `${Object.keys(r.route.methods).join(', ').toUpperCase()} ${r.route.path}`));
 next();
});

// Test profile route
app.get('/api/test-profiles/:userId', async (req, res) => {
 try {
   const [rows] = await db.query('SELECT * FROM profiles WHERE user_id = ?', [req.params.userId]);
   res.json({
     message: 'Test profiles route',
     profiles: rows,
     userId: req.params.userId
   });
 } catch (error) {
   res.status(500).json({ error: error.message });
 }
});

// Error handling middleware should be last
app.use(notFound);
app.use(errorHandler);

// Port
const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, () => {
 console.log(`Server is running on port ${PORT}`);
 console.log(`API URL: http://localhost:${PORT}`);
 console.log('Press Ctrl+C to stop the server');
});

// Handle server shutdown
process.on('SIGTERM', () => {
 console.log('SIGTERM received. Shutting down gracefully...');
 process.exit(0);
});

process.on('SIGINT', () => {
 console.log('SIGINT received. Shutting down gracefully...');
 process.exit(0);
});

module.exports = app;