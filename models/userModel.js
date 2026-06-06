const { pool } = require('../config/db');

class UserModel {
  static async createUser(name, email, passwordHash, role = 'User') {
    const query = `
      INSERT INTO users (name, email, password_hash, role)
      VALUES (?, ?, ?, ?)
      RETURNING id
    `;
    const [result] = await pool.execute(query, [name, email, passwordHash, role]);
    return result.insertId || (result[0] && result[0].id) || null;
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = ?';
    const [rows] = await pool.execute(query, [email]);
    return rows[0] || null;
  }

  static async findById(id) {
    const query = 'SELECT id, name, email, role, created_at FROM users WHERE id = ?';
    const [rows] = await pool.execute(query, [id]);
    return rows[0] || null;
  }

  static async listAll() {
    const query = 'SELECT id, name, email, role, created_at FROM users';
    const [rows] = await pool.execute(query);
    return rows;
  }
}

module.exports = UserModel;
