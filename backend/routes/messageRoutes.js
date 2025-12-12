const express = require('express');
const router = express.Router();
const { getMessages, saveMessage, uploadMiddleware } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getMessages);
router.post('/', protect, uploadMiddleware, saveMessage);

module.exports = router;
