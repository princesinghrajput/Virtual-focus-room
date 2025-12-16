const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');

// @desc    Send friend request
// @route   POST /api/friends/request
exports.sendFriendRequest = async (req, res) => {
    try {
        const { receiverId } = req.body;
        const senderId = req.user.id;

        if (senderId === receiverId) {
            return res.status(400).json({ success: false, message: 'Cannot add yourself' });
        }

        const receiver = await User.findById(receiverId);
        if (!receiver) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Check if already friends
        if (receiver.friends.includes(senderId)) {
            return res.status(400).json({ success: false, message: 'Already friends' });
        }

        // Check if request already exists
        const existingRequest = await FriendRequest.findOne({
            sender: senderId,
            receiver: receiverId,
            status: 'pending'
        });

        if (existingRequest) {
            return res.status(400).json({ success: false, message: 'Request already sent' });
        }

        const request = await FriendRequest.create({
            sender: senderId,
            receiver: receiverId
        });

        res.status(201).json({ success: true, message: 'Friend request sent', request });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Accept friend request
// @route   POST /api/friends/accept
exports.acceptFriendRequest = async (req, res) => {
    try {
        const { requestId } = req.body;
        const userId = req.user.id;

        const request = await FriendRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        if (request.receiver.toString() !== userId) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Request already handled' });
        }

        request.status = 'accepted';
        await request.save();

        // Add to both users' friends list
        await User.findByIdAndUpdate(request.sender, { $addToSet: { friends: request.receiver } });
        await User.findByIdAndUpdate(request.receiver, { $addToSet: { friends: request.sender } });

        res.json({ success: true, message: 'Friend request accepted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Reject friend request
// @route   POST /api/friends/reject
exports.rejectFriendRequest = async (req, res) => {
    try {
        const { requestId } = req.body;
        const userId = req.user.id;

        const request = await FriendRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        if (request.receiver.toString() !== userId) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        request.status = 'rejected';
        await request.save();

        res.json({ success: true, message: 'Friend request rejected' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get all details (friends, pending requests sent/received)
// @route   GET /api/friends/details
exports.getFriendDetails = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get user with friends populated
        const user = await User.findById(userId).populate('friends', 'name email _id');

        // Get pending requests received
        const receivedRequests = await FriendRequest.find({
            receiver: userId,
            status: 'pending'
        }).populate('sender', 'name email _id');

        // Get pending requests sent
        const sentRequests = await FriendRequest.find({
            sender: userId,
            status: 'pending'
        }).populate('receiver', 'name email _id');

        res.json({
            success: true,
            friends: user.friends,
            receivedRequests,
            sentRequests
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Search users to add
// @route   GET /api/friends/search?q=name
exports.searchUsers = async (req, res) => {
    try {
        const query = req.query.q;
        const userId = req.user.id;

        if (!query) return res.json({ success: true, users: [] });

        const users = await User.find({
            name: { $regex: query, $options: 'i' },
            _id: { $ne: userId }
        }).select('name email _id').limit(10);

        res.json({ success: true, users });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
