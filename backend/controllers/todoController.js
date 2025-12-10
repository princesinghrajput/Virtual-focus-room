const Todo = require('../models/Todo');

exports.getTodos = async (req, res) => {
    try {
        const { date, rangeStart, rangeEnd } = req.query;
        const query = { userId: req.user._id };

        // If specific date provided
        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            query.dueDate = {
                $gte: startOfDay,
                $lte: endOfDay
            };
        }
        // If range provided (for calendar indicators)
        else if (rangeStart && rangeEnd) {
            query.dueDate = {
                $gte: new Date(rangeStart),
                $lte: new Date(rangeEnd)
            };
        }

        const todos = await Todo.find(query).sort({ dueDate: 1, createdAt: 1 });
        res.status(200).json({ success: true, todos });
    } catch (error) {
        console.error('Get Todos Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createTodo = async (req, res) => {
    try {
        const { text, dueDate } = req.body;
        const todo = new Todo({
            userId: req.user._id,
            text,
            dueDate: dueDate || new Date()
        });
        await todo.save();
        res.status(201).json({ success: true, todo });
    } catch (error) {
        console.error('Create Todo Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.toggleTodo = async (req, res) => {
    try {
        const todo = await Todo.findOne({ _id: req.params.id, userId: req.user._id });
        if (!todo) return res.status(404).json({ success: false, message: 'Todo not found' });

        todo.isCompleted = !todo.isCompleted;
        await todo.save();
        res.status(200).json({ success: true, todo });
    } catch (error) {
        console.error('Toggle Todo Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteTodo = async (req, res) => {
    try {
        await Todo.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        res.status(200).json({ success: true, message: 'Deleted' });
    } catch (error) {
        console.error('Delete Todo Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
