const Tier = require('../models/Tier');

exports.getTiers = async (req, res) => {
    try {
        const tiers = await Tier.find({});

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
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
