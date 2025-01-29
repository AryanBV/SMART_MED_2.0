// server/controllers/documentController.js
const path = require('path');
const { DocumentProcessingError } = require('../middleware/errorHandler');
const db = require('../config/database');
const ocrService = require('../services/ocr');

class DocumentController {
    async uploadDocument(req, res, next) {
        try {
            if (!req.file) {
                throw new DocumentProcessingError('No file uploaded');
            }

            const { file } = req;
            const profileId = req.user.profileId; // From auth middleware

            // Start transaction
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
                        'other' // default type
                    ]
                );

                const documentId = result.insertId;

                // Extract text using OCR
                const extractedText = await ocrService.extractText(file.path);
                
                // Extract medicines from text
                const medicines = await ocrService.extractMedicines(extractedText);

                // Save extracted medicines
                for (const medicine of medicines) {
                    await connection.execute(
                        `INSERT INTO extracted_medicines 
                        (document_id, medicine_name, confidence_score) 
                        VALUES (?, ?, ?)`,
                        [documentId, medicine.raw_text, medicine.confidence_score]
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
            next(error);
        }
    }

    async getDocuments(req, res, next) {
        try {
            const profileId = req.user.profileId;
            
            const [documents] = await db.execute(
                `SELECT * FROM medical_documents 
                 WHERE profile_id = ? AND is_archived = false 
                 ORDER BY created_at DESC`,
                [profileId]
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
                `SELECT * FROM medical_documents 
                 WHERE id = ? AND profile_id = ?`,
                [id, profileId]
            );

            if (documents.length === 0) {
                throw new DocumentProcessingError('Document not found');
            }

            res.json(documents[0]);
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

          // Start transaction
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

              // Re-extract text using OCR
              const extractedText = await ocrService.extractText(document.file_path);
              
              // Re-extract medicines from text
              const medicines = await ocrService.extractMedicines(extractedText);

              // Save newly extracted medicines
              for (const medicine of medicines) {
                  await connection.execute(
                      `INSERT INTO extracted_medicines 
                      (document_id, medicine_name, confidence_score) 
                      VALUES (?, ?, ?)`,
                      [id, medicine.raw_text, medicine.confidence_score]
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
}

module.exports = new DocumentController();