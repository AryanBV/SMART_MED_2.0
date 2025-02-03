// Path: /server/services/documentProcessor.js

const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { DocumentProcessingError } = require('../middleware/errorHandler');
const pdfjsLib = require('./pdfConfig'); // Updated import
const medicineReferenceData = require('../../database/medicine-dataset/medicines.json');

class DocumentProcessor {
  constructor() {
    this.worker = null;
    this.medicineReference = medicineReferenceData.medicines;
  }

  async initialize() {
    try {
        if (!this.worker) {
            console.log('Initializing Tesseract worker');
            this.worker = await Tesseract.createWorker({
                logger: progress => {
                    console.log('Tesseract progress:', progress);
                },
                loadAuto: true // Add this line
            });
            await this.worker.loadLanguage('eng');
            await this.worker.initialize('eng');
            console.log('Tesseract worker initialized successfully');
        }
    } catch (error) {
        console.error('Tesseract initialization error:', error);
        throw new DocumentProcessingError('Failed to initialize OCR processor');
    }
  }

  async processDocument(filePath) {
    try {
      console.log('Processing document:', filePath);
      const ext = path.extname(filePath).toLowerCase();
      
      // Initialize PDF.js worker
      if (ext === '.pdf') {
        console.log('Setting up PDF.js worker');
        pdfjsLib.GlobalWorkerOptions.workerSrc = path.resolve(require.resolve('pdfjs-dist/build/pdf.worker.js'));
      }
      
      if (ext === '.pdf') {
        console.log('Processing PDF document');
        return await this.processPDF(filePath);
      } else {
        console.log('Processing image document');
        return await this.processImage(filePath);
      }
    } catch (error) {
      console.error('Document processing error:', error);
      throw new DocumentProcessingError(`Failed to process document: ${error.message}`);
    }
  }

  async processImage(filePath) {
    try {
      console.log('Processing image:', filePath);
      const optimizedPath = path.join(
        path.dirname(filePath),
        `optimized-${path.basename(filePath)}`
      );

      console.log('Optimizing image...');
      await sharp(filePath)
        .greyscale()
        .normalize()
        .resize(2000, 2000, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .toFile(optimizedPath);

      console.log('Image optimized, performing OCR...');
      await this.initialize();
      const { data: { text } } = await this.worker.recognize(optimizedPath);
      
      console.log('OCR completed, cleaning up...');
      await fs.unlink(optimizedPath);

      return text;
    } catch (error) {
      console.error('Image processing error:', error);
      throw new DocumentProcessingError(`Failed to process image: ${error.message}`);
    }
  }

  async processPDF(pdfPath) {
    try {
      console.log('Reading PDF file:', pdfPath);
      const dataBuffer = await fs.readFile(pdfPath);
      
      console.log('Loading PDF document');
      const doc = await pdfjsLib.getDocument({data: dataBuffer}).promise;
      console.log(`PDF loaded successfully. Pages: ${doc.numPages}`);
      
      let fullText = '';
      
      for (let i = 1; i <= doc.numPages; i++) {
        console.log(`Processing page ${i}/${doc.numPages}`);
        const page = await doc.getPage(i);
        const content = await page.getTextContent();
        const text = content.items.map(item => item.str).join(' ');
        fullText += text + '\n';
      }

      console.log('PDF text extraction completed');
      return fullText;
    } catch (error) {
      console.error('PDF processing error:', error);
      throw new DocumentProcessingError(`Failed to process PDF: ${error.message}`);
    }
  }

  async extractMedicineInfo(text) {
    try {
      console.log('Starting medicine extraction from text');
      const medicines = [];
      const lines = text.split('\n');
      let currentMedicine = null;
  
      for (const line of lines) {
        const medicineName = this.findMedicineNameInLine(line);
        if (medicineName) {
          console.log('Found medicine:', medicineName.name);
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
  
      console.log(`Extraction completed. Found ${medicines.length} medicines`);
      return medicines;
    } catch (error) {
      console.error('Medicine extraction error:', error);
      throw new DocumentProcessingError('Failed to extract medicines');
    }
  }

  findMedicineNameInLine(line) {
    for (const medicine of this.medicineReference) {
      // Brand name match
      if (line.toLowerCase().includes(medicine.brandName.toLowerCase())) {
        return {
          name: medicine.brandName,
          genericName: medicine.genericName,
          category: medicine.category,
          confidence: 1.0
        };
      }
      
      // Generic name match
      if (line.toLowerCase().includes(medicine.genericName.toLowerCase())) {
        return {
          name: medicine.genericName,
          genericName: medicine.genericName,
          category: medicine.category,
          confidence: 0.9
        };
      }

      // Alternative brands match
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

  async terminate() {
    try {
      if (this.worker) {
        console.log('Terminating Tesseract worker');
        await this.worker.terminate();
        this.worker = null;
        console.log('Tesseract worker terminated successfully');
      }
    } catch (error) {
      console.error('Error terminating worker:', error);
    }
  }

  async cleanup() {
    try {
      const tempDir = path.join(__dirname, '../../uploads/temp');
      console.log('Cleaning up temp directory:', tempDir);
      const files = await fs.readdir(tempDir);
      
      for (const file of files) {
        await fs.unlink(path.join(tempDir, file));
      }
      console.log('Cleanup completed successfully');
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}

module.exports = new DocumentProcessor();