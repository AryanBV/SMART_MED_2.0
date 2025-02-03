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
      const profileId = req.user.profileId;

      // Verify document access
      const [documents] = await connection.execute(
        `SELECT * FROM medical_documents 
         WHERE id = ? AND (profile_id = ? OR EXISTS (
           SELECT 1 FROM family_relations 
           WHERE (parent_profile_id = ? AND child_profile_id = profile_id)
           OR (child_profile_id = ? AND parent_profile_id = profile_id)
         ))`,
        [id, profileId, profileId, profileId]
      );

      if (!documents.length) {
        throw new DocumentProcessingError('Document not found or access denied');
      }

      const document = documents[0];

      await connection.beginTransaction();

      // Update processing status
      await connection.execute(
        `UPDATE medical_documents 
         SET processed_status = 'processing', 
             processing_attempts = processing_attempts + 1,
             last_processed_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [id]
      );

      // Process document
      const extractedText = await documentProcessor.processImage(document.file_path);
      const medicines = await documentProcessor.extractMedicineInfo(extractedText);

      // Clear existing extracted medicines
      await connection.execute(
        'DELETE FROM extracted_medicines WHERE document_id = ?',
        [id]
      );

      // Save extracted medicines
      for (const medicine of medicines) {
        await connection.execute(
          `INSERT INTO extracted_medicines 
           (document_id, medicine_name, confidence_score, raw_text) 
           VALUES (?, ?, ?, ?)`,
          [id, medicine.medicine_name, medicine.confidence_score, medicine.raw_text]
        );
      }

      // Update processing status
      await connection.execute(
        `UPDATE medical_documents 
         SET processed_status = 'completed', 
             last_processed_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [id]
      );

      await connection.commit();

      res.json({
        message: 'Document processed successfully',
        extractedData: {
          medicines,
          rawText: extractedText
        }
      });
    } catch (error) {
      await connection.rollback();
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