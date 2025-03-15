// server/controllers/documentController.js
const path = require('path');
const { DocumentProcessingError } = require('../middleware/errorHandler');
const db = require('../config/database');
const documentProcessor = require('../services/documentProcessor');
const fs = require('fs').promises;
const Document = require('../models/Document');

class DocumentController {
    async uploadDocument(req, res, next) {
        const connection = await db.getConnection();
        
        try {
            if (!req.file) {
                throw new DocumentProcessingError('No file uploaded');
            }
    
            const targetProfileId = parseInt(req.body.profileId);
            const ownerProfileId = req.user.profileId;
    
            if (!targetProfileId) {
                throw new DocumentProcessingError('Invalid profile ID');
            }
    
            await connection.beginTransaction();
    
            try {
                // Create document record with correct access_level ENUM value
                const [result] = await connection.execute(
                    `INSERT INTO medical_documents 
                    (profile_id, owner_profile_id, original_owner_id, file_name, 
                     file_path, file_type, file_size, mime_type, document_type, 
                     uploaded_by, access_level, processed_status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        targetProfileId,
                        ownerProfileId,
                        ownerProfileId,
                        req.file.originalname,
                        req.file.path,
                        path.extname(req.file.originalname),
                        req.file.size,
                        req.file.mimetype,
                        req.body.documentType || 'other',
                        ownerProfileId,
                        'family',  // Using valid ENUM value: 'private', 'family', or 'shared'
                        'pending'
                    ]
                );
    
                const documentId = result.insertId;
    
                await connection.commit();
    
                res.status(200).json({
                    message: 'Document uploaded successfully',
                    document: {
                        id: documentId,
                        filename: req.file.originalname,
                        status: 'pending'
                    }
                });
    
            } catch (error) {
                await connection.rollback();
                throw error;
            }
    
        } catch (error) {
            console.error('Upload error:', error);
            next(error);
        } finally {
            connection.release();
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

    async processDocument(req, res, next) {
        const connection = await db.getConnection();
        try {
            const { id } = req.params;
            console.log('Processing document:', id);
    
            // Get document
            const [documents] = await connection.execute(
                `SELECT * FROM medical_documents WHERE id = ?`,
                [id]
            );
    
            if (!documents.length) {
                throw new DocumentProcessingError('Document not found');
            }
    
            const document = documents[0];
            console.log('Found document:', document.file_name);
    
            // Process document and extract all data
            const processedData = await documentProcessor.processDocument(document.file_path, id);
            console.log('Document processed:', processedData?.success);
    
            // Update document status
            await connection.execute(
                `UPDATE medical_documents 
                 SET processed_status = 'completed',
                     ocr_text = ?,
                     metadata = ?,
                     last_processed_at = CURRENT_TIMESTAMP
                 WHERE id = ?`,
                [
                    processedData.text,
                    JSON.stringify({
                        vitals: processedData.vitals,
                        medicines: processedData.medicines,
                        patientInfo: processedData.patientInfo,
                        extractedAt: new Date().toISOString()
                    }),
                    id
                ]
            );
    
            await connection.commit();
    
            res.json({
                success: true,
                data: {
                    vitals: processedData.vitals,
                    medicines: processedData.medicines,
                    status: 'completed'
                }
            });
    
        } catch (error) {
            console.error('Document processing error:', error);
            await connection.rollback();
            next(error);
        } finally {
            connection.release();
        }
    }

    async getDocuments(req, res, next) {
        try {
            const profileId = req.query.profileId || req.user.profileId;
            const [documents] = await db.execute(
                `SELECT d.*, p.full_name as owner_name,
                    'write' as access_level  -- Simplified access level
                 FROM medical_documents d
                 LEFT JOIN profiles p ON d.profile_id = p.id
                 WHERE d.is_archived = false 
                    AND (d.profile_id = ? OR d.owner_profile_id = ?)
                 ORDER BY d.created_at DESC`,
                [profileId, req.user.profileId]
            );
            res.json(documents);
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

    async processDocument(req, res, next) {
        const connection = await db.getConnection();
        try {
            const { id } = req.params;
            console.log('Starting document processing for ID:', id);
    
            // Check if document exists and get its details
            const [documents] = await connection.execute(
                `SELECT * FROM medical_documents WHERE id = ?`,
                [id]
            );
    
            if (!documents.length) {
                throw new DocumentProcessingError('Document not found');
            }
    
            const document = documents[0];
            console.log('Processing document:', document.file_name);
    
            // Update status to processing
            await connection.execute(
                `UPDATE medical_documents 
                 SET processed_status = 'processing',
                     processing_attempts = processing_attempts + 1
                 WHERE id = ?`,
                [id]
            );
    
            // Extract text using Tesseract
            const extractedText = await documentProcessor.processDocument(document.file_path);
            console.log('Extracted text:', extractedText); // Debug log
    
            // Extract medicines using the reference data
            const medicines = await documentProcessor.extractMedicineInfo(extractedText);
            console.log('Extracted medicines:', medicines);
    
            // Save medicines to database
            if (medicines && medicines.length > 0) {
                for (const medicine of medicines) {
                    await connection.execute(
                        `INSERT INTO extracted_medicines 
                         (document_id, medicine_name, dosage, frequency, duration, instructions, generic_name, medicine_category)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            id,
                            medicine.medicine_name,
                            medicine.dosage,
                            medicine.frequency,
                            medicine.duration,
                            medicine.instructions,
                            medicine.generic_name,
                            medicine.category
                        ]
                    );
                }
            }
    
