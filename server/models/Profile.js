// server/models/Profile.js
const db = require('../config/database');

class Profile {
    static async findByUserId(userId) {
        try {
            const [rows] = await db.query(
                `SELECT id, user_id, full_name, 
                DATE_FORMAT(date_of_birth, '%Y-%m-%d') as date_of_birth, 
                gender, is_parent, created_at, updated_at 
                FROM profiles WHERE user_id = ?`,
                [userId]
            );
            return rows[0] || null;
        } catch (error) {
            console.error('Error in findByUserId:', error);
            throw error;
        }
    }

    static async create(profileData) {
        try {
            const [result] = await db.query(
                `INSERT INTO profiles 
                (user_id, full_name, date_of_birth, gender, is_parent) 
                VALUES (?, ?, ?, ?, ?)`,
                [
                    profileData.user_id,
                    profileData.full_name,
                    profileData.date_of_birth,
                    profileData.gender,
                    profileData.is_parent
                ]
            );

            // Fetch the created profile to return complete data
            const [newProfile] = await db.query(
                `SELECT id, user_id, full_name, 
                DATE_FORMAT(date_of_birth, '%Y-%m-%d') as date_of_birth, 
                gender, is_parent, created_at, updated_at 
                FROM profiles WHERE id = ?`,
                [result.insertId]
            );

            return newProfile[0];
        } catch (error) {
            console.error('Error in create:', error);
            throw error;
        }
    }

    static async update(userId, profileData) {
        try {
            await db.query(
                `UPDATE profiles 
                SET full_name = ?, date_of_birth = ?, gender = ?, is_parent = ?
                WHERE user_id = ?`,
                [
                    profileData.full_name,
                    profileData.date_of_birth,
                    profileData.gender,
                    profileData.is_parent,
                    userId
                ]
            );

            // Fetch and return the updated profile
            return await this.findByUserId(userId);
        } catch (error) {
            console.error('Error in update:', error);
            throw error;
        }
    }

    static async delete(userId) {
        try {
            const [result] = await db.query(
                'DELETE FROM profiles WHERE user_id = ?',
                [userId]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error in delete:', error);
            throw error;
        }
    }
}

module.exports = Profile;