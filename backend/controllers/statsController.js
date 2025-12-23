const Session = require('../models/Session');
const Todo = require('../models/Todo');
const Message = require('../models/Message');

// Get user statistics
exports.getStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const now = new Date();

        // Calculate date ranges
        const startOfToday = new Date(now.setHours(0, 0, 0, 0));
        const startOfWeek = new Date(now.setDate(now.getDate() - 7));
        const startOfMonth = new Date(now.setDate(now.getDate() - 30));

        // Today's stats
        const todayTasks = await Todo.countDocuments({
            userId,
            dueDate: { $gte: startOfToday }
        });

        const todayCompleted = await Todo.countDocuments({
            userId,
            dueDate: { $gte: startOfToday },
            isCompleted: true
        });

        const todayMeetingTime = await Session.aggregate([
            { $match: { userId: req.user._id, joinedAt: { $gte: startOfToday } } },
            { $group: { _id: null, total: { $sum: '$duration' } } }
        ]);

        // Weekly stats
        const weekTasks = await Todo.countDocuments({
            userId,
            dueDate: { $gte: startOfWeek }
        });

        const weekCompleted = await Todo.countDocuments({
            userId,
            dueDate: { $gte: startOfWeek },
            isCompleted: true
        });

        const weekMeetingTime = await Session.aggregate([
            { $match: { userId: req.user._id, joinedAt: { $gte: startOfWeek } } },
            { $group: { _id: null, total: { $sum: '$duration' } } }
        ]);

        // Monthly stats
        const monthTasks = await Todo.countDocuments({
            userId,
            dueDate: { $gte: startOfMonth }
        });

        const monthCompleted = await Todo.countDocuments({
            userId,
            dueDate: { $gte: startOfMonth },
            isCompleted: true
        });

        const monthMeetingTime = await Session.aggregate([
            { $match: { userId: req.user._id, joinedAt: { $gte: startOfMonth } } },
            { $group: { _id: null, total: { $sum: '$duration' } } }
        ]);

        // All-time stats
        const totalTasks = await Todo.countDocuments({ userId });
        const totalCompleted = await Todo.countDocuments({ userId, isCompleted: true });
        const totalMeetingTime = await Session.aggregate([
            { $match: { userId: req.user._id } },
            { $group: { _id: null, total: { $sum: '$duration' } } }
        ]);

        // Daily breakdown for charts (last 7 days)
        const dailyStats = await Session.aggregate([
            { $match: { userId: req.user._id, joinedAt: { $gte: startOfWeek } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$joinedAt' } },
                    duration: { $sum: '$duration' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            success: true,
            stats: {
                today: {
                    tasks: todayTasks,
                    completed: todayCompleted,
                    meetingTime: todayMeetingTime[0]?.total || 0
                },
                week: {
                    tasks: weekTasks,
                    completed: weekCompleted,
                    meetingTime: weekMeetingTime[0]?.total || 0
                },
                month: {
                    tasks: monthTasks,
                    completed: monthCompleted,
                    meetingTime: monthMeetingTime[0]?.total || 0
                },
                total: {
                    tasks: totalTasks,
                    completed: totalCompleted,
                    meetingTime: totalMeetingTime[0]?.total || 0
                },
                dailyBreakdown: dailyStats
            }
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Record session event
exports.recordSession = async (req, res) => {
    try {
        const { roomId, roomName, event, sessionId } = req.body;
        const userId = req.user._id;

        if (event === 'start') {
            const session = new Session({
                userId,
                roomId,
                roomName: roomName || 'Focus Room',
                joinedAt: new Date()
            });
            await session.save();
            return res.json({ success: true, sessionId: session._id });
        } else if (event === 'end' && sessionId) {
            const session = await Session.findById(sessionId);
            if (session && session.userId.toString() === userId.toString()) {
                session.leftAt = new Date();
                await session.save();
                return res.json({ success: true, duration: session.duration });
            }
        }

        res.status(400).json({ success: false, message: 'Invalid session event' });
    } catch (error) {
        console.error('Error recording session:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get comprehensive dashboard data
exports.getDashboardData = async (req, res) => {
    try {
        const userId = req.user._id;
        const now = new Date();
        const startOfWeek = new Date();
        startOfWeek.setDate(now.getDate() - 7);

        // Get recent sessions with room names
        const recentSessions = await Session.find({ userId })
            .sort({ joinedAt: -1 })
            .limit(10)
            .select('roomId roomName joinedAt leftAt duration');

        // Get recent messages with media
        const recentMessages = await Message.find({ userId })
            .sort({ createdAt: -1 })
            .limit(20)
            .populate('userId', 'name');

        // Get stats - create a mock res object to capture the data
        let statsData = {};
        const mockRes = {
            json: (data) => {
                statsData = data.stats || {};
                return data;
            }
        };

        await exports.getStats(req, mockRes);

        res.json({
            success: true,
            data: {
                stats: statsData,
                recentSessions,
                recentMessages
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Toggle session privacy
exports.toggleSessionPrivacy = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user._id;

        const session = await Session.findOne({ _id: sessionId, userId });
        if (!session) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }

        session.isPrivate = !session.isPrivate;
        await session.save();

        res.json({ success: true, isPrivate: session.isPrivate });
    } catch (error) {
        console.error('Error toggling privacy:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
