// server/services/fileStorage.js
const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');
const config = require('../config/database');

class FileStorageService {
  constructor() {
    this.pool = mysql.createPool(config);
  }

  async saveDocument(file, profileId, documentType) {
    const connection = await this.pool.getConnection();
    try {
      // Start transaction
      await connection.beginTransaction();

      const {
        originalname,
        filename,
        path: filePath,
        size,
        mimetype
      } = file;

      // Insert document record
      const [result] = await connection.execute(
        `INSERT INTO medical_documents 
        (profile_id, file_name, file_path, file_type, file_size, mime_type, document_type) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          profileId,
          originalname,
          filePath,
          path.extname(originalname),
          size,
          mimetype,
          documentType
        ]
      );

      // If it's an image, create a thumbnail
      if (mimetype.startsWith('image/')) {
        const thumbnailPath = path.join(
          path.dirname(filePath),
          `thumb_${filename}`
        );
        
        await sharp(filePath)
          .resize(200, 200, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .toFile(thumbnailPath);
      }

      await connection.commit();
      return result.insertId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async getDocumentsByProfile(profileId) {
    const [rows] = await this.pool.execute(
      `SELECT * FROM medical_documents 
       WHERE profile_id = ? AND is_archived = false 
       ORDER BY upload_date DESC`,
      [profileId]
    );
    return rows;
  }

  async updateDocumentStatus(documentId, status, attempts = null) {
    await this.pool.execute(
      `UPDATE medical_documents 
       SET processed_status = ?, 
           processing_attempts = COALESCE(?, processing_attempts + 1),
           last_processed_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [status, attempts, documentId]
    );
  }

  async saveExtractedMedicines(documentId, medicines) {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();

      for (const medicine of medicines) {
        await connection.execute(
          `INSERT INTO extracted_medicines 
          (document_id, medicine_name, dosage, frequency, duration, instructions, confidence_score) 
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            documentId,
            medicine.name,
            medicine.dosage || null,
            medicine.frequency || null,
            medicine.duration || null,
            medicine.instructions || null,
            medicine.confidence || 1.0
          ]
        );
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = new FileStorageService();