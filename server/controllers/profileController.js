// Path: C:\Project\SMART_MED_2.0\server\controllers\profileController.js

const db = require('../config/database');
const Profile = require('../models/Profile');

class ProfileController {
    // Keep existing methods
    async getCurrentProfile(req, res) {
        try {
            console.log('Getting profile for user ID:', req.user.id);
            
            const [user] = await db.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
            console.log('Found user:', user);

            const profile = await Profile.findByUserId(req.user.id);
            console.log('Found profile:', profile);
            
            if (!profile) {
                console.log('No profile found, creating default profile');
                const defaultProfile = await Profile.create({
                    user_id: req.user.id,
                    full_name: user[0].name || 'New User',
                    date_of_birth: new Date().toISOString().split('T')[0],
                    gender: 'other',
                    is_parent: true
                });
                return res.json(defaultProfile);
            }

            res.json({
                id: profile.id,
                user_id: profile.user_id,
                full_name: profile.full_name,
                date_of_birth: profile.date_of_birth,
                gender: profile.gender,
                is_parent: Boolean(profile.is_parent),
                created_at: profile.created_at,
                updated_at: profile.updated_at
            });
        } catch (error) {
            console.error('Error in getCurrentProfile:', error);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    }

    async createProfile(req, res) {
        try {
            const profile = await Profile.create({
                user_id: req.user.id,
                ...req.body
            });

            await db.query(
                'UPDATE users SET profile_id = ? WHERE id = ?',
                [profile.id, req.user.id]
            );

            res.status(201).json(profile);
        } catch (error) {
            console.error('Error in createProfile:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    async updateProfile(req, res) {
        try {
            const profileData = {
                full_name: req.body.full_name,
                date_of_birth: req.body.date_of_birth,
                gender: req.body.gender,
                is_parent: Boolean(req.body.is_parent)
            };

            const profile = await Profile.findByUserId(req.user.id);
            if (!profile) {
                return res.status(404).json({ message: 'Profile not found' });
            }

            const updatedProfile = await Profile.update(profile.id, profileData);
            res.json(updatedProfile);
        } catch (error) {
            console.error('Error in updateProfile:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    async deleteProfile(req, res) {
        try {
            const profile = await Profile.findByUserId(req.user.id);
            if (!profile) {
                return res.status(404).json({ message: 'Profile not found' });
            }

            await Profile.delete(profile.id);
            res.json({ message: 'Profile deleted successfully' });
        } catch (error) {
            console.error('Error in deleteProfile:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    // Add new family-related methods
    async getFamilyProfiles(req, res) {
        const connection = await db.getConnection();
        try {
            const profileId = req.user.profileId;
            const [profiles] = await connection.execute(`
                SELECT DISTINCT 
                    p.*,
                    CASE 
                        WHEN p.id = ? THEN 'self'
                        WHEN fr.is_spouse = true THEN 'spouse'
                        ELSE fr.relationship_type
                    END as relationship
                FROM profiles p
                LEFT JOIN family_relations fr ON 
                    (fr.parent_profile_id = ? AND fr.child_profile_id = p.id)
                    OR (fr.child_profile_id = ? AND fr.parent_profile_id = p.id)
                WHERE p.id = ? OR fr.relationship_type IS NOT NULL
            `, [profileId, profileId, profileId, profileId]);

            res.json(profiles);
        } catch (error) {
            console.error('Error in getFamilyProfiles:', error);
            res.status(500).json({ message: 'Server error' });
        } finally {
            connection.release();
        }
    }

    async getFamilyMember(req, res) {
        const connection = await db.getConnection();
        try {
            const { id } = req.params;
            const profileId = req.user.profileId;

            const [profiles] = await connection.execute(`
                SELECT p.*, fr.relationship_type
                FROM profiles p
                LEFT JOIN family_relations fr ON 
                    (fr.parent_profile_id = ? AND fr.child_profile_id = p.id)
                    OR (fr.child_profile_id = ? AND fr.parent_profile_id = p.id)
                WHERE p.id = ?
            `, [profileId, profileId, id]);

            if (!profiles.length) {
                return res.status(404).json({ message: 'Family member not found' });
            }

            res.json(profiles[0]);
        } catch (error) {
            console.error('Error in getFamilyMember:', error);
            res.status(500).json({ message: 'Server error' });
        } finally {
            connection.release();
        }
    }
}

module.exports = new ProfileController();