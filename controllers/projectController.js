const ProjectService = require('../services/projectService');

class ProjectController {
  static async createProject(req, res, next) {
    try {
      const { name, description, ownerId: bodyOwnerId } = req.body;
      let ownerId = req.user.id;
      
      // Admin can provision projects for any user
      if (req.user.role === 'Admin' && bodyOwnerId) {
        ownerId = parseInt(bodyOwnerId, 10);
      }

      const project = await ProjectService.createProject({ name, description, ownerId });

      res.status(201).json({
        success: true,
        message: 'Project created successfully.',
        data: project
      });
    } catch (error) {
      next(error);
    }
  }

  static async getProjects(req, res, next) {
    try {
      const projects = await ProjectService.getProjects(req.user);

      res.status(200).json({
        success: true,
        data: projects
      });
    } catch (error) {
      next(error);
    }
  }

  static async getProjectById(req, res, next) {
    try {
      const projectId = parseInt(req.params.id, 10);
      if (isNaN(projectId)) {
        const error = new Error('Invalid project ID.');
        error.statusCode = 400;
        throw error;
      }

      const project = await ProjectService.getProjectById(projectId, req.user);

      res.status(200).json({
        success: true,
        data: project
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ProjectController;
