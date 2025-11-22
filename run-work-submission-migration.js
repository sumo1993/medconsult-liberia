const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Gorpunadoue@95',
    database: 'medconsult_liberia',
  });

  try {
    console.log('Adding work submission fields to assignment_requests table...\n');

    const sqlPath = path.join(__dirname, 'migrations', 'add-work-submission-fields.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    await connection.query(sql);

    console.log('✅ Migration completed successfully!\n');
    console.log('New fields added:');
    console.log('  - work_file_data (LONGBLOB) - Stores the submitted work file');
    console.log('  - work_filename (VARCHAR) - Original filename');
    console.log('  - work_file_size (INT) - File size in bytes');
    console.log('  - work_file_type (VARCHAR) - MIME type');
    console.log('  - work_submitted_at (TIMESTAMP) - Submission timestamp');
    console.log('  - work_notes (TEXT) - Doctor\'s notes about submission\n');
    
    console.log('Doctors can now upload work files for clients to review!\n');

  } catch (error) {
    console.error('❌ Migration error:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

runMigration();
