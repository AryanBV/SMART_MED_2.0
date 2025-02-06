// Path: server/controllers/dashboardController.js

const Profile = require('../models/Profile');
const Document = require('../models/Document');
const db = require('../config/database');
const { DocumentProcessingError } = require('../middleware/errorHandler');

class DashboardController {
    // In dashboardController.js, update the getDashboardData method:

async getDashboardData(req, res, next) {
    const connection = await db.getConnection();
    try {
        const profileId = req.user.profileId;

        // Get family members with enhanced relationship info
        const [familyMembers] = await connection.execute(`
            SELECT DISTINCT 
                p.*,
                CASE 
                    WHEN p.id = ? THEN 'self'
                    WHEN fr.is_spouse = true THEN 'spouse'
                    ELSE fr.relationship_type
                END as relationship,
                fr.relation_type
            FROM profiles p
            LEFT JOIN family_relations fr ON 
                (fr.parent_profile_id = ? AND fr.child_profile_id = p.id)
                OR (fr.child_profile_id = ? AND fr.parent_profile_id = p.id)
            WHERE p.id = ? OR fr.relationship_type IS NOT NULL
        `, [profileId, profileId, profileId, profileId]);

        // Get statistics first
        const [statistics] = await connection.execute(`
            SELECT
                (SELECT COUNT(*) FROM family_relations 
                 WHERE parent_profile_id = ? OR child_profile_id = ?) as totalFamilyMembers,
                (SELECT COUNT(*) FROM medical_documents 
                 WHERE profile_id = ? AND is_archived = false) as totalDocuments,
                (SELECT COUNT(*) FROM medical_documents 
                 WHERE processed_status = 'failed' 
                 AND profile_id = ?) as activeAlerts,
                (SELECT COUNT(*) FROM medication_schedules ms
                 JOIN extracted_medicines em ON ms.medicine_id = em.id
                 WHERE ms.profile_id = ? AND em.status = 'active') as activeMedications
        `, [profileId, profileId, profileId, profileId, profileId]);

        // Get health data for each family member
        const healthData = await Promise.all(familyMembers.map(async (member) => {
            // Get documents with extracted medicines
            const [documents] = await connection.execute(`
                SELECT 
                    d.*,
                    em.medicine_name,
                    em.dosage,
                    em.frequency,
                    em.duration,
                    em.instructions,
                    em.status,
                    em.start_date
                FROM medical_documents d
                LEFT JOIN extracted_medicines em ON d.id = em.document_id
                WHERE d.profile_id = ? 
                AND d.is_archived = false
                AND d.processed_status = 'completed'
                ORDER BY d.created_at DESC, em.start_date DESC
            `, [member.id]);

            // Get active medications
            const [activeMedications] = await connection.execute(`
                SELECT * FROM active_medications_view
                WHERE profile_id = ?
                ORDER BY prescribed_date DESC
            `, [member.id]);

            return {
                id: member.id,
                name: member.full_name,
                age: this.calculateAge(member.date_of_birth),
                gender: member.gender,
                bloodGroup: member.blood_group || 'Not specified',
                diabetesType: member.diabetes_type,
                height: member.height,
                weight: member.weight,
                patientId: `AND${String(member.id).padStart(3, '0')}`,
                relationship: member.relationship,
                relationType: member.relation_type,
                metrics: {
                    bloodPressure: 'N/A',
                    bloodGlucose: 'N/A',
                    hbA1c: 'N/A'
                },
                documents: documents.map(doc => ({
                    ...doc,
                    medications: doc.medications === null ? [] : 
                                 typeof doc.medications === 'string' ? JSON.parse(doc.medications) : 
                                 doc.medications
                })),
                activeMedications,
                documentCount: documents.length,
                lastUpdate: member.updated_at,
                medications: documents.filter(doc => doc.medicine_name).map(doc => ({
                    name: doc.medicine_name,
                    dosage: doc.dosage,
                    frequency: doc.frequency,
                    duration: doc.duration,
                    instructions: doc.instructions ? doc.instructions.split('\n') : [],
                    status: doc.status,
                    startDate: doc.start_date
                })),
                lastDocument: documents[0] || null,
            };
        }));

        // Get recent updates
        const [recentUpdates] = await connection.execute(`
            SELECT 
                d.id,
                d.profile_id as memberId,
                p.full_name as memberName,
                d.document_type,
                d.processed_status,
                d.created_at as timestamp,
                dph.processing_stage,
                dph.status as processingStatus,
                dph.error_message
            FROM medical_documents d
            JOIN profiles p ON d.profile_id = p.id
            LEFT JOIN document_processing_history dph ON d.id = dph.document_id
            WHERE d.profile_id IN (
                SELECT DISTINCT 
                    CASE 
                        WHEN fr.parent_profile_id = ? THEN fr.child_profile_id
                        WHEN fr.child_profile_id = ? THEN fr.parent_profile_id
                        ELSE ?
                    END
                FROM profiles p
                LEFT JOIN family_relations fr ON 
                    (fr.parent_profile_id = ? AND fr.child_profile_id = p.id)
                    OR (fr.child_profile_id = ? AND fr.parent_profile_id = p.id)
            )
            ORDER BY d.created_at DESC
            LIMIT 10
        `, [profileId, profileId, profileId, profileId, profileId]);

        const dashboardData = {
            familyMembers: healthData,
            recentUpdates,
            alerts: [], // You can add alerts logic here if needed
            statistics: {
                ...statistics[0],
                pendingAppointments: 0 // Add logic for pending appointments if needed
            }
        };

        res.json({
            success: true,
            data: dashboardData
        });

    } catch (error) {
        console.error('Error in getDashboardData:', error);
        next(error);
    } finally {
        connection.release();
    }
    }

