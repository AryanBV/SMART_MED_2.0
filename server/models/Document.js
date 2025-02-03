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
                (r.parent_id = ? AND r.child_id = d.profile_id)
                OR (r.child_id = ? AND r.parent_id = d.profile_id)
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
            (profile_id, file_name, file_path, file_type, file_size, mime_type, document_type) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                documentData.profileId,
                documentData.fileName,
                documentData.filePath,
                documentData.fileType,
                documentData.fileSize,
                documentData.mimeType,
                documentData.documentType
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
                (r.parent_id = ? AND r.child_id = d.profile_id)
                OR (r.child_id = ? AND r.parent_id = d.profile_id)
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

    static async hasAccessPermission(documentId, profileId, requiredLevel = 'read') {
        const document = await this.findById(documentId, profileId);
        if (!document) return false;

        const accessLevels = {
            'read': ['read', 'write', 'admin'],
            'write': ['write', 'admin'],
            'admin': ['admin']
        };

        return accessLevels[requiredLevel].includes(document.access_level);
    }
}

module.exports = Document;