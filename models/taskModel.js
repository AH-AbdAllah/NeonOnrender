const { pool } = require('../config/db');

class TaskModel {
  static async createTask(title, description, projectId, assignedTo = null) {
    const query = `
      INSERT INTO tasks (title, description, status, project_id, assigned_to)
      VALUES (?, ?, 'Pending', ?, ?)
      RETURNING id
    `;
    const [result] = await pool.execute(query, [title, description, projectId, assignedTo]);
    return result.insertId;
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

  static async deleteTask(id) {
    const query = 'DELETE FROM tasks WHERE id = ?';
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  }
}

module.exports = TaskModel;
