const express = require('express');
const router = express.Router();
const { signup, login, getProfile, upgradeToPremium, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/signup', signup);
router.post('/login', login);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/upgrade', protect, upgradeToPremium);

module.exports = router;
