// server/controllers/profileController.js
const db = require('../config/database'); // Add this at the top
const Profile = require('../models/Profile'); // Add this import

exports.getCurrentProfile = async (req, res) => {
    try {
        console.log('Getting profile for user ID:', req.user.id);
        
        // First verify the user exists
        const [user] = await db.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
        console.log('Found user:', user);

        const profile = await Profile.findByUserId(req.user.id);
        console.log('Found profile:', profile);
        
        if (!profile) {
            console.log('No profile found, creating default profile');
            // Create a default profile if none exists
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
};

exports.createProfile = async (req, res) => {
    try {
        const profile = await Profile.create({
            user_id: req.user.id,
            ...req.body
        });

        // Update user record with profile_id
        await db.query(
            'UPDATE users SET profile_id = ? WHERE id = ?',
            [profile.id, req.user.id]
        );

        res.status(201).json(profile);
    } catch (error) {
        console.error('Error in createProfile:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Add the missing methods
exports.updateProfile = async (req, res) => {
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
};

exports.deleteProfile = async (req, res) => {
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
};