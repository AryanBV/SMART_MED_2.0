const express = require('express');
const cors = require('cors');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profiles');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/api/profiles', profileRoutes);

app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});


app.get('/api/test', (req, res) => {
  res.json({ message: 'API is accessible' });
});

app.get('/api/auth/test', (req, res) => {
  res.json({ message: 'Auth routes are accessible' });
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

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to SMART_MED_2.0 API' });
});

// Mount routes
app.use('/api/auth', authRoutes);



// Port
const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

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

// Error handling middleware
app.use(notFound);
app.use(errorHandler);