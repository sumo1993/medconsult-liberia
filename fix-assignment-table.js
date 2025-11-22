const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function fixTable() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Gorpunadoue@95',
    database: 'medconsult_liberia',
    multipleStatements: true
  });

  try {
    console.log('Fixing assignment_requests table...\n');

    // Drop old tables (in correct order due to foreign keys)
    console.log('Dropping old tables...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('DROP TABLE IF EXISTS assignment_submissions');
    await connection.query('DROP TABLE IF EXISTS assignment_files');
    await connection.query('DROP TABLE IF EXISTS assignment_messages');
    await connection.query('DROP TABLE IF EXISTS assignment_requests');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ Old tables dropped\n');

    // Create new tables
    console.log('Creating new tables with correct structure...');
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrations', 'add-assignment-request-workflow.sql'),
      'utf8'
    );

    await connection.query(migrationSQL);
    console.log('✅ New tables created!\n');

    // Verify
    const [columns] = await connection.query("DESCRIBE assignment_requests");
    console.log('New table structure:');
    console.log(columns.map(c => `  ${c.Field} (${c.Type})`).join('\n'));

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

fixTable();
