const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true
});

const promisePool = pool.promise();

pool.on('connection', (connection) => {
  console.log('New database connection established');
});

pool.on('error', (err) => {
  console.error('Database pool error:', err);
});

process.on('SIGINT', () => {
  pool.end((err) => {
    if (err) {
      console.error('Error closing pool:', err);
    }
    console.log('Database pool closed');
    process.exit(0);
  });
});

module.exports = promisePool;