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

    async extractMedicines(text, medicineReference) {
        try {
          const medicines = [];
          const lines = text.split('\n');
          let currentMedicine = null;
      
          for (const line of lines) {
            // Look for medicine names from reference
            const medicineName = this.findMedicineNameInLine(line, medicineReference);
            if (medicineName) {
              if (currentMedicine) {
                medicines.push(currentMedicine);
              }
              currentMedicine = {
                medicine_name: medicineName.name,
                generic_name: medicineName.genericName,
                category: medicineName.category,
                dosage: this.extractDosage(line),
                frequency: this.extractFrequency(line),
                duration: this.extractDuration(line),
                instructions: [],
                confidence_score: medicineName.confidence
              };
            } else if (currentMedicine && this.isInstructionLine(line)) {
              currentMedicine.instructions.push(line.trim());
            }
          }
      
          if (currentMedicine) {
            medicines.push(currentMedicine);
          }
      
          return medicines;
        } catch (error) {
          console.error('Medicine Extraction Error:', error);
          throw new DocumentProcessingError('Failed to extract medicines');
        }
      }
      
      // Helper methods for extraction
      findMedicineNameInLine(line, medicineReference) {
        // Implement fuzzy matching using the medicine reference dataset
      }
      
      extractDosage(line) {
        const dosagePattern = /\b\d+(?:\.\d+)?\s*(?:mg|g|ml|mcg)\b/i;
        const match = line.match(dosagePattern);
        return match ? match[0] : null;
      }
      
      extractFrequency(line) {
        const frequencyPatterns = [
          { pattern: /\b(?:once|1\s+time)\s+(?:daily|a\s+day)\b/i, value: "Once daily" },
          { pattern: /\b(?:twice|2\s+times)\s+(?:daily|a\s+day)\b/i, value: "Twice daily" },
          { pattern: /\b(?:thrice|3\s+times)\s+(?:daily|a\s+day)\b/i, value: "Thrice daily" },
          { pattern: /\b(?:every|after)\s+(?:meal|breakfast|lunch|dinner)\b/i, value: matched => `After ${matched[2]}` },
          { pattern: /\bevery\s+(\d+)\s+hours?\b/i, value: matched => `Every ${matched[1]} hours` }
        ];
      
        for (const { pattern, value } of frequencyPatterns) {
          const match = line.match(pattern);
          if (match) {
            return typeof value === 'function' ? value(match) : value;
          }
        }
        return null;
      }
      
      extractDuration(line) {
        const durationPatterns = [
          { pattern: /\bfor\s+(\d+)\s+(?:days?|weeks?|months?)\b/i, 
            value: matched => `${matched[1]} ${matched[2]}` },
          { pattern: /\b(\d+)\s*(?:days?|weeks?|months?)\s+course\b/i,
            value: matched => `${matched[1]} ${matched[2]}` },
          { pattern: /\bcontinue\s+for\s+(\d+)\s+(?:days?|weeks?|months?)\b/i,
            value: matched => `${matched[1]} ${matched[2]}` }
        ];
      
        for (const { pattern, value } of durationPatterns) {
          const match = line.match(pattern);
          if (match) {
            return typeof value === 'function' ? value(match) : value;
          }
        }
        return null;
      }
      
      isInstructionLine(line) {
        const instructionKeywords = [
          /take|consume|use|apply|inject|inhale/i,
          /before|after|with|without/i,
          /meal|food|water|milk/i,
          /morning|afternoon|evening|night/i,
          /empty stomach|full stomach/i
        ];
      
        return instructionKeywords.some(pattern => pattern.test(line));
      }
      
      findMedicineNameInLine(line, medicineReference) {
        for (const medicine of medicineReference) {
          // Check for exact brand name match
          if (line.toLowerCase().includes(medicine.brandName.toLowerCase())) {
            return {
              name: medicine.brandName,
              genericName: medicine.genericName,
              category: medicine.category,
              confidence: 1.0
            };
          }
          
          // Check for exact generic name match
          if (line.toLowerCase().includes(medicine.genericName.toLowerCase())) {
            return {
              name: medicine.genericName,
              genericName: medicine.genericName,
              category: medicine.category,
              confidence: 0.9
            };
          }
      
          // Check alternative brands
          if (medicine.alternativeBrands) {
            for (const altBrand of medicine.alternativeBrands) {
              if (line.toLowerCase().includes(altBrand.toLowerCase())) {
                return {
                  name: altBrand,
                  genericName: medicine.genericName,
                  category: medicine.category,
                  confidence: 0.8
                };
              }
            }
          }
        }
        return null;
    }
        
}

module.exports = new OCRService();