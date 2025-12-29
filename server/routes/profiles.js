// Path: C:\Project\SMART_MED_2.0\server\routes\profiles.js

const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const auth = require('../middleware/auth');

// All routes are protected by auth middleware
router.use(auth);

// Current profile routes
router.get('/me', profileController.getCurrentProfile.bind(profileController));
router.post('/', profileController.createProfile.bind(profileController));
router.put('/', profileController.updateProfile.bind(profileController));
router.delete('/', profileController.deleteProfile.bind(profileController));

// Family routes
router.get('/family', profileController.getFamilyProfiles.bind(profileController));
router.get('/family/:id', profileController.getFamilyMember.bind(profileController));

module.exports = router;