// server/controllers/documentController.js
const path = require('path');
const { DocumentProcessingError } = require('../middleware/errorHandler');
const db = require('../config/database');
const documentProcessor = require('../services/documentProcessor');
const fs = require('fs').promises;

class DocumentController {
    async uploadDocument(req, res, next) {
        
        
        try {
            console.log('Upload request received:', {
                file: {
                    originalname: req.file.originalname,
                    mimetype: req.file.mimetype,
                    size: req.file.size,
                    path: req.file.path
                },
                body: req.body,
                user: {
                    profileId: req.user.profileId,
                    role: req.user.role
                }
            });

            if (!req.file) {
                throw new DocumentProcessingError('No file uploaded');
            }

            const { file } = req;
            const profileId = req.user.profileId;

            const connection = await db.getConnection();
            await connection.beginTransaction();

            try {
                // Save document record
                const [result] = await connection.execute(
                    `INSERT INTO medical_documents 
                    (profile_id, file_name, file_path, file_type, file_size, mime_type, document_type) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        profileId,
                        file.originalname,
                        file.path,
                        path.extname(file.originalname),
                        file.size,
                        file.mimetype,
                        req.body.documentType || 'other' // Use passed documentType
                    ]
                );

                const documentId = result.insertId;

                // Process document and extract text
                const extractedText = await documentProcessor.processDocument(file.path);
                
                // Extract medicines from text using documentProcessor
                const medicines = await documentProcessor.extractMedicineInfo(extractedText);

                // Save extracted medicines
                for (const medicine of medicines) {
                    await connection.execute(
                        `INSERT INTO extracted_medicines 
                        (document_id, medicine_name, confidence_score) 
                        VALUES (?, ?, ?)`,
                        [documentId, medicine.medicine_name, medicine.confidence_score]
                    );
                }

                // Update document status
                await connection.execute(
                    `UPDATE medical_documents 
                     SET processed_status = 'completed', 
                         last_processed_at = CURRENT_TIMESTAMP 
                     WHERE id = ?`,
                    [documentId]
                );

                await connection.commit();

                res.status(200).json({
                    message: 'Document uploaded and processed successfully',
                    document: {
                        id: documentId,
                        filename: file.originalname,
                        extractedMedicines: medicines
                    }
                });
            } catch (error) {
                await connection.rollback();
                throw error;
            } finally {
                connection.release();
            }
        } catch (error) {
            console.error('Upload error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
            next(error);
        }
    }

    async getDocuments(req, res, next) {
        try {
            const profileId = req.query.profileId || req.user.profileId;
            const [documents] = await db.execute(
                `SELECT d.*, p.full_name as owner_name,
                    CASE 
                        WHEN d.profile_id = ? THEN 'admin'
                        WHEN fr.relationship_type IN ('parent', 'guardian') THEN 'write'
                        ELSE 'read'
                    END as access_level
                FROM medical_documents d
                LEFT JOIN profiles p ON d.profile_id = p.id
                LEFT JOIN family_relations fr ON 
                    (fr.parent_profile_id = ? AND fr.child_profile_id = d.profile_id)
                    OR (fr.child_profile_id = ? AND fr.parent_profile_id = d.profile_id)
                WHERE d.is_archived = false 
                    AND (d.profile_id = ? 
                    OR fr.id IS NOT NULL)
                ORDER BY d.created_at DESC`,
                [profileId, profileId, profileId, profileId]
            );
            res.json(documents);
        } catch (error) {
            next(error);
        }
    }

    async getDocument(req, res, next) {
        try {
            const { id } = req.params;
            const profileId = req.user.profileId;
            
            const [documents] = await db.execute(
                `SELECT d.*, p.full_name as owner_name,
                    CASE 
                        WHEN d.profile_id = ? THEN 'admin'
                        WHEN fr.relationship_type IN ('parent', 'guardian') THEN 'write'
                        ELSE 'read'
                    END as access_level
                FROM medical_documents d
                LEFT JOIN profiles p ON d.profile_id = p.id
                LEFT JOIN family_relations fr ON 
                    (fr.parent_profile_id = ? AND fr.child_profile_id = d.profile_id)
                    OR (fr.child_profile_id = ? AND fr.parent_profile_id = d.profile_id)
                WHERE d.id = ? AND d.is_archived = false
                    AND (d.profile_id = ? OR fr.id IS NOT NULL)`,
                [profileId, profileId, profileId, id, profileId]
            );

            if (!documents.length) {
                throw new DocumentProcessingError('Document not found or access denied');
            }

            res.json(documents[0]);
        } catch (error) {
            next(error);
        }
    }

    async viewDocument(req, res, next) {
        try {
            const { id } = req.params;
            
            const [documents] = await db.execute(
                `SELECT d.*, p.full_name as owner_name
                 FROM medical_documents d
                 LEFT JOIN profiles p ON d.profile_id = p.id
                 WHERE d.id = ?`,
                [id]
            );
    
            if (!documents.length) {
                return res.status(404).json({ 
                    status: 'error',
                    message: 'Document not found'
                });
            }
    
            const document = documents[0];
            
            // Normalize the file path
            const normalizedPath = document.file_path.replace(/\\/g, '/');
            const relativePath = normalizedPath.split('uploads/')[1];
            const absolutePath = path.join(__dirname, '../../uploads', relativePath);
    
            try {
                await fs.access(absolutePath);
            } catch (error) {
                console.error('File access error:', error);
                return res.status(404).json({
                    status: 'error',
                    message: 'File not found'
                });
            }
    
            // Set proper headers for PDF viewing
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
            res.setHeader('Content-Type', document.mime_type || 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename="${document.file_name}"`);
    
            // Read file and send as binary
            const file = await fs.readFile(absolutePath);
            res.end(file);
    
        } catch (error) {
            console.error('View document error:', error);
            next(error);
        }
    }


    async getDocumentWithExtractedData(req, res, next) {
        try {
            const { id } = req.params;
            const profileId = req.user.profileId;
    
            // Get document details
            const [documents] = await db.execute(
                `SELECT d.*, p.full_name as owner_name
                 FROM medical_documents d
                 LEFT JOIN profiles p ON d.profile_id = p.id
                 WHERE d.id = ? AND (d.profile_id = ? OR EXISTS (
                    SELECT 1 FROM family_relations fr 
                    WHERE (fr.parent_profile_id = ? AND fr.child_profile_id = d.profile_id)
                    OR (fr.child_profile_id = ? AND fr.parent_profile_id = d.profile_id)
                 ))`,
                [id, profileId, profileId, profileId]
            );
    
            if (!documents.length) {
                throw new DocumentProcessingError('Document not found or access denied');
            }
    
            // Get extracted medicines
            const [medicines] = await db.execute(
                `SELECT * FROM extracted_medicines WHERE document_id = ?`,
                [id]
            );
    
            res.json({
                document: documents[0],
                extractedData: {
                    medicines,
                    processed_status: documents[0].processed_status
                }
            });
        } catch (error) {
            next(error);
        }
    }
    
    async deleteDocument(req, res, next) {
        try {
            const { id } = req.params;
            const profileId = req.user.profileId;

            const [result] = await db.execute(
                `UPDATE medical_documents 
                 SET is_archived = true 
                 WHERE id = ? AND profile_id = ?`,
                [id, profileId]
            );

            if (result.affectedRows === 0) {
                throw new DocumentProcessingError('Document not found');
            }

            res.json({ message: 'Document deleted successfully' });
        } catch (error) {
            next(error);
        }
    }
    
    async getExtractedData(req, res, next) {
      try {
          const { id } = req.params;
          const profileId = req.user.profileId;

          // First verify document belongs to user
          const [documents] = await db.execute(
              `SELECT id FROM medical_documents 
               WHERE id = ? AND profile_id = ?`,
              [id, profileId]
          );

          if (documents.length === 0) {
              throw new DocumentProcessingError('Document not found');
          }

          // Get extracted medicines
          const [medicines] = await db.execute(
              `SELECT * FROM extracted_medicines 
               WHERE document_id = ?`,
              [id]
          );

          res.json(medicines);
      } catch (error) {
          next(error);
      }
  }

  async retryProcessing(req, res, next) {
        try {
            const { id } = req.params;
            const profileId = req.user.profileId;

            const connection = await db.getConnection();
            await connection.beginTransaction();

            try {
                // Verify document ownership and get file path
                const [documents] = await connection.execute(
                    `SELECT * FROM medical_documents 
                    WHERE id = ? AND profile_id = ?`,
                    [id, profileId]
                );

                if (documents.length === 0) {
                    throw new DocumentProcessingError('Document not found');
                }

                const document = documents[0];

                // Delete existing extracted medicines
                await connection.execute(
                    'DELETE FROM extracted_medicines WHERE document_id = ?',
                    [id]
                );

                // Use documentProcessor instead of ocrService
                const extractedText = await documentProcessor.processDocument(document.file_path);
                const medicines = await documentProcessor.extractMedicineInfo(extractedText);

                // Save newly extracted medicines
                for (const medicine of medicines) {
                    await connection.execute(
                        `INSERT INTO extracted_medicines 
                        (document_id, medicine_name, confidence_score) 
                        VALUES (?, ?, ?)`,
                        [id, medicine.medicine_name, medicine.confidence_score]
                    );
                }

                // Update document status
                await connection.execute(
                    `UPDATE medical_documents 
                    SET processed_status = 'completed', 
                        last_processed_at = CURRENT_TIMESTAMP 
                    WHERE id = ?`,
                    [id]
                );

                await connection.commit();

                res.status(200).json({
                    message: 'Document reprocessed successfully',
                    extractedData: {
                        medicines,
                        rawText: extractedText
                    }
                });
            } catch (error) {
                await connection.rollback();
                throw error;
            } finally {
                connection.release();
            }
        } catch (error) {
            next(error);
        }
    }

    async updateAccess(req, res, next) {
        try {
          const { id } = req.params;
          const { access_level } = req.body;
          const profileId = req.user.profileId;
      
          const [result] = await db.execute(
            `UPDATE medical_documents 
             SET access_level = ?
             WHERE id = ? AND profile_id = ?`,
            [access_level, id, profileId]
          );
      
          if (result.affectedRows === 0) {
            throw new DocumentProcessingError('Document not found or access denied');
          }
      
          res.json({ message: 'Document access updated successfully' });
        } catch (error) {
          next(error);
        }
      }
      
    
    async shareDocument(req, res, next) {
        try {
            const { id } = req.params;
            const { profileIds } = req.body;
            const profileId = req.user.profileId;
    
            // First verify document ownership
            const [documents] = await db.execute(
                `SELECT * FROM medical_documents 
                 WHERE id = ? AND profile_id = ?`,
                [id, profileId]
            );
    
            if (documents.length === 0) {
                throw new DocumentProcessingError('Document not found or access denied');
            }
    
            // Update document shared_with
            const sharedWith = JSON.stringify(profileIds);
            await db.execute(
                `UPDATE medical_documents 
                 SET shared_with = ?,
                     access_level = 'shared'
                 WHERE id = ?`,
                [sharedWith, id]
            );
    
            res.json({ message: 'Document shared successfully' });
        } catch (error) {
            next(error);
        }
    }
    
    async getFamilyDocuments(req, res, next) {
        try {
            const { profileId } = req.params;
            const userProfileId = req.user.profileId;
    
            const [documents] = await db.execute(
                `SELECT d.*, p.full_name as owner_name
                 FROM medical_documents d
                 JOIN profiles p ON d.profile_id = p.id
                 JOIN family_relations fr ON 
                    (fr.parent_profile_id = ? AND fr.child_profile_id = ?)
                    OR (fr.child_profile_id = ? AND fr.parent_profile_id = ?)
                 WHERE d.is_archived = false`,
                [userProfileId, profileId, userProfileId, profileId]
            );
    
            res.json(documents);
        } catch (error) {
            next(error);
        }
    }
    
    async getSharedDocuments(req, res, next) {
        try {
            const profileId = req.user.profileId;
    
            const [documents] = await db.execute(
                `SELECT d.*, p.full_name as owner_name
                 FROM medical_documents d
                 JOIN profiles p ON d.profile_id = p.id
                 WHERE d.is_archived = false
                 AND (
                    JSON_CONTAINS(d.shared_with, ?)
                    OR d.access_level = 'shared'
                 )`,
                [JSON.stringify(profileId)]
            );
    
            res.json(documents);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new DocumentController();