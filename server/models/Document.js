// Path: /server/models/Document.js

const db = require('../config/database');

class Document {
    static async findByProfileId(profileId) {
        const [rows] = await db.execute(`
            SELECT d.*, 
                   p.full_name as owner_name,
                   r.relationship_type as relationship,
                   CASE 
                     WHEN d.profile_id = ? THEN 'admin'
                     WHEN r.relationship_type IN ('parent', 'guardian') THEN 'write'
                     ELSE 'read'
                   END as access_level
            FROM medical_documents d
            LEFT JOIN profiles p ON d.profile_id = p.id
            LEFT JOIN family_relations r ON (
                (r.parent_profile_id = ? AND r.child_profile_id = d.profile_id)
                OR (r.child_profile_id = ? AND r.parent_profile_id = d.profile_id)
            )
            WHERE d.profile_id = ?
               OR (r.relationship_type IS NOT NULL AND d.is_archived = false)
            ORDER BY d.created_at DESC
        `, [profileId, profileId, profileId, profileId]);
        
        return rows;
    }


    static async create(documentData) {
        const [result] = await db.execute(
            `INSERT INTO medical_documents 
            (profile_id, owner_profile_id, original_owner_id, file_name, file_path, 
             file_type, file_size, mime_type, document_type, access_level, uploaded_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                documentData.profileId,         // The selected family member
                documentData.ownerProfileId,    // The logged-in user's profile
                documentData.ownerProfileId,    // Original owner (logged-in user)
                documentData.fileName,
                documentData.filePath,
                documentData.fileType,
                documentData.fileSize,
                documentData.mimeType,
                documentData.documentType,
                'family',                       // Set default access level to family
                documentData.ownerProfileId     // Uploaded by logged-in user
            ]
        );
        return result.insertId;
    }

    static async findById(id, profileId) {
        const [rows] = await db.execute(`
            SELECT d.*, 
                   p.full_name as owner_name,
                   r.relationship_type as relationship,
                   CASE 
                     WHEN d.profile_id = ? THEN 'admin'
                     WHEN r.relationship_type IN ('parent', 'guardian') THEN 'write'
                     ELSE 'read'
                   END as access_level
            FROM medical_documents d
            LEFT JOIN profiles p ON d.profile_id = p.id
            LEFT JOIN family_relations r ON (
                (r.parent_profile_id = ? AND r.child_profile_id = d.profile_id)
                OR (r.child_profile_id = ? AND r.parent_profile_id = d.profile_id)
            )
            WHERE d.id = ? AND (
                d.profile_id = ?
                OR r.relationship_type IS NOT NULL
            )
        `, [profileId, profileId, profileId, id, profileId]);
        
        return rows[0];
    }

    static async updateProcessingStatus(id, status, lastProcessedAt = null) {
        await db.execute(
            `UPDATE medical_documents 
             SET processed_status = ?, 
                 last_processed_at = ? 
             WHERE id = ?`,
            [status, lastProcessedAt || new Date(), id]
        );
    }

    static async softDelete(id, profileId) {
        const [result] = await db.execute(
            `UPDATE medical_documents 
             SET is_archived = true 
             WHERE id = ? AND profile_id = ?`,
            [id, profileId]
        );
        return result.affectedRows > 0;
    }

    static async hasAccessPermission(targetProfileId, requestingProfileId) {
        const [rows] = await db.execute(`
            SELECT 1 
            FROM profiles p
            LEFT JOIN family_relations fr ON 
                (fr.parent_profile_id = ? AND fr.child_profile_id = ?)
                OR (fr.child_profile_id = ? AND fr.parent_profile_id = ?)
            WHERE p.id = ?
            LIMIT 1`,
            [requestingProfileId, targetProfileId, requestingProfileId, targetProfileId, targetProfileId]
        );
        return rows.length > 0;
    }
}

module.exports = Document;