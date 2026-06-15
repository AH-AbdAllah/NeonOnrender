const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || null;
let realPool;

if (connectionString) {
  realPool = new Pool({
    connectionString: connectionString.trim(),
    ssl: {
      rejectUnauthorized: false // Required for serverless Neon SSL connection
    },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000 // Allow up to 15 seconds for Neon cold starts
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
    connectionTimeoutMillis: 15000
  });
}

/**
 * Utility to convert mysql parameter format (using '?') into postgres format (using '$1', '$2', etc.)
 */
function convertPlaceholders(sql) {
  let index = 1;
  return sql.replace(/\?/g, () => `$${index++}`);
}

const pool = {
  execute: async (sql, params = []) => {
    const pgSql = convertPlaceholders(sql);
    const res = await realPool.query(pgSql, params);
    
    const rows = res.rows || [];
    const isSelect = sql.trim().toLowerCase().startsWith('select');
    
    if (isSelect) {
      return [rows, res.fields];
    } else {
      const resultObj = {
        affectedRows: res.rowCount || 0,
        insertId: rows.length > 0 ? (rows[0].id || null) : null
      };
      // Returns resultObj directly in the first slot for mutations
      return [resultObj, res.fields];
    }
  }
};

// Test connection function
async function testConnection() {
  const client = await realPool.connect();
  console.log('Successfully connected to PostgreSQL database (Neon/Live).');
  client.release();
  return true;
}

module.exports = {
  pool,
  testConnection
};
