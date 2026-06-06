const ProjectModel = require('../models/projectModel');
const TaskModel = require('../models/taskModel');
const LogService = require('./logService');

class ProjectService {
  static async createProject({ name, description, ownerId }) {
    const projectId = await ProjectModel.createProject(name, description, ownerId);
    
    // Log project creation in Firestore
    LogService.logEvent('PROJECT_CREATED', ownerId, null, projectId);
    
    return {
      id: projectId,
      name,
      description,
      ownerId
    };
  }

  static async getProjects(userContext) {
    if (userContext.role === 'Admin') {
      return await ProjectModel.findAll();
    } else {
      // Standard users can view projects they own or are members of
      return await ProjectModel.findByOwnerId(userContext.id);
    }
  }

  static async getProjectById(projectId, userContext) {
    const project = await ProjectModel.findById(projectId);
    
    if (!project) {
      const error = new Error('Project not found.');
      error.statusCode = 404;
      throw error;
    }

    // Role verification: Non-admins can access their own projects OR projects they participate in
    if (userContext.role !== 'Admin' && project.owner_id !== userContext.id) {
      const tasks = await TaskModel.findByProjectId(projectId);
      const isMember = tasks.some(t => t.assigned_to === userContext.id);
      if (!isMember) {
        const error = new Error('Access denied. You do not own or participate in this project.');
        error.statusCode = 403;
        throw error;
      }
    }

    return project;
  }
}

module.exports = ProjectService;
