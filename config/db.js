const { Pool } = require('pg');
const MockDbStore = require('./mockDbStore');
require('dotenv').config();

let realPool;
let isMock = false;

if (process.env.DB_MOCK === 'true') {
  isMock = true;
} else {
  try {
    // Neon database URL is preferred. If not found, build from components.
    const connectionString = process.env.DATABASE_URL || null;

    if (connectionString) {
      realPool = new Pool({
        connectionString: connectionString.trim(),
        ssl: {
          rejectUnauthorized: false // Required for serverless Neon SSL connection
        },
        max: 10, // Optimal pool size for serverless database concurrency
        idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
        connectionTimeoutMillis: 2000 // Return connection error fast if Neon is unresponsive
      });
    } else {
      const host = (process.env.DB_HOST || '127.0.0.1').trim();
      const port = parseInt((process.env.DB_PORT || '5432').trim(), 10);
      const user = (process.env.DB_USER || 'postgres').trim();
      const password = (process.env.DB_PASSWORD || '').trim();
      const database = (process.env.DB_NAME || 'taskflow_db').trim();
      const sslVal = (process.env.DB_SSL || 'true').trim();

      realPool = new Pool({
        host,
        port,
        user,
        password,
        database,
        ssl: sslVal === 'true' ? { rejectUnauthorized: false } : false,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000
      });
    }
  } catch (error) {
    console.warn('Could not initialize PostgreSQL pool:', error.message);
    isMock = true;
  }
}

/**
 * Utility to convert mysql parameter format (using '?') into postgres format (using '$1', '$2', etc.)
 * E.g., SELECT * FROM users WHERE email = ? AND role = ?
 * becomes: SELECT * FROM users WHERE email = $1 AND role = $2
 */
function convertPlaceholders(sql) {
  let index = 1;
  return sql.replace(/\?/g, () => `$${index++}`);
}

const pool = {
  execute: async (sql, params = []) => {
    if (isMock || process.env.DB_MOCK === 'true') {
      return await MockDbStore.execute(sql, params);
    }
    try {
      const pgSql = convertPlaceholders(sql);
      const res = await realPool.query(pgSql, params);
      
      // Mimic mysql2 return schema [rows, fields]
      // We also inject mysql2 style result properties for mutations: affectedRows and insertId
      const rows = res.rows || [];
      const resultObj = {
        affectedRows: res.rowCount || 0,
        insertId: rows.length > 0 ? (rows[0].id || null) : null
      };

      // If it's a SELECT, rows will contain the array.
      // If it's an INSERT/UPDATE/DELETE, we return resultObj as first element so models get insertId/affectedRows.
      const isSelect = sql.trim().toLowerCase().startsWith('select');
      const firstArg = isSelect ? rows : [resultObj];
      return [firstArg, res.fields];
    } catch (error) {
      if (
        error.code === 'ECONNREFUSED' || 
        error.code === 'ENOTFOUND' || 
        error.code === 'ETIMEDOUT' || 
        error.code === '28P01' || // Invalid authorization specification in pg
        error.code === '3D000' || // Database does not exist in pg
        error.message.includes('password authentication failed') ||
        error.message.includes('Connection terminated')
      ) {
        console.warn(`[PostgreSQL Fallback] Database connection or authorization failed (${error.code || 'Connection Error'}). Switching to in-memory mock.`);
        isMock = true;
        return await MockDbStore.execute(sql, params);
      }
      throw error;
    }
  }
};

// Test connection function
async function testConnection() {
  if (isMock || process.env.DB_MOCK === 'true') {
    console.log('Successfully connected to PostgreSQL database (MOCK Mode).');
    return true;
  }
  try {
    const client = await realPool.connect();
    console.log('Successfully connected to PostgreSQL database (Neon/Live).');
    client.release();
    return true;
  } catch (error) {
    console.warn('--- POSTGRESQL DATABASE INACTIVE ---');
    console.warn(`Reason: ${error.message}`);
    console.warn('TaskFlow will fall back to local in-memory database mode.');
    console.warn('-----------------------------------');
    isMock = true;
    return true; // Return true to let server start up gracefully in mock mode
  }
}

module.exports = {
  pool,
  testConnection,
  getIsMock: () => isMock
};
