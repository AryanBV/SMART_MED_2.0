// Path: C:\Project\SMART_MED_2.0\server\controllers\profileController.js

const { supabase, supabaseAdmin } = require('../config/database');
const Profile = require('../models/Profile');

class ProfileController {
    // Keep existing methods
    async getCurrentProfile(req, res) {
        try {
            console.log('Getting profile for user ID:', req.user.userId);
            
            const { data: user, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('id', req.user.userId)
                .single();

            if (userError) {
                console.error('Error getting user:', userError);
                return res.status(500).json({ message: 'Error getting user data' });
            }

            console.log('Found user:', user);

            const profile = await Profile.findByUserId(req.user.userId);
            console.log('Found profile:', profile);
            
            if (!profile) {
                console.log('No profile found, creating default profile');
                const defaultProfile = await Profile.create({
                    user_id: req.user.userId,
                    full_name: user.name || 'New User',
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
                user_id: req.user.userId,
                ...req.body
            });

            // Remove the profile_id update since it doesn't exist in the users table

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

            const profile = await Profile.findByUserId(req.user.userId);
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
            const profile = await Profile.findByUserId(req.user.userId);
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
        try {
            const profileId = req.user.profileId;
            const familyMembers = await Profile.findFamilyMembers(profileId);
            res.json(familyMembers);
        } catch (error) {
            console.error('Error in getFamilyProfiles:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    async getFamilyMember(req, res) {
        try {
            const { id } = req.params;
            const profileId = req.user.profileId;

            // Check if user has access to this family member
            const hasAccess = await Profile.hasAccessPermission(profileId, id);
            if (!hasAccess) {
                return res.status(403).json({ message: 'Access denied' });
            }

            // Get the profile
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return res.status(404).json({ message: 'Family member not found' });
                }
                throw error;
            }

            // Get relationship info
            const { data: relation } = await supabase
                .from('family_relations')
                .select('relationship_type')
                .or(`parent_profile_id.eq.${profileId},child_profile_id.eq.${profileId}`)
                .or(`parent_profile_id.eq.${id},child_profile_id.eq.${id}`)
                .single();

            res.json({
                ...profile,
                relationship_type: relation?.relationship_type || null
            });
        } catch (error) {
            console.error('Error in getFamilyMember:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }
}

module.exports = new ProfileController();