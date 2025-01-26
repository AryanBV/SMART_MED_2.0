// server/controllers/profileController.js

exports.getCurrentProfile = async (req, res) => {
    try {
        const profile = await Profile.findByUserId(req.user.id);
        
        if (!profile) {
            return res.status(404).json({ message: 'Profile not found' });
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
        res.status(500).json({ message: 'Server error' });
    }
};

exports.createProfile = async (req, res) => {
    try {
        const profileData = {
            user_id: req.user.id,
            full_name: req.body.full_name,
            date_of_birth: req.body.date_of_birth,
            gender: req.body.gender,
            is_parent: Boolean(req.body.is_parent)
        };

        const profile = await Profile.create(profileData);
        res.status(201).json(profile);
    } catch (error) {
        console.error('Error in createProfile:', error);
        res.status(500).json({ message: 'Server error' });
    }
};