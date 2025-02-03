// server/middleware/validation.js
const { check, validationResult } = require('express-validator');

const validateDocumentUpload = [
  check('documentType')
    .isIn(['prescription', 'lab_report', 'discharge_summary', 'other'])
    .withMessage('Invalid document type'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ 
        status: 'error',
        message: 'Validation failed',
        errors: errors.array() 
      });
    }
    next();
  }
];

module.exports = {
  validateDocumentUpload
};