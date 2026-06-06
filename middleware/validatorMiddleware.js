/**
 * central request input validation middleware
 */

function validateRegister(req, res, next) {
  const { name, email, password, role } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('Name is required and cannot be empty.');
  }

  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.push('A valid email is required.');
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.push('Password is required and must be at least 6 characters.');
  }

  if (role && !['Admin', 'User'].includes(role)) {
    errors.push('Role must be either Admin or User.');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  // Sanitize
  req.body.name = name.trim();
  req.body.email = email.trim().toLowerCase();
  next();
}

function validateLogin(req, res, next) {
  const { email, password } = req.body;
  const errors = [];

  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.push('A valid email is required.');
  }

  if (!password || typeof password !== 'string' || password.length === 0) {
    errors.push('Password is required.');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  req.body.email = email.trim().toLowerCase();
  next();
}

function validateCreateProject(req, res, next) {
  const { name, description } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('Project name is required and cannot be empty.');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  req.body.name = name.trim();
  req.body.description = description ? description.trim() : '';
  next();
}

function validateCreateTask(req, res, next) {
  const { title, description, projectId, assignedTo } = req.body;
  const errors = [];

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    errors.push('Task title is required.');
  }

  if (!projectId || isNaN(parseInt(projectId, 10))) {
    errors.push('A valid projectId is required.');
  }

  if (assignedTo !== undefined && assignedTo !== null && isNaN(parseInt(assignedTo, 10))) {
    errors.push('assignedTo must be a valid integer user ID or null.');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  req.body.title = title.trim();
  req.body.description = description ? description.trim() : '';
  req.body.projectId = parseInt(projectId, 10);
  req.body.assignedTo = assignedTo ? parseInt(assignedTo, 10) : null;
  next();
}

function validateUpdateTaskStatus(req, res, next) {
  const { status } = req.body;
  const validStatuses = ['Pending', 'InProgress', 'Done'];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid task status. Must be one of: ${validStatuses.join(', ')}`
    });
  }

  next();
}

function validateAssignTask(req, res, next) {
  const { assignedTo } = req.body;

  // Expecting assignedTo to be a valid number or null (to unassign)
  if (assignedTo !== null && (assignedTo === undefined || isNaN(parseInt(assignedTo, 10)))) {
    return res.status(400).json({
      success: false,
      message: 'assignedTo must be a valid integer user ID or null.'
    });
  }

  if (assignedTo !== null) {
    req.body.assignedTo = parseInt(assignedTo, 10);
  }
  next();
}

module.exports = {
  validateRegister,
  validateLogin,
  validateCreateProject,
  validateCreateTask,
  validateUpdateTaskStatus,
  validateAssignTask
};
