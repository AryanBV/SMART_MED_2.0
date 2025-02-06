// server/models/Profile.js
const db = require('../config/database');

class Profile {
    static async findByUserId(userId) {
        try {
            console.log('Executing findByUserId query for userId:', userId);
            const [rows] = await db.query(
                `SELECT id, user_id, full_name, 
                DATE_FORMAT(date_of_birth, '%Y-%m-%d') as date_of_birth, 
                gender, blood_group, is_parent, profile_type, profile_status,
                emergency_contact, notes, created_at, updated_at 
                FROM profiles WHERE user_id = ?`,
                [userId]
            );
            console.log('Query result:', rows);
            return rows[0] || null;
        } catch (error) {
            console.error('Error in findByUserId:', error);
            throw error;
        }
    }

    static async create(profileData) {
        try {
            // Start a transaction using the connection pool
            await db.query('START TRANSACTION');

            // Set default values for required fields
            const data = {
                user_id: profileData.user_id,
                full_name: profileData.full_name,
                date_of_birth: new Date(profileData.date_of_birth).toISOString().split('T')[0], // Format date
                gender: profileData.gender,
                blood_group: profileData.blood_group || null,
                is_parent: profileData.is_parent ? 1 : 0,
                profile_type: profileData.profile_type || 'primary',
                profile_status: profileData.profile_status || 'active',
                emergency_contact: profileData.emergency_contact || null,
                notes: profileData.notes || null
            };

            console.log('Attempting to create profile with data:', data);

            const [result] = await db.query(
                `INSERT INTO profiles 
                (user_id, full_name, date_of_birth, gender, blood_group, 
                is_parent, profile_type, profile_status, emergency_contact, notes) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    data.user_id, data.full_name, data.date_of_birth, 
                    data.gender, data.blood_group, data.is_parent,
                    data.profile_type, data.profile_status,
                    data.emergency_contact, data.notes
                ]
            );

            const [newProfile] = await db.query(
                `SELECT id, user_id, full_name, 
                DATE_FORMAT(date_of_birth, '%Y-%m-%d') as date_of_birth, 
                gender, blood_group, is_parent, profile_type, profile_status,
                emergency_contact, notes, created_at, updated_at 
                FROM profiles WHERE id = ?`,
                [result.insertId]
            );

            await db.query('COMMIT');
            console.log('Successfully created profile:', newProfile[0]);
            return newProfile[0];

        } catch (error) {
            console.error('Error in create profile:', error);
            await db.query('ROLLBACK');
            throw error;
        }
    }

    static async update(profileId, profileData) {
        try {
            const [result] = await db.query(
                `UPDATE profiles 
                SET full_name = ?, date_of_birth = ?, gender = ?, 
                    blood_group = ?, is_parent = ?, profile_type = ?, 
                    profile_status = ?, emergency_contact = ?, notes = ?
                WHERE id = ?`,
                [
                    profileData.full_name,
                    new Date(profileData.date_of_birth).toISOString().split('T')[0],
                    profileData.gender,
                    profileData.blood_group || null,
                    profileData.is_parent ? 1 : 0,
                    profileData.profile_type || 'primary',
                    profileData.profile_status || 'active',
                    profileData.emergency_contact || null,
                    profileData.notes || null,
                    profileId
                ]
            );

            if (result.affectedRows === 0) {
                throw new Error('Profile not found');
            }

            const [updatedProfile] = await db.query(
                `SELECT * FROM profiles WHERE id = ?`,
                [profileId]
            );

            return updatedProfile[0];
        } catch (error) {
            console.error('Error in update:', error);
            throw error;
        }
    }

    static async findFamilyMembers(profileId) {
        try {
            // Modified query to use correct column names
            const [rows] = await db.query(`
                WITH profile_documents AS (
                    SELECT 
                        profile_id,
                        id as document_id,
                        document_type,
                        processed_status,
                        last_processed_at,
                        created_at as document_created_at
                    FROM medical_documents
                    ORDER BY created_at DESC
                )
                SELECT DISTINCT 
                    p.*,
                    fr.relationship_type,
                    fr.relation_type,
                    pd.document_id,
                    pd.document_type,
                    pd.processed_status,
                    pd.last_processed_at,
                    pd.document_created_at
                FROM profiles p
                LEFT JOIN family_relations fr ON 
                    (fr.parent_profile_id = ? AND fr.child_profile_id = p.id)
                    OR (fr.child_profile_id = ? AND fr.parent_profile_id = p.id)
                LEFT JOIN profile_documents pd ON pd.profile_id = p.id
                WHERE p.id = ? 
                   OR fr.parent_profile_id = ? 
                   OR fr.child_profile_id = ?
                ORDER BY p.id, pd.document_created_at DESC`,
                [profileId, profileId, profileId, profileId, profileId]
            );
    
            // Rest of the method remains the same
            const membersMap = new Map();
            rows.forEach(row => {
                if (!membersMap.has(row.id)) {
                    membersMap.set(row.id, {
                        id: row.id,
                        name: row.full_name,
                        dateOfBirth: row.date_of_birth,
                        gender: row.gender,
                        bloodGroup: row.blood_group,
                        relationshipType: row.relationship_type,
                        relationType: row.relation_type,
                        documents: [],
                        profileType: row.profile_type,
                        profileStatus: row.profile_status,
                        emergencyContact: row.emergency_contact,
                    });
                }
                
                if (row.document_id) {
                    const member = membersMap.get(row.id);
                    if (!member.documents.some(d => d.id === row.document_id)) {
                        member.documents.push({
                            id: row.document_id,
                            type: row.document_type,
                            status: row.processed_status,
                            lastProcessed: row.last_processed_at,
                            createdAt: row.document_created_at
                        });
                    }
                }
            });
    
            return Array.from(membersMap.values());
        } catch (error) {
            console.error('Error in findFamilyMembers:', error);
            throw error;
        }
    }

    static async hasAccessPermission(requesterId, targetId, requiredLevel = 'read') {
        try {
            if (requesterId === targetId) return true;
    
            const [relations] = await db.query(
                `SELECT relationship_type 
                FROM family_relations 
                WHERE (parent_profile_id = ? AND child_profile_id = ?)
                OR (parent_profile_id = ? AND child_profile_id = ?)`,
                [requesterId, targetId, targetId, requesterId]
            );
    
            if (!relations.length) return false;
    
            const relationTypes = {
                'father': ['read', 'write'],
                'mother': ['read', 'write'],
                'son': ['read'],
                'daughter': ['read'],
                'husband': ['read', 'write'],
                'wife': ['read', 'write']
            };
    
            const relationship = relations[0].relationship_type;
            return relationTypes[relationship]?.includes(requiredLevel) || false;
        } catch (error) {
            console.error('Error in hasAccessPermission:', error);
            throw error;
        }
    }
}

module.exports = Profile;