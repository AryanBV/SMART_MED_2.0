const express = require('express');
const router = express.Router();
const medicalController = require('../controllers/medicalController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Family member medications routes
router.get('/family-members/:profileId/medications', 
    (req, res, next) => medicalController.getFamilyMemberMedications(req, res, next)
);

router.post('/family-members/:profileId/medications', 
    (req, res, next) => medicalController.updateFamilyMemberMedications(req, res, next)
);

module.exports = router;