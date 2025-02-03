// Path: /server/services/documentStorage.js

const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const { DocumentProcessingError } = require('../middleware/errorHandler');

class DocumentStorage {
  constructor() {
    this.baseDir = path.join(__dirname, '../../uploads');
    this.documentsDir = path.join(this.baseDir, 'documents');
    this.tempDir = path.join(this.baseDir, 'temp');
    this.thumbnailsDir = path.join(this.baseDir, 'thumbnails');
    this.initializeDirectories();
  }

  async initializeDirectories() {
    const dirs = [this.baseDir, this.documentsDir, this.tempDir, this.thumbnailsDir];
    for (const dir of dirs) {
      try {
        await fs.access(dir);
      } catch {
        await fs.mkdir(dir, { recursive: true });
      }
    }
  }

  async storeDocument(file, profileId) {
    try {
      const uniqueId = uuidv4();
      const ext = path.extname(file.originalname);
      const fileName = `${uniqueId}${ext}`;
      const filePath = path.join(this.documentsDir, fileName);
      
      // Move file from temp location to permanent storage
      await fs.rename(file.path, filePath);
      
      // Generate thumbnail for images
      if (file.mimetype.startsWith('image/')) {
        await this.generateThumbnail(filePath, fileName);
      }

      return {
        fileName,
        filePath,
        fileType: ext,
        mimeType: file.mimetype,
        size: file.size
      };
    } catch (error) {
      throw new DocumentProcessingError(`Failed to store document: ${error.message}`);
    }
  }

  async generateThumbnail(filePath, fileName) {
    const thumbnailPath = path.join(this.thumbnailsDir, `thumb_${fileName}`);
    await sharp(filePath)
      .resize(200, 200, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .toFile(thumbnailPath);
    return thumbnailPath;
  }

  async deleteDocument(fileName) {
    try {
      const filePath = path.join(this.documentsDir, fileName);
      const thumbnailPath = path.join(this.thumbnailsDir, `thumb_${fileName}`);
      
      await fs.unlink(filePath);
      
      try {
        await fs.unlink(thumbnailPath);
      } catch {
        // Ignore if thumbnail doesn't exist
      }
    } catch (error) {
      throw new DocumentProcessingError(`Failed to delete document: ${error.message}`);
    }
  }

  getFilePath(fileName) {
    return path.join(this.documentsDir, fileName);
  }

  getThumbnailPath(fileName) {
    return path.join(this.thumbnailsDir, `thumb_${fileName}`);
  }
}

module.exports = new DocumentStorage();