const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    roomId: {
        type: String,
        required: true,
        index: true
    },
    sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Session'
    },
    content: {
        type: String
    },
    mediaUrl: {
        type: String // Cloudinary URL if media attached
    },
    mediaType: {
        type: String, // 'image', 'video', 'file'
        enum: ['image', 'video', 'file', null]
    }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
