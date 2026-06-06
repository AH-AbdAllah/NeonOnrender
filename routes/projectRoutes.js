const express = require('express');
const ProjectController = require('../controllers/projectController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { validateCreateProject } = require('../middleware/validatorMiddleware');

const router = express.Router();

router.post('/', authenticateToken, validateCreateProject, ProjectController.createProject);
router.get('/', authenticateToken, ProjectController.getProjects);
router.get('/:id', authenticateToken, ProjectController.getProjectById);

module.exports = router;
