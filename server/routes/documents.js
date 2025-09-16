// Path: server/routes/documents.js

const { supabase } = require('../config/database');
const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const documentProcessingController = require('../controllers/documentProcessingController');
const upload = require('../middleware/upload');
const auth = require('../middleware/auth');
const { validateDocumentUpload } = require('../middleware/validation');

// Test route without auth
router.get('/profile/:profileId/test', async (req, res, next) => {
    try {
        const { profileId } = req.params;
        console.log('Getting documents for profile:', profileId);

        // Get documents for this profile
        const { data: documents, error: documentsError } = await supabase
            .from('medical_documents')
            .select(`
                id,
                file_name,
                processed_status,
                created_at,
                metadata,
                ocr_text,
                last_processed_at
            `)
            .eq('profile_id', profileId)
            .order('created_at', { ascending: false });

        console.log('Documents query result:', { documents, documentsError });

        if (documentsError) {
            console.error('Supabase documents error:', documentsError);
            throw documentsError;
        }

        // Format the response
        const formattedDocuments = documents.map(doc => {
            let metadata = {};
            try {
                metadata = doc.metadata ? JSON.parse(doc.metadata) : {};
            } catch (err) {
                console.error('Error parsing metadata for document:', doc.id, err);
            }

            return {
                id: doc.id,
                fileName: doc.file_name,
                processedStatus: doc.processed_status,
                createdAt: doc.created_at,
                lastProcessedAt: doc.last_processed_at,
                extractedText: doc.ocr_text,
                medicines: metadata.medicines || []
            };
        });

        console.log('Returning formatted documents:', formattedDocuments);
        res.json(formattedDocuments);

    } catch (error) {
        console.error('Error in getProfileDocuments:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching profile documents',
            error: error.message
        });
    }
});

// All routes require authentication
router.use(auth);

router.get('/shared-with-me', (req, res, next) => documentController.getSharedDocuments(req, res, next));
router.get('/family/:profileId', (req, res, next) => documentController.getFamilyDocuments(req, res, next));
router.get('/profile/:profileId', (req, res, next) => documentController.getProfileDocuments(req, res, next));

router.post('/upload', 
    upload.single('document'), 
    validateDocumentUpload,
    (req, res, next) => documentController.uploadDocument(req, res, next)
);

router.get('/', (req, res, next) => documentController.getDocuments(req, res, next));
router.get('/:id', (req, res, next) => documentController.getDocument(req, res, next));
router.delete('/:id', (req, res, next) => documentController.deleteDocument(req, res, next));

router.get('/:id/view', (req, res, next) => {
    const token = req.query.token;
    if (token) {
        req.headers.authorization = `Bearer ${token}`;
    }
    auth(req, res, next);
}, (req, res, next) => documentController.viewDocument(req, res, next));

router.get('/:id/download', (req, res, next) => {
    const token = req.query.token;
    if (token) {
        req.headers.authorization = `Bearer ${token}`;
    }
    auth(req, res, next);
}, (req, res, next) => documentController.downloadDocument(req, res, next));

router.get('/profile/:profileId/test', async (req, res, next) => {
    try {
        const { profileId } = req.params;
        console.log('Getting documents for profile:', profileId);

        // Get documents for this profile
        const { data: documents, error: documentsError } = await supabase
            .from('medical_documents')
            .select(`
                id,
                file_name,
                processed_status,
                created_at,
                metadata,
                ocr_text,
                last_processed_at
            `)
            .eq('profile_id', profileId)
            .order('created_at', { ascending: false });

        console.log('Documents query result:', { documents, documentsError });

        if (documentsError) {
            console.error('Supabase documents error:', documentsError);
            throw documentsError;
        }

        // Format the response
        const formattedDocuments = documents.map(doc => {
            let metadata = {};
            try {
                metadata = doc.metadata ? JSON.parse(doc.metadata) : {};
            } catch (err) {
                console.error('Error parsing metadata for document:', doc.id, err);
            }

            return {
                id: doc.id,
                fileName: doc.file_name,
                processedStatus: doc.processed_status,
                createdAt: doc.created_at,
                lastProcessedAt: doc.last_processed_at,
                extractedText: doc.ocr_text,
                medicines: metadata.medicines || []
            };
        });

        console.log('Returning formatted documents:', formattedDocuments);
        res.json(formattedDocuments);

    } catch (error) {
        console.error('Error in getProfileDocuments:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching profile documents',
            error: error.message
        });
    }
});

router.get('/:id/extracted-data', (req, res, next) => documentController.getExtractedData(req, res, next));
router.post('/:id/process', (req, res, next) => documentController.retryProcessing(req, res, next));
router.get('/:id/data', (req, res, next) => documentController.getDocumentWithExtractedData(req, res, next));

router.post('/:id/share', (req, res, next) => documentController.shareDocument(req, res, next));
router.patch('/:id/access', (req, res, next) => documentController.updateAccess(req, res, next));

router.post('/test-ocr', 
    upload.single('document'), 
    (req, res, next) => documentProcessingController.testOCR(req, res, next)
);

router.post('/test-extraction/:id', (req, res, next) => 
    documentProcessingController.testExtraction(req, res, next)
);

module.exports = router;