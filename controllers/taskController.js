const TaskService = require('../services/taskService');

class TaskController {
  static async createTask(req, res, next) {
    try {
      const { title, description, projectId, assignedTo } = req.body;
      const task = await TaskService.createTask({ title, description, projectId, assignedTo }, req.user);

      res.status(201).json({
        success: true,
        message: 'Task created successfully.',
        data: task
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req, res, next) {
    try {
      const taskId = parseInt(req.params.id, 10);
      const { status } = req.body;
      if (isNaN(taskId)) {
        const error = new Error('Invalid task ID.');
        error.statusCode = 400;
        throw error;
      }

      const task = await TaskService.updateStatus(taskId, status, req.user);

      res.status(200).json({
        success: true,
        message: 'Task status updated successfully.',
        data: task
      });
    } catch (error) {
      next(error);
    }
  }

  static async assignUser(req, res, next) {
    try {
      const taskId = parseInt(req.params.id, 10);
      const { assignedTo } = req.body;
      if (isNaN(taskId)) {
        const error = new Error('Invalid task ID.');
        error.statusCode = 400;
        throw error;
      }

      const task = await TaskService.assignTask(taskId, assignedTo, req.user);

      res.status(200).json({
        success: true,
        message: 'Task assignment updated successfully.',
        data: task
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTasksByProject(req, res, next) {
    try {
      const projectId = parseInt(req.params.projectId, 10);
      if (isNaN(projectId)) {
        const error = new Error('Invalid project ID.');
        error.statusCode = 400;
        throw error;
      }

      const tasks = await TaskService.getTasksByProject(projectId, req.user);

      res.status(200).json({
        success: true,
        data: tasks
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteTask(req, res, next) {
    try {
      const taskId = parseInt(req.params.id, 10);
      if (isNaN(taskId)) {
        const error = new Error('Invalid task ID.');
        error.statusCode = 400;
        throw error;
      }

      await TaskService.deleteTask(taskId, req.user);

      res.status(200).json({
        success: true,
        message: 'Task deleted successfully.',
        data: { id: taskId }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = TaskController;
