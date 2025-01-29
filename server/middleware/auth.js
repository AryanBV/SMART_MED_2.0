// server/middleware/auth.js
const jwt = require('jsonwebtoken');

const auth = async (req, res, next) => {
  try {
    console.log('Incoming Authorization header:', req.header('Authorization')); // Add this
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded); // Add this
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error); // Add this
    res.status(401).json({ message: 'Token is invalid or expired' });
  }
};

module.exports = auth;