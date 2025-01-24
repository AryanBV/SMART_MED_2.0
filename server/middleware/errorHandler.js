// middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
  
    // Handle specific error types
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        status: 'error',
        message: 'Validation Error',
        errors: err.errors
      });
    }
  
    if (err.name === 'UnauthorizedError') {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized Access'
      });
    }
  
    // Default error
    res.status(err.status || 500).json({
      status: 'error',
      message: err.message || 'Internal Server Error'
    });
  };
  
  // Not Found middleware
  const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
  };
  
  module.exports = { errorHandler, notFound };