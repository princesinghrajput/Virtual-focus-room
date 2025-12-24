const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tier = require('../models/Tier');

// Load env vars
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/focusroom';

const tiers = [
    {
        name: 'guest',
        permissions: {
            canToggleVideo: false,
            canToggleAudio: false,
            canChat: false,
            canShareScreen: false,
            canCreateRoom: true,
            canCreatePrivateRoom: false,
            canPingUsers: false,
            canSendAttachments: false,
        }
    },
    {
        name: 'free',
        permissions: {
            canToggleVideo: true,
            canToggleAudio: true,
            canChat: true,
            canShareScreen: true,
            canCreateRoom: true,
            canCreatePrivateRoom: false,
            canPingUsers: true,
            canSendAttachments: true,
        }
    },
    {
        name: 'premium',
        permissions: {
            canToggleVideo: true,
            canToggleAudio: true,
            canChat: true,
            canShareScreen: true,
            canCreateRoom: true,
            canCreatePrivateRoom: true,
            canPingUsers: true,
            canSendAttachments: true,
        }
    }
];

const seedTiers = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ MongoDB Connected');

        console.log('Seeding tiers...');
        for (const tierData of tiers) {
            await Tier.findOneAndUpdate(
                { name: tierData.name },
                { $set: tierData },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            console.log(`Processed tier: ${tierData.name}`);
        }

        console.log('✅ Seeding Completed Successfully');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding Error:', err);
        process.exit(1);
    }
};

seedTiers();
