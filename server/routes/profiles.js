// server/routes/profiles.js
const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const auth = require('../middleware/auth');

// All routes are protected by auth middleware
router.use(auth);

// Get current user's profile
router.get('/me', profileController.getCurrentProfile);

// Create a new profile
router.post('/', profileController.createProfile);

// Update current user's profile
router.put('/', profileController.updateProfile);

// Delete current user's profile
router.delete('/', profileController.deleteProfile);

module.exports = router;