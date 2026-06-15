const fs = require('fs');
const { pool } = require('./config/db');

async function initializeDatabase() {
  try {
    console.log('Reading schema.sql file...');
    const sqlFileContent = fs.readFileSync('schema.sql', 'utf8');

    // Split SQL by semicolons, taking care to ignore semicolons inside comments or strings
    // A simple split by semicolon is fine here as schema.sql doesn't have semicolons inside text
    const statements = sqlFileContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`Found ${statements.length} SQL statements. Executing on target database...`);

    for (let statement of statements) {
      // Clean SQL comments so they don't break simple database parsing
      const cleanedStatement = statement
        .replace(/--.*$/gm, '') // Remove single-line comments
        .trim();

      if (!cleanedStatement) continue;

      const lowerStmt = cleanedStatement.toLowerCase();
      if (lowerStmt.startsWith('create database') || lowerStmt.startsWith('use ')) {
        console.log(`[Skipped] Database management statement: ${cleanedStatement}`);
        continue;
      }

      console.log(`[Executing] ${cleanedStatement.split('\n')[0]}...`);
      await pool.execute(cleanedStatement);
    }

    console.log('PostgreSQL Database schema created and seeded successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Database migration/initialization failed:', error.message);
    process.exit(1);
  }
}

initializeDatabase();
