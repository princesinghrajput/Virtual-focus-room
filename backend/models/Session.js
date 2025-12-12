const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    roomId: {
        type: String,
        required: true
    },
    roomName: {
        type: String,
        default: 'Focus Room'
    },
    joinedAt: {
        type: Date,
        required: true,
        default: Date.now
    },
    leftAt: {
        type: Date
    },
    duration: {
        type: Number, // in seconds
        default: 0
    },
    isPrivate: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Auto-calculate duration when leftAt is set
// Auto-calculate duration when leftAt is set
sessionSchema.pre('save', async function () {
    if (this.leftAt && this.joinedAt) {
        this.duration = Math.floor((this.leftAt - this.joinedAt) / 1000);
    }
});

module.exports = mongoose.model('Session', sessionSchema);
