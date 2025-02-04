const express = require('express');
const router = express.Router();
const familyController = require('../controllers/familyController');
const auth = require('../middleware/auth');

// Test route
router.get('/test', (req, res) => {
    res.json({ message: 'Family routes are accessible' });
});

// Protect all routes
router.use(auth);

// Get entire family tree
router.get('/tree', familyController.getFamilyTree);

// Get all family members
router.get('/members', familyController.getFamilyMembers);

// Create new family member
router.post('/member', familyController.createFamilyMember);

// Add spouse relation
router.post('/spouse-relation', familyController.addSpouseRelation);

// Delete family member
router.delete('/member/:id', familyController.removeFamilyMember);

// Create family relation
router.post('/relation', familyController.addFamilyRelation);

router.put('/member/:id', familyController.updateFamilyMember);
// Delete family relation
router.delete('/relation/:id', familyController.removeFamilyRelation);

module.exports = router;