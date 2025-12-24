const mongoose = require('mongoose');

const TierSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        enum: ['guest', 'free', 'premium'] // User tiers from the request
    },
    permissions: {
        canToggleVideo: { type: Boolean, default: false },
        canToggleAudio: { type: Boolean, default: false },
        canChat: { type: Boolean, default: false },
        canShareScreen: { type: Boolean, default: false },
        canCreateRoom: { type: Boolean, default: false },
        canCreatePrivateRoom: { type: Boolean, default: false },
        canPingUsers: { type: Boolean, default: false },
        canSendAttachments: { type: Boolean, default: false }
    }
}, { timestamps: true });

module.exports = mongoose.model('Tier', TierSchema);
