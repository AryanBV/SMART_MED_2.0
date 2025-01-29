// server/middleware/errorHandler.js
const multer = require('multer');

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

    // Handle Multer errors
    if (err instanceof multer.MulterError) {
        return res.status(400).json({
            status: 'error',
            message: 'File Upload Error',
            error: err.message
        });
    }

    // Handle document processing errors
    if (err.name === 'DocumentProcessingError') {
        return res.status(422).json({
            status: 'error',
            message: 'Document Processing Failed',
            error: err.message
        });
    }
  
    // Default error
    res.status(err.status || 500).json({
        status: 'error',
        message: process.env.NODE_ENV === 'development' 
            ? err.message || 'Internal Server Error'
            : 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};
  
// Not Found middleware
const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

// Custom error class for document processing
class DocumentProcessingError extends Error {
    constructor(message) {
        super(message);
        this.name = 'DocumentProcessingError';
    }
}
  
module.exports = { 
    errorHandler, 
    notFound,
    DocumentProcessingError 
};