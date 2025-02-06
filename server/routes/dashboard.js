// File: server/routes/dashboard.js

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth'); // Updated import
const dashboardController = require('../controllers/dashboardController');

// Check if controller methods exist
console.log('Dashboard Controller Methods:', {
    getDashboardData: typeof dashboardController.getDashboardData,
    getFamilyMemberHealth: typeof dashboardController.getFamilyMemberHealth,
    processDocument: typeof dashboardController.processDocument,
    updateHealthMetrics: typeof dashboardController.updateHealthMetrics
});

// Define routes with proper error handling
router.get('/', authMiddleware, (req, res, next) => {
    try {
        dashboardController.getDashboardData(req, res, next);
    } catch (error) {
        next(error);
    }
});

router.get('/health/:memberId', authMiddleware, (req, res, next) => {
    try {
        dashboardController.getFamilyMemberHealth(req, res, next);
    } catch (error) {
        next(error);
    }
});

router.post('/process-document/:documentId', authMiddleware, (req, res, next) => {
    try {
        dashboardController.processDocument(req, res, next);
    } catch (error) {
        next(error);
    }
});

router.put('/health/:memberId', authMiddleware, (req, res, next) => {
    try {
        dashboardController.updateHealthMetrics(req, res, next);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
