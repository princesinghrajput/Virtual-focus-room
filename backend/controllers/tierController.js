const Tier = require('../models/Tier');

// Default tier permissions (used if DB is empty)
const DEFAULT_TIERS = {
    guest: {
        canToggleVideo: false,
        canToggleAudio: false,
        canChat: false,
        canShareScreen: false,
        canCreateRoom: true,
        canCreatePrivateRoom: false,
        canPingUsers: false,
        canSendAttachments: false,
    },
    free: {
        canToggleVideo: true,
        canToggleAudio: true,
        canChat: true,
        canShareScreen: true,
        canCreateRoom: true,
        canCreatePrivateRoom: false,
        canPingUsers: true,
        canSendAttachments: true,
    },
    premium: {
        canToggleVideo: true,
        canToggleAudio: true,
        canChat: true,
        canShareScreen: true,
        canCreateRoom: true,
        canCreatePrivateRoom: true,
        canPingUsers: true,
        canSendAttachments: true,
    }
};

exports.getTiers = async (req, res) => {
    try {
        const tiers = await Tier.find({});

        // If no tiers in DB, return defaults
        if (!tiers || tiers.length === 0) {
            return res.status(200).json({
                success: true,
                tiers: DEFAULT_TIERS
            });
        }

        // Convert to map for easier frontend lookup: { 'guest': { ... }, 'free': { ... } }
        const tierMap = {};
        tiers.forEach(t => {
            tierMap[t.name] = t.permissions;
        });

        res.status(200).json({
            success: true,
            tiers: tierMap
        });
    } catch (error) {
        console.error('Get Tiers Error:', error);
        // Return defaults on error
        res.status(200).json({
            success: true,
            tiers: DEFAULT_TIERS
        });
    }
};
