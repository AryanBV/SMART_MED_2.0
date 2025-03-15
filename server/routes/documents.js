// Path: server/routes/documents.js

const db = require('../config/database');
const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const documentProcessingController = require('../controllers/documentProcessingController');
const upload = require('../middleware/upload');
const auth = require('../middleware/auth');
const { validateDocumentUpload } = require('../middleware/validation');

// All routes require authentication
router.use(auth);

router.get('/shared-with-me', (req, res, next) => documentController.getSharedDocuments(req, res, next));
router.get('/family/:profileId', (req, res, next) => documentController.getFamilyDocuments(req, res, next));

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

router.get('/profile/:profileId', async (req, res, next) => {
    const connection = await db.getConnection();
    try {
        const { profileId } = req.params;
        
        const [profiles] = await connection.execute(
            `SELECT id, blood_pressure, blood_glucose, hba1c 
             FROM profiles WHERE id = ?`,
            [profileId]
        );

        if (profiles.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found'
            });
        }

        const [documents] = await connection.execute(
            `SELECT 
                md.id,
                md.file_name,
                md.processed_status,
                md.created_at,
                md.metadata,
                md.ocr_text,
                md.last_processed_at,
                em.medicine_name,
                em.dosage,
                em.frequency,
                em.instructions,
                em.confidence_score
            FROM medical_documents md
            LEFT JOIN extracted_medicines em ON md.id = em.document_id
            WHERE md.profile_id = ? 
            AND md.processed_status = 'completed'
            AND md.is_archived = false
            ORDER BY md.created_at DESC`,
            [profileId]
        );

        const documentMap = new Map();
        documents.forEach(doc => {
            if (!documentMap.has(doc.id)) {
                let metadata = {};
                try {
                    metadata = doc.metadata ? JSON.parse(doc.metadata) : {};
                } catch (err) {
                    console.error('Error parsing metadata for document:', doc.id, err);
                }

                documentMap.set(doc.id, {
                    id: doc.id,
                    fileName: doc.file_name,
                    processedStatus: doc.processed_status,
                    createdAt: doc.created_at,
                    lastProcessedAt: doc.last_processed_at,
                    extractedText: doc.ocr_text,
                    vitals: metadata.vitals || {
                        blood_pressure: profiles[0].blood_pressure || 'N/A',
                        blood_glucose: profiles[0].blood_glucose || 'N/A',
                        hba1c: profiles[0].hba1c || 'N/A'
                    },
                    medicines: []
                });
            }

            if (doc.medicine_name) {
                const currentDoc = documentMap.get(doc.id);
                currentDoc.medicines.push({
                    name: doc.medicine_name,
                    dosage: doc.dosage,
                    frequency: doc.frequency,
                    instructions: doc.instructions,
                    confidence_score: doc.confidence_score
                });
            }
        });

        const formattedDocuments = Array.from(documentMap.values());

        res.json({
            success: true,
            profile: {
                id: profiles[0].id,
                vitals: {
                    blood_pressure: profiles[0].blood_pressure || 'N/A',
                    blood_glucose: profiles[0].blood_glucose || 'N/A',
                    hba1c: profiles[0].hba1c || 'N/A'
                }
            },
            documents: formattedDocuments
        });

    } catch (error) {
        console.error('Error in getProfileDocuments:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching profile documents',
            error: error.message
        });
    } finally {
        if (connection) {
            connection.release();
        }
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