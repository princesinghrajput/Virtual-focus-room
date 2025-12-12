const Message = require('../models/Message');
const multer = require('multer');
const { uploadToCloudinary } = require('../config/cloudinary');
const fs = require('fs');

// Configure multer for temporary file storage
const upload = multer({ dest: 'uploads/' });

// Get user messages
exports.getMessages = async (req, res) => {
    try {
        const userId = req.user._id;
        const { roomId, sessionId, limit = 50 } = req.query;

        const query = { userId };
        if (roomId) query.roomId = roomId;
        if (sessionId) query.sessionId = sessionId;

        const messages = await Message.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .populate('userId', 'name email');

        res.json({ success: true, messages });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Save message with optional media
exports.saveMessage = async (req, res) => {
    try {
        const { roomId, sessionId, content } = req.body;
        const userId = req.user._id;

        let mediaUrl = null;
        let mediaType = null;

        // Handle file upload if present
        if (req.file) {
            const uploadResult = await uploadToCloudinary(req.file);
            mediaUrl = uploadResult.url;
            mediaType = uploadResult.type === 'image' ? 'image' : uploadResult.type === 'video' ? 'video' : 'file';

            // Delete temporary file after successful upload
            if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
        }

        const message = new Message({
            userId,
            roomId,
            sessionId,
            content: content || '', // Ensure content is not undefined
            mediaUrl,
            mediaType
        });

        await message.save();
        res.json({ success: true, message });
    } catch (error) {
        console.error('Error saving message:', error);
        // Clean up temp file on error if it still exists
        try {
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
        } catch (unlinkError) {
            console.error('Error deleting temp file:', unlinkError);
        }
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Multer middleware export
exports.uploadMiddleware = upload.single('media');
