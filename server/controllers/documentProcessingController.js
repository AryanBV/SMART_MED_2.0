// Path: /server/controllers/documentProcessingController.js

const documentProcessor = require('../services/documentProcessor');
// const documentStorage = require('../services/documentStorage');
const { DocumentProcessingError } = require('../middleware/errorHandler');
const db = require('../config/database');
const fs = require('fs').promises;  // Add this at the top
// const path = require('path'); 

class DocumentProcessingController {
  async processDocument(req, res, next) {
    const connection = await db.getConnection();
    try {
        const { id } = req.params;
        console.log('Starting document processing for ID:', id);

        await connection.beginTransaction();

        // Get document info and profile
        const [documents] = await connection.execute(
            `SELECT md.*, p.id as profile_id 
             FROM medical_documents md
             JOIN profiles p ON md.profile_id = p.id
             WHERE md.id = ?`,
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
                 processing_attempts = processing_attempts + 1,
                 last_processed_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [id]
        );

        // Extract text and data
        const extractedText = await documentProcessor.processDocument(document.file_path);
        const vitals = await documentProcessor.extractVitals(extractedText);
        const medicines = await documentProcessor.extractMedicineInfo(extractedText);

        console.log('Extracted data:', {
            vitalsFound: !!vitals,
            medicinesFound: medicines.length
        });

        // Update profile with vitals if found
        if (vitals) {
            await connection.execute(
                `UPDATE profiles 
                 SET blood_pressure = ?,
                     blood_glucose = ?,
                     hba1c = ?,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?`,
                [vitals.blood_pressure, vitals.blood_glucose, vitals.hba1c, document.profile_id]
            );
        }

        // Save medicines
        if (medicines.length > 0) {
            for (const medicine of medicines) {
                await connection.execute(
                    `INSERT INTO extracted_medicines 
                     (document_id, medicine_name, generic_name, medicine_category,
                      dosage, frequency, duration, instructions, confidence_score)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        id,
                        medicine.medicine_name,
                        medicine.generic_name,
                        medicine.medicine_category,
                        medicine.dosage,
                        medicine.frequency,
                        medicine.duration,
                        medicine.instructions,
                        medicine.confidence_score
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
                    vitals,
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
                vitals,
                medicines,
                rawText: extractedText
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

  async testOCR(req, res, next) {
    try {
      const { file } = req;
      if (!file) {
        throw new DocumentProcessingError('No file uploaded');
      }

      // Process the file
      const extractedText = await documentProcessor.processDocument(file.path);
      
      // Extract medicines
      const medicines = await documentProcessor.extractMedicineInfo(extractedText);

      res.json({
        success: true,
        extractedData: {
          medicines,
          rawText: extractedText
        }
      });

    } catch (error) {
      console.error('OCR Test Error:', error);
      next(new DocumentProcessingError(error.message));
    } finally {
      // Clean up uploaded file if it exists
      if (req.file?.path) {
        try {
          await fs.unlink(req.file.path);
        } catch (err) {
          console.error('Error deleting file:', err);
        }
      }
    }
  }
}

module.exports = new DocumentProcessingController();