            // Update document status
            await connection.execute(
                `UPDATE medical_documents 
                 SET processed_status = 'completed',
                     ocr_text = ?,
                     metadata = ?,
                     last_processed_at = CURRENT_TIMESTAMP
                 WHERE id = ?`,
                [
                    extractedText,
                    JSON.stringify({
                        medicines,
                        extractedAt: new Date().toISOString()
                    }),
                    id
                ]
            );
    
            await connection.commit();
    
            res.json({
                success: true,
                data: {
                    medicines,
                    raw_text: extractedText
                }
            });
    
        } catch (error) {
            console.error('Document processing error:', error);
            await connection.rollback();
            
            // Update document status to failed
            try {
                await connection.execute(
                    `UPDATE medical_documents 
                     SET processed_status = 'failed',
                     processing_error = ?
                     WHERE id = ?`,
                    [error.message, id]
                );
                await connection.commit();
            } catch (updateError) {
                console.error('Error updating document status:', updateError);
            }
    
            next(error);
        } finally {
            connection.release();
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

    async getProfileDocuments(req, res, next) {
        const connection = await db.getConnection();
        try {
            const { profileId } = req.params;
            
            // Get documents with their extracted data
            const [documents] = await connection.execute(
                `SELECT 
                    md.id,
                    md.file_name,
                    md.processed_status,
                    md.created_at,
                    md.metadata,
                    md.ocr_text,
                    p.blood_pressure,
                    p.blood_glucose,
                    p.hba1c
                FROM medical_documents md
                JOIN profiles p ON md.profile_id = p.id
                WHERE md.profile_id = ? 
                AND md.processed_status = 'completed'
                AND md.is_archived = false
                ORDER BY md.created_at DESC`,
                [profileId]
            );
    
            // Format the response
            const formattedDocuments = documents.map(doc => {
                let metadata = {};
                try {
                    metadata = doc.metadata ? JSON.parse(doc.metadata) : {};
                } catch (err) {
                    console.error('Error parsing metadata:', err);
                }
    
                return {
                    id: doc.id,
                    fileName: doc.file_name,
                    processedStatus: doc.processed_status,
                    createdAt: doc.created_at,
                    vitals: {
                        blood_pressure: doc.blood_pressure || 'N/A',
                        blood_glucose: doc.blood_glucose || 'N/A',
                        hba1c: doc.hba1c || 'N/A'
                    },
                    medicines: metadata.medicines || [],
                    patientInfo: metadata.patientInfo || {}
                };
            });
    
            res.json({
                success: true,
                documents: formattedDocuments
            });
    
        } catch (error) {
            console.error('Error in getProfileDocuments:', error);
            next(error);
        } finally {
            connection.release();
        }
    }
    
    async deleteDocument(req, res, next) {
        try {
            const { id } = req.params;
            const profileId = req.user.profileId;
    
            const [result] = await db.execute(
                `UPDATE medical_documents 
                 SET is_archived = true 
                 WHERE id = ? AND (profile_id = ? OR owner_profile_id = ?)`,
                [id, profileId, profileId]
            );
    
            if (result.affectedRows === 0) {
                throw new DocumentProcessingError('Document not found or permission denied');
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
      
          // Add more detailed logging
          console.log(`Attempting to fetch extracted data for document ${id}, profile ${profileId}`);
      
          // Verify document ownership and processing status
          const [documents] = await db.execute(
            `SELECT * FROM medical_documents 
             WHERE id = ? AND profile_id = ? 
             AND processed_status = 'completed'`,
            [id, profileId]
          );
      
          if (documents.length === 0) {
            console.log('Document not found or not processed');
            return res.status(404).json({ 
              message: 'Document not found or not processed',
              status: 'error'
            });
          }
      
          // Fetch extracted medicines with more error handling
          const [medicines] = await db.execute(
            `SELECT * FROM extracted_medicines 
             WHERE document_id = ?`,
            [id]
          );
      
          console.log('Extracted medicines:', medicines);
      
          res.json({
            medicines: medicines || [],
            status: 'success'
          });
      
        } catch (error) {
          console.error('Detailed extraction error:', error);
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
    
            const [documents] = await db.execute(`
                SELECT DISTINCT d.*, 
                       p.full_name as owner_name,
                       CASE 
                         WHEN d.profile_id = ? THEN 'admin'
                         WHEN fr.relationship_type IN ('parent', 'guardian') THEN 'write'
                         ELSE 'read'
                       END as access_level
                FROM medical_documents d
                JOIN profiles p ON d.profile_id = p.id
                LEFT JOIN family_relations fr ON 
                    (fr.parent_profile_id = ? AND fr.child_profile_id = d.profile_id)
                    OR (fr.child_profile_id = ? AND fr.parent_profile_id = d.profile_id)
                WHERE d.is_archived = false
                AND (
                    JSON_CONTAINS(COALESCE(d.shared_with, '[]'), CAST(? AS JSON))
                    OR d.access_level = 'shared'
                    OR fr.id IS NOT NULL
                )
                AND d.profile_id != ?
                ORDER BY d.created_at DESC`,
                [profileId, profileId, profileId, profileId, profileId]
            );
    
            // Format the response
            const formattedDocuments = documents.map(doc => ({
                ...doc,
                created_at: new Date(doc.created_at).toISOString(),
                updated_at: new Date(doc.updated_at).toISOString(),
                last_processed_at: doc.last_processed_at ? new Date(doc.last_processed_at).toISOString() : null
            }));
    
            res.json(formattedDocuments);
        } catch (error) {
            console.error('Error in getSharedDocuments:', error);
            next(error);
        }
    }

    async extractMedicineInfo(text, documentId) {
        try {
          const medicines = [];
          const prescriptionMatch = text.match(/PRESCRIPTION:[\s\S]*?(?=VITALS:|$)/i);
          if (prescriptionMatch) {
            const prescriptionText = prescriptionMatch[0];
            const medicationEntries = prescriptionText.split(/\d+\./g).filter(entry => entry.trim());
      
            for (const entry of medicationEntries) {
              // Enhanced medicine extraction logic using regex
              const medicineMatch = entry.match(/([A-Za-z\s]+(?:\s*\([A-Za-z\s]+\))?)\s*(\d+(?:\.\d+)?\s*(?:mg|g|mcg|IU|units\/mL))/i);
              if (medicineMatch) {
                const medicineName = medicineMatch[1].trim();
                const dosage = medicineMatch[2];
      
                // Match with reference data
                const medicineInfo = this.findMedicineNameInLine(medicineName);
                if (medicineInfo) {
                  medicines.push({
                    medicine_name: medicineInfo.name,
                    generic_name: medicineInfo.genericName,
                    category: medicineInfo.category,
                    dosage: dosage,
                    frequency: this.extractFrequency(entry),
                    duration: this.extractDuration(entry),
                    instructions: this.extractInstructions(entry),
                    confidence_score: medicineInfo.confidence
                  });
                }
              }
            }
          }
          return medicines;
        } catch (error) {
          console.error('Medicine extraction error:', error);
          throw new Error('Failed to extract medicines');
        }
      }
}

module.exports = new DocumentController();