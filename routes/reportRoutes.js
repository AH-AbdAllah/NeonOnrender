const express = require('express');
const ReportController = require('../controllers/reportController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/user/:userId', authenticateToken, ReportController.getUserStatistics);
router.get('/all', authenticateToken, authorizeRoles('Admin'), ReportController.getAllUsersStatistics);

module.exports = router;
