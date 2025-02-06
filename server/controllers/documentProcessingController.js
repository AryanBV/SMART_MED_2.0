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

        await connection.beginTransaction();

        // Get document
        const [documents] = await connection.execute(
            `SELECT md.*, p.full_name as owner_name 
             FROM medical_documents md
             JOIN profiles p ON md.profile_id = p.id
             WHERE md.id = ?`,
            [id]
        );

        if (!documents.length) {
            throw new DocumentProcessingError('Document not found');
        }

        const document = documents[0];
        
        // Process document and extract all data
        const extractedText = await documentProcessor.processDocument(document.file_path, id);
        const medicines = await documentProcessor.extractMedicineInfo(extractedText, id);
        const vitals = await documentProcessor.extractVitals(extractedText);
        const patientInfo = await documentProcessor.extractPatientInfo(extractedText);
        const appointmentInfo = await documentProcessor.extractAppointmentInfo(extractedText);

        // Save vitals to profile
        if (vitals) {
            await connection.execute(
                `UPDATE profiles 
                 SET blood_pressure = ?,
                     blood_glucose = ?,
                     hba1c = ?,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?`,
                [vitals.blood_pressure, vitals.blood_glucose, vitals.hba1c, profileId]
            );
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
                    patientInfo,
                    vitals,
                    appointmentInfo,
                    medicineCount: medicines.length
                }),
                id
            ]
        );

        await connection.commit();

        res.json({
            success: true,
            data: {
                patientInfo,
                vitals,
                medicines,
                appointmentInfo
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