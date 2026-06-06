const { pool } = require('../config/db');

class TaskModel {
  static async createTask(title, description, projectId, assignedTo = null) {
    const query = `
      INSERT INTO tasks (title, description, status, project_id, assigned_to)
      VALUES (?, ?, 'Pending', ?, ?)
      RETURNING id
    `;
    const [result] = await pool.execute(query, [title, description, projectId, assignedTo]);
    return result.insertId || (result[0] && result[0].id) || null;
  }

  static async findById(id) {
    const query = `
      SELECT t.id, t.title, t.description, t.status, t.project_id, t.assigned_to, 
             u.name as assignee_name, u.email as assignee_email, p.name as project_name, p.owner_id as project_owner_id, t.created_at
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.id = ?
    `;
    const [rows] = await pool.execute(query, [id]);
    return rows[0] || null;
  }

  static async findByProjectId(projectId) {
    const query = `
      SELECT t.id, t.title, t.description, t.status, t.project_id, t.assigned_to, 
             u.name as assignee_name, t.created_at
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.project_id = ?
      ORDER BY t.created_at ASC
    `;
    const [rows] = await pool.execute(query, [projectId]);
    return rows;
  }

  static async updateStatus(id, status) {
    const query = 'UPDATE tasks SET status = ? WHERE id = ?';
    const [result] = await pool.execute(query, [status, id]);
    return result.affectedRows > 0;
  }

  static async assignUser(id, assignedTo) {
    const query = 'UPDATE tasks SET assigned_to = ? WHERE id = ?';
    const [result] = await pool.execute(query, [assignedTo, id]);
    return result.affectedRows > 0;
  }

  // Get aggregated report counts for a single user
  static async getUserTaskStatistics(userId) {
    const query = `
      SELECT 
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending_tasks,
        SUM(CASE WHEN status = 'InProgress' THEN 1 ELSE 0 END) as in_progress_tasks,
        SUM(CASE WHEN status = 'Done' THEN 1 ELSE 0 END) as completed_tasks
      FROM tasks
      WHERE assigned_to = ?
    `;
    const [rows] = await pool.execute(query, [userId]);
    // Rows will return count values. Let's make sure SUM returns 0 instead of null if no tasks exist
    const stats = rows[0] || {};
    return {
      total: parseInt(stats.total_tasks || 0, 10),
      pending: parseInt(stats.pending_tasks || 0, 10),
      inProgress: parseInt(stats.in_progress_tasks || 0, 10),
      completed: parseInt(stats.completed_tasks || 0, 10)
    };
  }

  // Admin query to get aggregates across all users
  static async getAllUsersStatistics() {
    const query = `
      SELECT 
        u.id as user_id,
        u.name as user_name,
        u.email as user_email,
        COUNT(t.id) as total_tasks,
        SUM(CASE WHEN t.status = 'Pending' THEN 1 ELSE 0 END) as pending_tasks,
        SUM(CASE WHEN t.status = 'InProgress' THEN 1 ELSE 0 END) as in_progress_tasks,
        SUM(CASE WHEN t.status = 'Done' THEN 1 ELSE 0 END) as completed_tasks
      FROM users u
      LEFT JOIN tasks t ON u.id = t.assigned_to
      GROUP BY u.id, u.name, u.email
    `;
    const [rows] = await pool.execute(query);
    return rows.map(row => ({
      userId: row.user_id,
      userName: row.user_name,
      userEmail: row.user_email,
      total: parseInt(row.total_tasks || 0, 10),
      pending: parseInt(row.pending_tasks || 0, 10),
      inProgress: parseInt(row.in_progress_tasks || 0, 10),
      completed: parseInt(row.completed_tasks || 0, 10)
    }));
  }

  static async deleteTask(id) {
    const query = 'DELETE FROM tasks WHERE id = ?';
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  }
}

module.exports = TaskModel;
