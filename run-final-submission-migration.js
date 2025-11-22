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
    console.log('Adding final submission and review fields...\n');

    const sqlPath = path.join(__dirname, 'migrations', 'add-final-submission-fields.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    await connection.query(sql);

    console.log('✅ Migration completed successfully!\n');
    console.log('New fields added:');
    console.log('  - final_submission_data (LONGBLOB) - Final work file');
    console.log('  - final_submission_filename (VARCHAR) - Final filename');
    console.log('  - final_submission_size (INT) - File size');
    console.log('  - final_submission_type (VARCHAR) - MIME type');
    console.log('  - final_submitted_at (TIMESTAMP) - Submission time');
    console.log('  - final_submission_notes (TEXT) - Doctor notes');
    console.log('  - client_review_status (ENUM) - pending/accepted/rejected');
    console.log('  - client_review_notes (TEXT) - Client feedback');
    console.log('  - client_reviewed_at (TIMESTAMP) - Review time\n');
    
    console.log('Workflow enabled:');
    console.log('  1. Doctor submits final work');
    console.log('  2. Client reviews and accepts/rejects');
    console.log('  3. If accepted → status changes to "completed"');
    console.log('  4. If rejected → doctor revises and resubmits\n');

  } catch (error) {
    console.error('❌ Migration error:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

runMigration();
