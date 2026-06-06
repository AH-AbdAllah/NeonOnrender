const TaskModel = require('../models/taskModel');
const ProjectModel = require('../models/projectModel');
const UserModel = require('../models/userModel');
const LogService = require('./logService');

class TaskService {
  static async createTask({ title, description, projectId, assignedTo }, userContext) {
    // 1. Verify project exists
    const project = await ProjectModel.findById(projectId);
    if (!project) {
      const error = new Error('Project not found.');
      error.statusCode = 404;
      throw error;
    }

    // 2. Authorization boundary: Standard users can only create tasks in projects they own
    if (userContext.role !== 'Admin' && project.owner_id !== userContext.id) {
      const error = new Error('Access denied. You do not own this project.');
      error.statusCode = 403;
      throw error;
    }

    // 3. Verify assignee exists if specified
    if (assignedTo) {
      const assignee = await UserModel.findById(assignedTo);
      if (!assignee) {
        const error = new Error('Assignee user not found.');
        error.statusCode = 404;
        throw error;
      }
    }

    // 4. Create Task
    const taskId = await TaskModel.createTask(title, description, projectId, assignedTo);

    // 5. Log in Firestore
    LogService.logEvent('TASK_CREATED', userContext.id, taskId, projectId);

    return {
      id: taskId,
      title,
      description,
      status: 'Pending',
      projectId,
      assignedTo
    };
  }

  static async updateStatus(taskId, status, userContext) {
    // 1. Find the task
    const task = await TaskModel.findById(taskId);
    if (!task) {
      const error = new Error('Task not found.');
      error.statusCode = 404;
      throw error;
    }

    // 2. Authorization boundary: 
    // Admins can update any task.
    // Users can only update status if they own the project OR if the task is assigned to them.
    const isProjectOwner = task.project_owner_id === userContext.id;
    const isAssignee = task.assigned_to === userContext.id;

    if (userContext.role !== 'Admin' && !isProjectOwner && !isAssignee) {
      const error = new Error('Access denied. You are not authorized to update this task status.');
      error.statusCode = 403;
      throw error;
    }

    // 3. Update status
    await TaskModel.updateStatus(taskId, status);

    // 4. Log in Firestore
    LogService.logEvent('TASK_UPDATED', userContext.id, taskId, task.project_id);

    return {
      ...task,
      status
    };
  }

  static async assignTask(taskId, assignedTo, userContext) {
    // 1. Find the task
    const task = await TaskModel.findById(taskId);
    if (!task) {
      const error = new Error('Task not found.');
      error.statusCode = 404;
      throw error;
    }

    // 2. Authorization boundary: Only Admin or Project Owner can assign/unassign tasks
    const isProjectOwner = task.project_owner_id === userContext.id;
    if (userContext.role !== 'Admin' && !isProjectOwner) {
      const error = new Error('Access denied. You must be the project owner or Admin to assign tasks.');
      error.statusCode = 403;
      throw error;
    }

    // 3. Verify assignee user if assigning
    if (assignedTo !== null) {
      const assignee = await UserModel.findById(assignedTo);
      if (!assignee) {
        const error = new Error('Assignee user not found.');
        error.statusCode = 404;
        throw error;
      }
    }

    // 4. Assign
    await TaskModel.assignUser(taskId, assignedTo);

    // 5. Log in Firestore
    LogService.logEvent('TASK_ASSIGNED', userContext.id, taskId, task.project_id);

    return {
      ...task,
      assigned_to: assignedTo
    };
  }

  static async getTasksByProject(projectId, userContext) {
    // 1. Verify project exists
    const project = await ProjectModel.findById(projectId);
    if (!project) {
      const error = new Error('Project not found.');
      error.statusCode = 404;
      throw error;
    }

    const tasks = await TaskModel.findByProjectId(projectId);

    // 2. Authorization boundary: Standard users can only view tasks of projects they own or participate in
    if (userContext.role !== 'Admin' && project.owner_id !== userContext.id) {
      const isMember = tasks.some(t => t.assigned_to === userContext.id);
      if (!isMember) {
        const error = new Error('Access denied. You do not have permission to view tasks for this project.');
        error.statusCode = 403;
        throw error;
      }
    }

    return tasks;
  }

  static async deleteTask(taskId, userContext) {
    // 1. Find the task
    const task = await TaskModel.findById(taskId);
    if (!task) {
      const error = new Error('Task not found.');
      error.statusCode = 404;
      throw error;
    }

    // 2. Authorization: Only Admin or Project Owner can delete tasks
    const isProjectOwner = task.project_owner_id === userContext.id;
    if (userContext.role !== 'Admin' && !isProjectOwner) {
      const error = new Error('Access denied. You must be the project owner or Admin to delete tasks.');
      error.statusCode = 403;
      throw error;
    }

    // 3. Delete from DB
    await TaskModel.deleteTask(taskId);

    // 4. Log in Firestore
    LogService.logEvent('TASK_DELETED', userContext.id, taskId, task.project_id);

    return { id: taskId };
  }
}

module.exports = TaskService;
