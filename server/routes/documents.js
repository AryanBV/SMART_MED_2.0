const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const documentProcessingController = require('../controllers/documentProcessingController');
const upload = require('../middleware/upload');
const auth = require('../middleware/auth');
const { validateDocumentUpload } = require('../middleware/validation');

// All routes require authentication
router.use(auth);

// Document retrieval routes
router.get('/shared-with-me', (req, res, next) => documentController.getSharedDocuments(req, res, next));
router.get('/family/:profileId', (req, res, next) => documentController.getFamilyDocuments(req, res, next));

// Document upload and processing
router.post('/upload', 
    upload.single('document'), 
    validateDocumentUpload,
    (req, res, next) => documentController.uploadDocument(req, res, next)
);

// Base document routes
router.get('/', (req, res, next) => documentController.getDocuments(req, res, next));
router.get('/:id', (req, res, next) => documentController.getDocument(req, res, next));
router.delete('/:id', (req, res, next) => documentController.deleteDocument(req, res, next));

// Document viewing with token support
router.get('/:id/view', (req, res, next) => {
    const token = req.query.token;
    if (token) {
        req.headers.authorization = `Bearer ${token}`;
    }
    auth(req, res, next);
}, (req, res, next) => documentController.viewDocument(req, res, next));

// Document processing routes
router.get('/:id/extracted-data', (req, res, next) => documentController.getExtractedData(req, res, next));
router.post('/:id/process', (req, res, next) => documentController.retryProcessing(req, res, next));
router.get('/:id/data', (req, res, next) => documentController.getDocumentWithExtractedData(req, res, next));

// Document sharing and access control
router.post('/:id/share', (req, res, next) => documentController.shareDocument(req, res, next));
router.patch('/:id/access', (req, res, next) => documentController.updateAccess(req, res, next));

// OCR testing route
router.post('/test-ocr', 
    upload.single('document'), 
    (req, res, next) => documentProcessingController.testOCR(req, res, next)
);

module.exports = router;