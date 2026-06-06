const express = require('express');
const TaskController = require('../controllers/taskController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { validateCreateTask, validateUpdateTaskStatus, validateAssignTask } = require('../middleware/validatorMiddleware');

const router = express.Router();

router.post('/', authenticateToken, validateCreateTask, TaskController.createTask);
router.patch('/:id/status', authenticateToken, validateUpdateTaskStatus, TaskController.updateStatus);
router.patch('/:id/assign', authenticateToken, validateAssignTask, TaskController.assignUser);
router.get('/project/:projectId', authenticateToken, TaskController.getTasksByProject);
router.delete('/:id', authenticateToken, TaskController.deleteTask);

module.exports = router;
