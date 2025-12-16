const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    getFriendDetails,
    searchUsers
} = require('../controllers/friendController');

router.post('/request', protect, sendFriendRequest);
router.post('/accept', protect, acceptFriendRequest);
router.post('/reject', protect, rejectFriendRequest);
router.get('/details', protect, getFriendDetails);
router.get('/search', protect, searchUsers);

module.exports = router;
