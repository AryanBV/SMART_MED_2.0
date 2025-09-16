// server/services/fileStorage.js
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');
const { supabase } = require('../config/database');

class FileStorageService {
  constructor() {
    // Initialize with Supabase client
  }

  async saveDocument(file, profileId, documentType) {
    try {
      const {
        originalname,
        filename,
        path: filePath,
        size,
        mimetype
      } = file;

      // Insert document record
      const { data, error } = await supabase
        .from('medical_documents')
        .insert({
          profile_id: profileId,
          file_name: originalname,
          file_path: filePath,
          file_type: path.extname(originalname),
          file_size: size,
          mime_type: mimetype,
          document_type: documentType
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

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

      return data.id;
    } catch (error) {
      throw error;
    }
  }

  async getDocumentsByProfile(profileId) {
    const { data, error } = await supabase
      .from('medical_documents')
      .select('*')
      .eq('profile_id', profileId)
      .eq('is_archived', false)
      .order('upload_date', { ascending: false });

    if (error) {
      throw error;
    }

    return data;
  }

  async updateDocumentStatus(documentId, status, attempts = null) {
    const updateData = {
      processed_status: status,
      last_processed_at: new Date().toISOString()
    };

    if (attempts !== null) {
      updateData.processing_attempts = attempts;
    }

    const { error } = await supabase
      .from('medical_documents')
      .update(updateData)
      .eq('id', documentId);

    if (error) {
      throw error;
    }
  }

  async saveExtractedMedicines(documentId, medicines) {
    try {
      const medicineData = medicines.map(medicine => ({
        document_id: documentId,
        medicine_name: medicine.name,
        dosage: medicine.dosage || null,
        frequency: medicine.frequency || null,
        duration: medicine.duration || null,
        instructions: medicine.instructions || null,
        confidence_score: medicine.confidence || 1.0
      }));

      const { error } = await supabase
        .from('extracted_medicines')
        .insert(medicineData);

      if (error) {
        throw error;
      }
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new FileStorageService();