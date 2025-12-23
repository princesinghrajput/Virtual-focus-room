const express = require('express');
const router = express.Router();
const { getStats, recordSession, getDashboardData, toggleSessionPrivacy } = require('../controllers/statsController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getStats);
router.get('/dashboard', protect, getDashboardData);
router.post('/session', protect, recordSession);
router.patch('/session/:sessionId/privacy', protect, toggleSessionPrivacy);

module.exports = router;
