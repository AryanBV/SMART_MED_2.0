// server/routes/documents.js
const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const upload = require('../middleware/upload');
const auth = require('../middleware/auth');

router.use(auth);

router.post('/upload', upload.single('document'), documentController.uploadDocument);
router.get('/', documentController.getDocuments);
router.get('/:id', documentController.getDocument);
router.delete('/:id', documentController.deleteDocument);
router.get('/:id/extracted-data', documentController.getExtractedData);
router.post('/:id/process', documentController.retryProcessing);

module.exports = router;