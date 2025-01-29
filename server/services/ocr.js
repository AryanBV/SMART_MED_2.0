// server/services/ocr.js
const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { DocumentProcessingError } = require('../middleware/errorHandler');

class OCRService {
    async extractText(filePath) {
        try {
            // Get file extension
            const ext = path.extname(filePath).toLowerCase();
            let processedPath = filePath;

            // If image, preprocess with sharp
            if (['.jpg', '.jpeg', '.png'].includes(ext)) {
                processedPath = `${filePath}_processed.png`;
                await sharp(filePath)
                    .grayscale() // Convert to grayscale
                    .normalize() // Normalize the image
                    .sharpen() // Sharpen for better text recognition
                    .toFile(processedPath);
            }

            // Perform OCR
            const result = await Tesseract.recognize(processedPath, 'eng', {
                logger: info => console.log(info)
            });

            // Clean up processed file if it exists
            if (processedPath !== filePath) {
                await fs.unlink(processedPath);
            }

            return result.data.text;
        } catch (error) {
            console.error('OCR Error:', error);
            throw new DocumentProcessingError('Failed to extract text from document');
        }
    }

    async extractMedicines(text) {
        try {
            // Simple medicine extraction logic
            // In a real app, you'd want to use a more sophisticated approach
            const medicinePatterns = [
                /\b(?:tablet|tab\.?|tabs\.?)\b/i,
                /\b(?:capsule|cap\.?|caps\.?)\b/i,
                /\b(?:syrup|syr\.?)\b/i,
                /\b(?:injection|inj\.?)\b/i,
                /\b(?:mg|ml|g)\b/i,
            ];

            const lines = text.split('\n');
            const medicines = [];

            for (const line of lines) {
                if (medicinePatterns.some(pattern => pattern.test(line))) {
                    medicines.push({
                        raw_text: line.trim(),
                        confidence_score: 0.8 // placeholder score
                    });
                }
            }

            return medicines;
        } catch (error) {
            console.error('Medicine Extraction Error:', error);
            throw new DocumentProcessingError('Failed to extract medicines from text');
        }
    }
}

module.exports = new OCRService();