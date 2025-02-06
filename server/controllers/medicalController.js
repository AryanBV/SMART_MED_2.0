const db = require('../config/database');
const documentProcessor = require('../services/documentProcessor');
const medicineReferenceService = require('../services/medicineReference');

class MedicalController {
    async updateFamilyMemberMedications(req, res, next) {
        const connection = await db.getConnection();
        try {
            const { profileId } = req.params;
            const { medications } = req.body;

            await connection.beginTransaction();

            // First, archive existing active medications
            await connection.execute(
                `UPDATE extracted_medicines 
                 SET status = 'archived', 
                     end_date = CURRENT_TIMESTAMP
                 WHERE profile_id = ? AND status = 'active'`,
                [profileId]
            );

            // Insert new medications
            for (const med of medications) {
                const validatedMed = await medicineReferenceService.validateMedicine(med);
                if (validatedMed.isValid) {
                    await connection.execute(
                        `INSERT INTO extracted_medicines 
                        (profile_id, document_id, medicine_name, generic_name,
                         medicine_category, dosage, frequency, duration,
                         instructions, status, start_date)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP)`,
                        [
                            profileId,
                            med.documentId,
                            validatedMed.data.medicine_name,
                            validatedMed.data.generic_name,
                            validatedMed.data.category,
                            med.dosage,
                            med.frequency,
                            med.duration,
                            med.instructions
                        ]
                    );
                }
            }

            await connection.commit();
            res.json({ message: 'Medications updated successfully' });

        } catch (error) {
            await connection.rollback();
            next(error);
        } finally {
            connection.release();
        }
    }

    async getFamilyMemberMedications(req, res, next) {
        try {
            const { profileId } = req.params;
            const [medications] = await db.execute(
                `SELECT em.*, md.upload_date, md.document_type
                 FROM extracted_medicines em
                 JOIN medical_documents md ON em.document_id = md.id
                 WHERE em.profile_id = ? AND em.status = 'active'
                 ORDER BY em.start_date DESC`,
                [profileId]
            );

            res.json(medications);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new MedicalController();