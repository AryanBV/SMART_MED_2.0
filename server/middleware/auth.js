// server/middleware/auth.js
const jwt = require('jsonwebtoken');

const auth = async (req, res, next) => {
  try {
    // Check for token in Authorization header
    let token = req.header('Authorization')?.replace('Bearer ', '');
    
    // If no token in header, check query parameters (for iframe requests)
    if (!token && req.query.token) {
      token = req.query.token;
    }

    console.log('Auth token:', token ? 'Present' : 'Missing'); // Safe logging without exposing token

    if (!token) {
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Decoded token user:', { 
        profileId: decoded.profileId,
        role: decoded.role 
      }); // Log only necessary info
      req.user = decoded;
      next();
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError.name);
      return res.status(401).json({ message: 'Token is invalid or expired' });
    }
  } catch (error) {
    console.error('Auth middleware error:', {
      name: error.name,
      message: error.message
    });
    res.status(401).json({ message: 'Authentication failed' });
  }
};

module.exports = auth;