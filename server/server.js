const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Port
const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});