    async getFamilyMemberHealth(req, res, next) {
        const connection = await db.getConnection();
        try {
            const { memberId } = req.params;
            const profileId = req.user.profileId;

            // Check access permission
            const hasAccess = await Profile.hasAccessPermission(profileId, parseInt(memberId));
            if (!hasAccess) {
                throw new DocumentProcessingError('Access denied');
            }

            // Get member profile with health data
            const [profiles] = await connection.execute(`
                SELECT p.*, 
                       fr.relationship_type,
                       fr.relation_type,
                       fr.is_spouse
                FROM profiles p
                LEFT JOIN family_relations fr ON 
                    (fr.parent_profile_id = ? AND fr.child_profile_id = p.id)
                    OR (fr.child_profile_id = ? AND fr.parent_profile_id = p.id)
                WHERE p.id = ?
            `, [profileId, profileId, memberId]);

            if (!profiles.length) {
                throw new DocumentProcessingError('Profile not found');
            }

            const profile = profiles[0];

            // Get active medications
            const [medications] = await connection.execute(`
                SELECT * FROM active_medications_view
                WHERE profile_id = ?
                ORDER BY prescribed_date DESC
            `, [memberId]);

            // Get medication schedules
            const [schedules] = await connection.execute(`
                SELECT * FROM medication_schedules
                WHERE profile_id = ?
            `, [memberId]);

            res.json({
                id: profile.id,
                name: profile.full_name,
                age: this.calculateAge(profile.date_of_birth),
                gender: profile.gender,
                bloodGroup: profile.blood_group,
                diabetesType: profile.diabetes_type,
                height: profile.height,
                weight: profile.weight,
                patientId: `AND${String(profile.id).padStart(3, '0')}`,
                relationship: profile.is_spouse ? 'spouse' : profile.relationship_type,
                medications,
                medicationSchedules: schedules,
                lastUpdate: profile.updated_at
            });

        } catch (error) {
            next(error);
        } finally {
            connection.release();
        }
    }

    calculateAge(dateOfBirth) {
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        return age;
    }
}

module.exports = new DashboardController();