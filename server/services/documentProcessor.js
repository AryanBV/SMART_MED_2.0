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
    
            // Update initial status
            await this.updateProcessingStatus(connection, documentId, 'processing');
    
            // Extract text based on file type
            const ext = path.extname(filePath).toLowerCase();
            const extractedText = ext === '.pdf' 
                ? await this.processPDF(filePath)
                : await this.processImage(filePath);
    
            console.log('Text extraction completed');
    
            // Get document info and profile
            const [documentInfo] = await connection.execute(
                'SELECT profile_id FROM medical_documents WHERE id = ?',
                [documentId]
            );
            const profileId = documentInfo[0].profile_id;
    
            // Extract all information
            const patientInfo = await this.extractPatientInfo(extractedText);
            const vitals = await this.extractVitals(extractedText);
            const medicines = await this.extractMedicineInfo(extractedText, documentId);
            const appointmentInfo = await this.extractAppointmentInfo(extractedText);
    
            // Save all extracted information
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
    
            // Update document with all extracted data
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
                    documentId
                ]
            );
    
            await connection.commit();
            console.log('Document processing completed successfully');
    
            return {
                success: true,
                data: {
                    patientInfo,
                    vitals,
                    medicines,
                    appointmentInfo,
                    rawText: extractedText
                }
            };
    
        } catch (error) {
            await connection.rollback();
            console.error('Document processing error:', error);
            await this.updateProcessingStatus(connection, documentId, 'failed', error.message);
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
          const data = await fs.readFile(filePath);
          const pdf = await pdfjsLib.getDocument(data).promise;
          let completeText = '';
  
          for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const textContent = await page.getTextContent();
              const pageText = textContent.items.map(item => item.str).join(' ');
              completeText += pageText + '\n';
          }
  
          return completeText;
      } catch (error) {
          console.error('PDF processing error:', error);
          throw new DocumentProcessingError('Failed to process PDF document');
      }
  }

  async extractMedicineInfo(text, documentId) {
    const connection = await db.getConnection();
    try {
        console.log('Starting medicine extraction from text');
        const medicines = [];
        
        // Extract prescription section
        const prescriptionMatch = text.match(/PRESCRIPTION:[\s\S]*?(?=VITALS:|$)/i);
        if (!prescriptionMatch) {
            console.log('No prescription section found');
            return [];
        }

        const prescriptionText = prescriptionMatch[0];
        const medicationEntries = prescriptionText.split(/\d+\./g).filter(entry => entry.trim());

        for (const entry of medicationEntries) {
            const medicineMatch = entry.match(/([A-Za-z\s]+(?:\s*\([A-Za-z\s]+\))?)\s*(\d+(?:\.\d+)?\s*(?:mg|g|mcg|IU|units\/mL))/i);
            if (!medicineMatch) continue;

            const medicineName = medicineMatch[1].trim();
            const dosage = medicineMatch[2];

            // Find medicine in reference data
            const medicineInfo = this.findMedicineNameInLine(medicineName);
            if (!medicineInfo) continue;

            // Extract Sig (instructions)
            const sigMatch = entry.match(/Sig:\s*([^\n]+)/i);
            const dispMatch = entry.match(/Disp:\s*([^\n]+)/i);
            const refillsMatch = entry.match(/Refills:\s*(\d+)/i);

            const medicine = {
                medicine_name: medicineInfo.name,
                generic_name: medicineInfo.genericName,
                medicine_category: medicineInfo.category,
                dosage: dosage,
                frequency: sigMatch ? sigMatch[1].trim() : null,
                duration: this.extractDuration(entry),
                instructions: [
                    sigMatch ? sigMatch[1].trim() : '',
                    dispMatch ? `Dispense: ${dispMatch[1].trim()}` : '',
                    refillsMatch ? `Refills: ${refillsMatch[1]}` : ''
                ].filter(Boolean),
                confidence_score: medicineInfo.confidence,
                status: 'active',
                start_date: new Date()
            };

            await this.saveMedicineToDatabase(connection, medicine, documentId);
            medicines.push(medicine);
        }

        await connection.commit();
        return medicines;

    } catch (error) {
        await connection.rollback();
        console.error('Medicine extraction error:', error);
        throw new DocumentProcessingError('Failed to extract medicines');
    } finally {
        connection.release();
    }
  }

    async saveMedicineToDatabase(connection, medicine, documentId) {
        const [result] = await connection.execute(
            `INSERT INTO extracted_medicines 
            (document_id, medicine_name, generic_name, medicine_category,
             dosage, frequency, duration, instructions, confidence_score,
             status, start_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                documentId,
                medicine.medicine_name,
                medicine.generic_name,
                medicine.medicine_category,
                medicine.dosage,
                medicine.frequency,
                medicine.duration,
                medicine.instructions.join('\n'),
                medicine.confidence_score,
                medicine.status,
                medicine.start_date
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
      const vitalsMatch = text.match(/VITALS:[\s\S]*?(?=SPECIAL INSTRUCTIONS:|$)/i);
      if (!vitalsMatch) return null;

      const vitalsText = vitalsMatch[0];
      
      return {
          blood_pressure: vitalsText.match(/Blood Pressure\s*:\s*([^\n]*)/i)?.[1]?.trim(),
          blood_glucose: vitalsText.match(/(?:Fasting )?Blood Glucose\s*:\s*([^\n]*)/i)?.[1]?.trim(),
          hba1c: vitalsText.match(/HbA1c\s*:\s*([^\n]*)/i)?.[1]?.trim()
      };
  } catch (error) {
      console.error('Vitals extraction error:', error);
      return null;
  }
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

async processDocument(filePath, documentId) {
  const connection = await db.getConnection();
  try {
      console.log('Starting document processing:', documentId);
      await connection.beginTransaction();

      // Update initial status
      await this.updateProcessingStatus(connection, documentId, 'processing');

      // Get file type and process accordingly
      const ext = path.extname(filePath).toLowerCase();
      const extractedText = ext === '.pdf' 
          ? await this.processPDF(filePath)
          : await this.processImage(filePath);

      console.log('Text extraction completed');

      // Extract all information
      const [documentInfo] = await connection.execute(
          'SELECT profile_id FROM medical_documents WHERE id = ?',
          [documentId]
      );

      const profileId = documentInfo[0].profile_id;

      // Extract and save all information
      const patientInfo = await this.extractPatientInfo(extractedText);
      const vitals = await this.extractVitals(extractedText);
      const medicines = await this.extractMedicineInfo(extractedText, documentId);
      const appointmentInfo = await this.extractAppointmentInfo(extractedText);

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

      // Update document with extracted data
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
              documentId
          ]
      );

      await connection.commit();
      console.log('Document processing completed successfully');

      return {
          success: true,
          data: {
              patientInfo,
              vitals,
              medicines,
              appointmentInfo
          }
      };

  } catch (error) {
      await connection.rollback();
      console.error('Document processing error:', error);
      await this.updateProcessingStatus(connection, documentId, 'failed', error.message);
      throw error;
  } finally {
      connection.release();
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

}

module.exports = new DocumentProcessor();