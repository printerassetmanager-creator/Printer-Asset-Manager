const express = require('express');
const router = express.Router();
const CleanupController = require('../controllers/cleanupController');

// Initialize controller
const cleanupController = new CleanupController();

// Server connection and management
router.post('/connect-server', cleanupController.connectServer.bind(cleanupController));

// Cleanup operations
router.post('/cleanup-server', cleanupController.runServerCleanup.bind(cleanupController));
router.post('/bulk-cleanup', cleanupController.runBulkCleanup.bind(cleanupController));

// Scheduling
router.post('/schedule-cleanup', cleanupController.scheduleCleanup.bind(cleanupController));

// Status and monitoring
router.get('/cleanup-status', cleanupController.getCleanupStatus.bind(cleanupController));
router.get('/cleanup-history', cleanupController.getCleanupHistory.bind(cleanupController));
router.get('/logs/:serverName', cleanupController.getCleanupLogs.bind(cleanupController));
router.get('/active-sessions', cleanupController.getActiveSessions.bind(cleanupController));
router.get('/queue-status', cleanupController.getQueueStatus.bind(cleanupController));

// Analytics
router.get('/analytics', cleanupController.getCleanupAnalytics.bind(cleanupController));

module.exports = router;