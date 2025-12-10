const express = require('express');
const router = express.Router();
const todoController = require('../controllers/todoController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/', todoController.getTodos);
router.post('/', todoController.createTodo);
router.patch('/:id/toggle', todoController.toggleTodo);
router.delete('/:id', todoController.deleteTodo);

module.exports = router;
