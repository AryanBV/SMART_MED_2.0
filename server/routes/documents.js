// server/routes/documents.js
const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const documentProcessingController = require('../controllers/documentProcessingController');
const upload = require('../middleware/upload');
const auth = require('../middleware/auth');
const fs = require('fs').promises;
const { validateDocumentUpload } = require('../middleware/validation');

router.use(auth);

// Document CRUD operations
router.post('/upload', 
    upload.single('document'), 
    validateDocumentUpload,
    documentController.uploadDocument
  );
router.get('/', documentController.getDocuments);
router.get('/:id', documentController.getDocument);
router.get('/:id/view', (req, res, next) => {
  // Check for token in query params for iframe requests
  const token = req.query.token;
  if (token) {
      req.headers.authorization = `Bearer ${token}`;
  }
  auth(req, res, next);
}, documentController.viewDocument);

router.delete('/:id', documentController.deleteDocument);

// Document processing routes
router.get('/:id/extracted-data', documentController.getExtractedData);
router.post('/:id/process', documentController.retryProcessing);

// OCR testing route
router.post('/test-ocr', upload.single('document'), documentProcessingController.testOCR);

// These routes need controller methods defined
router.post('/:id/share', documentController.shareDocument); // Make sure this exists
router.patch('/:id/access', documentController.updateAccess); // This was causing the error

// Family document routes
router.get('/family/:profileId', documentController.getFamilyDocuments);
router.get('/shared-with-me', documentController.getSharedDocuments);

module.exports = router;