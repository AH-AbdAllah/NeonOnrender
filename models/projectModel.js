const { pool } = require('../config/db');

class ProjectModel {
  static async createProject(name, description, ownerId) {
    const query = `
      INSERT INTO projects (name, description, owner_id)
      VALUES (?, ?, ?)
      RETURNING id
    `;
    const [result] = await pool.execute(query, [name, description, ownerId]);
    return (result[0] && result[0].insertId) || result.insertId || (result[0] && result[0].id) || null;
  }

  static async findAll() {
    const query = `
      SELECT p.id, p.name, p.description, p.owner_id, u.name as owner_name, p.created_at
      FROM projects p
      JOIN users u ON p.owner_id = u.id
      ORDER BY p.created_at DESC
    `;
    const [rows] = await pool.execute(query);
    return rows;
  }

  static async findByOwnerId(userId) {
    const query = `
      SELECT DISTINCT p.id, p.name, p.description, p.owner_id, u.name as owner_name, p.created_at
      FROM projects p
      JOIN users u ON p.owner_id = u.id
      LEFT JOIN tasks t ON p.id = t.project_id
      WHERE p.owner_id = ? OR t.assigned_to = ?
      ORDER BY p.created_at DESC
    `;
    const [rows] = await pool.execute(query, [userId, userId]);
    return rows;
  }

  static async findById(id) {
    const query = `
      SELECT p.id, p.name, p.description, p.owner_id, u.name as owner_name, p.created_at
      FROM projects p
      JOIN users u ON p.owner_id = u.id
      WHERE p.id = ?
    `;
    const [rows] = await pool.execute(query, [id]);
    return rows[0] || null;
  }
}

module.exports = ProjectModel;
