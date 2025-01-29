const express = require('express');
const cors = require('cors');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profiles');
const familyRoutes = require('./routes/family');


require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // Your frontend URL
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

const documentsRouter = require('./routes/documents');
app.use('/api/documents', documentsRouter);


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

// Mount routes in correct order
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/family', familyRoutes);
console.log('Available routes:', app._router.stack.filter(r => r.route).map(r => r.route.path)); 

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
});

module.exports = app;