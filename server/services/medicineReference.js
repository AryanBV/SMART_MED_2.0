// server/services/medicineReference.js
const db = require('../config/database');

class MedicineReferenceService {
  async getAllMedicines() {
    const [rows] = await db.execute('SELECT * FROM medicine_reference');
    return rows;
  }

  async findSimilarMedicines(name, threshold = 0.8) {
    const [rows] = await db.execute('SELECT * FROM medicine_reference');
    const matches = [];

    for (const medicine of rows) {
      // Check brand name
      if (this.calculateSimilarity(name, medicine.brand_name) >= threshold) {
        matches.push({
          ...medicine,
          confidence: this.calculateSimilarity(name, medicine.brand_name)
        });
        continue;
      }

      // Check generic name
      if (this.calculateSimilarity(name, medicine.generic_name) >= threshold) {
        matches.push({
          ...medicine,
          confidence: this.calculateSimilarity(name, medicine.generic_name)
        });
        continue;
      }

      // Check alternative brands
      if (medicine.alternative_brands) {
        const altBrands = JSON.parse(medicine.alternative_brands);
        for (const altBrand of altBrands) {
          if (this.calculateSimilarity(name, altBrand) >= threshold) {
            matches.push({
              ...medicine,
              confidence: this.calculateSimilarity(name, altBrand)
            });
            break;
          }
        }
      }
    }

    return matches.sort((a, b) => b.confidence - a.confidence);
  }

  async validateMedicine(medicine) {
    const [rows] = await db.execute(
      'SELECT * FROM medicine_reference WHERE brand_name = ? OR generic_name = ?',
      [medicine.medicine_name, medicine.medicine_name]
    );

    if (rows.length === 0) {
      return {
        isValid: false,
        message: 'Medicine not found in reference database'
      };
    }

    const referenceData = rows[0];
    return {
      isValid: true,
      data: {
        ...medicine,
        category: referenceData.category,
        manufacturer: referenceData.manufacturer,
        alternativeBrands: JSON.parse(referenceData.alternative_brands || '[]')
      }
    };
  }

  calculateSimilarity(str1, str2) {
    // Simple Levenshtein distance implementation
    const a = str1.toLowerCase();
    const b = str2.toLowerCase();
    const matrix = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    for (let i = 0; i <= a.length; i++) {
      matrix[0][i] = i;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    const maxLength = Math.max(a.length, b.length);
    const distance = matrix[b.length][a.length];
    return 1 - distance / maxLength;
  }
}

module.exports = new MedicineReferenceService();