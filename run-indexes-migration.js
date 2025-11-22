const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

async function runMigration() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Gorpunadoue@95',
    database: 'medconsult_liberia',
    multipleStatements: true
  });

  try {
    console.log('🚀 Starting database optimization migration...\n');

    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', 'add-indexes-and-status.sql');
    const sql = await fs.readFile(migrationPath, 'utf8');

    // Execute the migration
    console.log('📝 Adding indexes and updating status enum...');
    await connection.query(sql);

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📊 Database optimizations applied:');
    console.log('  ✓ Added indexes on assignment_requests (client_id, doctor_id, status, deadline, created_at)');
    console.log('  ✓ Added indexes on assignment_messages (assignment_request_id, sender_id, created_at)');
    console.log('  ✓ Added indexes on users (role, email)');
    console.log('  ✓ Added "revision_requested" to status enum');
    console.log('\n🚀 Your queries should now be faster!');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

runMigration();
