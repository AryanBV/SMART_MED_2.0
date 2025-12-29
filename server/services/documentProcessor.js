// Path: /server/services/documentProcessor.js

const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { DocumentProcessingError } = require('../middleware/errorHandler');
const pdfjsLib = require('./pdfConfig');
const medicineReferenceData = require('../../database/medicine-dataset/medicines.json');
const db = require('../config/database');

class DocumentProcessor {
    constructor() {
        this.worker = null;
        this.medicineReference = medicineReferenceData.medicines;
        this.ocrConfig = {
            workerPath: 'eng.traineddata',
            logger: m => console.log(m),
            errorHandler: err => console.error('OCR Error:', err)
        };
    }

    async initialize() {
        try {
            if (!this.worker) {
                console.log('Initializing Tesseract worker');
                this.worker = await Tesseract.createWorker({
                    logger: progress => {
                        console.log('Tesseract progress:', progress);
                    },
                    loadAuto: true
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

    async processDocument(filePath, documentId) {
        const connection = await db.getConnection();
        try {
            console.log('Starting document processing:', documentId);
            await connection.beginTransaction();
    
            // Extract text based on file type
            const ext = path.extname(filePath).toLowerCase();
            const extractedText = ext === '.pdf' 
                ? await this.processPDF(filePath)
                : await this.processImage(filePath);
    
            console.log('Text extraction completed. Text length:', extractedText?.length);
    
            // Extract all information
            const patientInfo = await this.extractPatientInfo(extractedText);
            const vitals = await this.extractVitals(extractedText);
            const medicines = await this.extractMedicineInfo(extractedText);
    
            console.log('Extracted data:', {
                vitals,
                medicineCount: medicines?.length,
                hasPatientInfo: !!patientInfo
            });
    
            if (documentId) {
                // Get document info and profile
                const [documentInfo] = await connection.execute(
                    'SELECT profile_id FROM medical_documents WHERE id = ?',
                    [documentId]
                );
                const profileId = documentInfo[0].profile_id;
    
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
    
                // Save medicines
                if (medicines && medicines.length > 0) {
                    for (const medicine of medicines) {
                        await this.saveMedicineToDatabase(connection, medicine, documentId);
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
                            patientInfo,
                            vitals,
                            medicines,
                            extractedAt: new Date().toISOString()
                        }),
                        documentId
                    ]
                );
            }
    
            await connection.commit();
            console.log('Document processing completed successfully');
    
            return {
                success: true,
                text: extractedText,
                vitals,
                medicines,
                patientInfo
            };
    
        } catch (error) {
            console.error('Document processing error:', error);
            await connection.rollback();
            if (documentId) {
                await this.updateProcessingStatus(connection, documentId, 'failed', error.message);
            }
            throw error;
        } finally {
            connection.release();
        }
    }

    async processImage(filePath) {
      try {
          await this.initialize();
          const result = await this.worker.recognize(filePath);
          return result.data.text;
      } catch (error) {
          console.error('Image processing error:', error);
          throw new DocumentProcessingError('Failed to process image document');
      }
  }
  
  async processPDF(filePath) {
    try {
        console.log('Starting PDF processing:', filePath);
        const data = await fs.readFile(filePath);
        console.log('PDF file read successfully');
        
        const pdf = await pdfjsLib.getDocument({ data }).promise;
        console.log('PDF loaded, pages:', pdf.numPages);
        
        let completeText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            console.log(`Processing page ${i}/${pdf.numPages}`);
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            console.log(`Page ${i} text length: ${pageText.length}`);
            completeText += pageText + '\n';
        }
        
        console.log('Complete text extracted, length:', completeText.length);
        return completeText;
    } catch (error) {
        console.error('PDF processing error:', error);
        throw new DocumentProcessingError('Failed to process PDF document');
    }
}

async extractMedicineInfo(text) {
    try {
        console.log('Starting medicine extraction from text:', text?.substring(0, 200));
        const medicines = [];

        // More flexible prescription section matching
        const prescriptionMatch = text.match(/(?:PRESCRIPTION:|Rx|Medications?)[\s\S]*?(?=VITALS:|SPECIAL INSTRUCTIONS:|$)/i);
        
        if (!prescriptionMatch) {
            console.log('No prescription section found');
            return medicines;
        }

        const prescriptionText = prescriptionMatch[0];
        console.log('Found prescription text:', prescriptionText);

        // Match each medicine entry more flexibly
        const medicineRegex = /(\d+\s*\.\s*)?([A-Za-z\s-]+(?:\([A-Za-z\s]+\))?)\s*(\d+(?:\.\d+)?\s*(?:mg|g|mcg|IU|units\/mL))/gi;
        let match;

        while ((match = medicineRegex.exec(prescriptionText)) !== null) {
            const medicineName = match[2].trim();
            const dosage = match[3];

            console.log('Found potential medicine:', medicineName, dosage);

            // Check against reference data with fuzzy matching
            for (const refMedicine of this.medicineReference) {
                if (this.isMedicineMatch(medicineName, refMedicine)) {
                    const medicine = {
                        medicine_name: refMedicine.brandName,
                        generic_name: refMedicine.genericName,
                        medicine_category: refMedicine.category,
                        dosage: dosage,
                        frequency: this.extractFrequency(prescriptionText),
                        duration: this.extractDuration(prescriptionText),
                        instructions: this.extractInstructions(prescriptionText),
                        confidence_score: 0.9
                    };

                    medicines.push(medicine);
                    console.log('Matched medicine:', medicine);
                    break;
                }
            }
        }

        console.log('Total medicines found:', medicines.length);
        return medicines;
    } catch (error) {
        console.error('Error in medicine extraction:', error);
        return [];
    }
}

// Add this helper method
isMedicineMatch(extractedName, reference) {
    const normalize = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
    const extractedNorm = normalize(extractedName);
    
    // Check brand name
    if (normalize(reference.brandName).includes(extractedNorm) || 
        extractedNorm.includes(normalize(reference.brandName))) {
        return true;
    }
    
    // Check generic name
    if (normalize(reference.genericName).includes(extractedNorm) || 
        extractedNorm.includes(normalize(reference.genericName))) {
        return true;
    }
    
    return false;
}

findMedicineInReference(medicineName) {
    const name = medicineName.toLowerCase();
    let bestMatch = null;
    let highestConfidence = 0;

    for (const medicine of this.medicineReference) {
        // Check brand name
        const brandSimilarity = this.calculateSimilarity(name, medicine.brandName.toLowerCase());
        if (brandSimilarity > highestConfidence && brandSimilarity > 0.8) {
            highestConfidence = brandSimilarity;
            bestMatch = {
                name: medicine.brandName,
                genericName: medicine.genericName,
                category: medicine.category,
                confidence: brandSimilarity
            };
        }

        // Check generic name
        const genericSimilarity = this.calculateSimilarity(name, medicine.genericName.toLowerCase());
        if (genericSimilarity > highestConfidence && genericSimilarity > 0.8) {
            highestConfidence = genericSimilarity;
            bestMatch = {
                name: medicine.genericName,
                genericName: medicine.genericName,
                category: medicine.category,
                confidence: genericSimilarity
            };
        }
    }

    return bestMatch;
}
// Add helper method for extracting instructions
extractInstructions(text) {
    const instructionMatch = text.match(/Sig:\s*([^.]+)/i);
    return instructionMatch ? instructionMatch[1].trim() : null;
}

// Add helper method for extracting frequency
extractFrequency(text) {
    const frequencyPatterns = [
        { pattern: /once\s+daily|once\s+a\s+day/i, value: "Once daily" },
        { pattern: /twice\s+daily|twice\s+a\s+day/i, value: "Twice daily" },
        { pattern: /thrice\s+daily|three\s+times\s+a\s+day/i, value: "Thrice daily" },
        { pattern: /every\s+(\d+)\s+hours?/i, value: matches => `Every ${matches[1]} hours` },
        { pattern: /with\s+meals?/i, value: "With meals" }
    ];

    for (const { pattern, value } of frequencyPatterns) {
        const match = text.match(pattern);
        if (match) {
            return typeof value === 'function' ? value(match) : value;
        }
    }
    return null;
}

// Add helper method for extracting duration
extractDuration(text) {
    const durationPatterns = [
        { pattern: /for\s+(\d+)\s+(days?|weeks?|months?)/i, value: matches => `${matches[1]} ${matches[2]}` },
        { pattern: /(\d+)\s*(days?|weeks?|months?)\s+course/i, value: matches => `${matches[1]} ${matches[2]}` }
    ];

    for (const { pattern, value } of durationPatterns) {
        const match = text.match(pattern);
        if (match) {
            return typeof value === 'function' ? value(match) : value;
        }
    }
    return null;
}

async saveMedicineToDatabase(connection, medicine, documentId) {
    const [result] = await connection.execute(
        `INSERT INTO extracted_medicines 
        (document_id, medicine_name, generic_name, medicine_category,
         dosage, frequency, duration, instructions, confidence_score)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            documentId,
            medicine.medicine_name,
            medicine.generic_name,
            medicine.medicine_category,
            medicine.dosage,
            medicine.frequency || null,
            medicine.duration || null,
            medicine.instructions || null,
            medicine.confidence_score || 0.8
        ]
    );
    return result.insertId;
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

        // Also terminate Tesseract worker
        await this.terminate();
    } catch (error) {
        console.error('Cleanup error:', error);
    }
}

async extractVitals(text) {
    try {
        console.log('Starting vitals extraction');
        const vitals = {
            blood_pressure: null,
            blood_glucose: null,
            hba1c: null
        };

        // Search for VITALS section with flexible matching
        const sections = text.split(/(?:VITALS:|VITAL SIGNS:|Patient Vitals:)/i);
        const vitalsSection = sections.length > 1 ? sections[1].split(/(?:SPECIAL INSTRUCTIONS:|PRESCRIPTION:|Next Appointment:)/i)[0] : text;

        // Enhanced Blood Pressure extraction
        const bpPatterns = [
            /Blood\s*Pressure\s*[:=]?\s*(\d{2,3}[\s/\\-]+\d{2,3})\s*(?:mm?Hg)?/i,
            /BP\s*[:=]?\s*(\d{2,3}[\s/\\-]+\d{2,3})\s*(?:mm?Hg)?/i
        ];

        for (const pattern of bpPatterns) {
            const match = vitalsSection.match(pattern);
            if (match) {
                vitals.blood_pressure = match[1].replace(/[\s\\-]/g, '/');
                break;
            }
        }

        // Enhanced Blood Glucose extraction
        const bgPatterns = [
            /(?:Fasting\s+)?Blood\s*Glucose\s*[:=]?\s*(\d{2,3}(?:\.\d)?)\s*(?:mg\/?\s*d?L)?/i,
            /FBS\s*[:=]?\s*(\d{2,3}(?:\.\d)?)\s*(?:mg\/?\s*d?L)?/i,
            /Glucose\s*[:=]?\s*(\d{2,3}(?:\.\d)?)\s*(?:mg\/?\s*d?L)?/i
        ];

        for (const pattern of bgPatterns) {
            const match = vitalsSection.match(pattern);
            if (match) {
                vitals.blood_glucose = match[1];
                break;
            }
        }

        // Enhanced HbA1c extraction
        const hba1cPatterns = [
            /(?:HbA1c|A1C|Glycated\s+Hemoglobin)\s*[:=]?\s*(\d+\.?\d*)\s*%?/i,
            /HbA1c\s*[:=]?\s*(\d+\.?\d*)\s*%?/i
        ];

        for (const pattern of hba1cPatterns) {
            const match = vitalsSection.match(pattern);
            if (match) {
                vitals.hba1c = match[1];
                break;
            }
        }

        console.log('Extracted vitals:', vitals);
        return this.validateVitals(vitals);
    } catch (error) {
        console.error('Error in vitals extraction:', error);
        return null;
    }
}

// Add this new method for vitals validation
validateVitals(vitals) {
    if (!vitals) return false;

    // Blood pressure validation (format: XXX/XX mmHg)
    if (vitals.blood_pressure) {
        const [systolic, diastolic] = vitals.blood_pressure.split('/').map(Number);
        if (!(systolic >= 70 && systolic <= 200 && diastolic >= 40 && diastolic <= 130)) {
            console.warn('Invalid blood pressure values:', vitals.blood_pressure);
            vitals.blood_pressure = null;
        }
    }

    // Blood glucose validation (40-400 mg/dL range)
    if (vitals.blood_glucose) {
        const glucose = Number(vitals.blood_glucose);
        if (!(glucose >= 40 && glucose <= 400)) {
            console.warn('Invalid blood glucose value:', vitals.blood_glucose);
            vitals.blood_glucose = null;
        }
    }

    // HbA1c validation (3-15% range)
    if (vitals.hba1c) {
        const hba1c = Number(vitals.hba1c);
        if (!(hba1c >= 3 && hba1c <= 15)) {
            console.warn('Invalid HbA1c value:', vitals.hba1c);
            vitals.hba1c = null;
        }
    }

    return vitals;
}

async extractAppointmentInfo(text) {
  try {
      const appointmentMatch = text.match(/Next Appointment:\s*([^\n]*)/i);
      if (!appointmentMatch) return null;

      const appointmentDate = appointmentMatch[1].trim();
      return {
          date: appointmentDate,
          timestamp: new Date(appointmentDate).toISOString()
      };
  } catch (error) {
      console.error('Appointment extraction error:', error);
      return null;
  }
}

async extractPatientInfo(text) {
  try {
      const patientInfoMatch = text.match(/PATIENT INFORMATION:[\s\S]*?(?=PRESCRIPTION:|$)/i);
      if (!patientInfoMatch) return null;

      const patientText = patientInfoMatch[0];
      
      return {
          name: patientText.match(/Name\s*:\s*([^\n]*)/i)?.[1]?.trim(),
          age: patientText.match(/Age\s*:\s*([^\n]*)/i)?.[1]?.trim(),
          gender: patientText.match(/Gender\s*:\s*([^\n]*)/i)?.[1]?.trim(),
          blood_group: patientText.match(/Blood Group\s*:\s*([^\n]*)/i)?.[1]?.trim(),
          patient_id: patientText.match(/Patient ID\s*:\s*([^\n]*)/i)?.[1]?.trim(),
          weight: patientText.match(/Weight\s*:\s*([^\n]*)/i)?.[1]?.trim()
      };
  } catch (error) {
      console.error('Patient info extraction error:', error);
      return null;
  }
}

async saveVitalsToDatabase(connection, vitals, profileId) {
  if (!vitals) return;

  try {
      await connection.execute(
          `UPDATE profiles 
           SET blood_pressure = ?,
               blood_glucose = ?,
               hba1c = ?,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [vitals.blood_pressure, vitals.blood_glucose, vitals.hba1c, profileId]
      );
  } catch (error) {
      console.error('Error saving vitals:', error);
      throw error;
  }
}


async updateProcessingStatus(connection, documentId, status, errorMessage = null) {
  try {
      await connection.execute(
          `UPDATE medical_documents 
           SET processed_status = ?,
               processing_error = ?,
               last_processed_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [status, errorMessage, documentId]
      );
  } catch (error) {
      console.error('Error updating processing status:', error);
      throw error;
  }
}

async testExtraction(req, res, next) {
    try {
        const { id } = req.params;
        console.log('Testing extraction for document:', id);

        // Get document
        const [documents] = await db.execute(
            'SELECT * FROM medical_documents WHERE id = ?',
            [id]
        );

        if (!documents.length) {
            throw new DocumentProcessingError('Document not found');
        }

        const document = documents[0];

        // Test vitals extraction
        const extractedText = await documentProcessor.processDocument(document.file_path);
        console.log('Extracted Text:', extractedText);

        const vitals = await documentProcessor.extractVitals(extractedText);
        console.log('Extracted Vitals:', vitals);

        const medicines = await documentProcessor.extractMedicineInfo(extractedText);
        console.log('Extracted Medicines:', medicines);

        res.json({
            success: true,
            data: {
                vitals,
                medicines,
                text: extractedText
            }
        });

    } catch (error) {
        console.error('Test extraction error:', error);
        next(error);
    }
}

}

module.exports = new DocumentProcessor();