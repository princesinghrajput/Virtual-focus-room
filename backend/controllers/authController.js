const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Secret key for JWT (in production should be in .env)
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_this';

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, JWT_SECRET, { expiresIn: '7d' });
};

// @desc    Register new user
// @route   POST /api/auth/signup
exports.signup = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = await User.create({
            name,
            email,
            password: hashedPassword
        });

        if (user) {
            res.status(201).json({
                success: true,
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    tier: user.tier,
                    isPremium: user.isPremium,
                    friends: user.friends
                },
                token: generateToken(user._id)
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check for user email
        const user = await User.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password))) {
            res.json({
                success: true,
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    tier: user.tier,
                    isPremium: user.isPremium,
                    friends: user.friends
                },
                token: generateToken(user._id)
            });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (user) {
            res.json({ success: true, user });
        } else {
            res.status(404).json({ success: false, message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Upgrade user to premium
// @route   POST /api/auth/upgrade
exports.upgradeToPremium = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (user) {
            user.isPremium = true;
            user.tier = 'premium';
            await user.save();

            res.json({
                success: true,
                message: 'Upgraded to Premium successfully',
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    tier: user.tier,
                    isPremium: user.isPremium
                }
            });
        } else {
            res.status(404).json({ success: false, message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
// @desc    Update user profile
// @route   PUT /api/auth/profile
exports.updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const { name, password, newPassword } = req.body;

        if (user) {
            user.name = name || user.name;

            if (newPassword && password) {
                // Verify old password
                const isMatch = await bcrypt.compare(password, user.password);
                if (!isMatch) {
                    return res.status(400).json({ success: false, message: 'Invalid current password' });
                }

                // Set new password
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(newPassword, salt);
            }

            const updatedUser = await user.save();

            res.json({
                success: true,
                user: {
                    _id: updatedUser._id,
                    name: updatedUser.name,
                    email: updatedUser.email,
                    tier: updatedUser.tier,
                    isPremium: updatedUser.isPremium,
                    friends: updatedUser.friends
                }
            });
        } else {
            res.status(404).json({ success: false, message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
