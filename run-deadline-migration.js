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
    console.log('⏰ Starting deadline reminders migration...\n');

    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', 'add-deadline-reminders.sql');
    const sql = await fs.readFile(migrationPath, 'utf8');

    // Execute the migration
    console.log('📝 Adding deadline tracking columns...');
    await connection.query(sql);

    console.log('\n✅ Migration completed successfully!');
    console.log('\n⏰ Deadline reminder features:');
    console.log('  ✓ deadline_reminder_sent column added');
    console.log('  ✓ overdue_notification_sent column added');
    console.log('  ✓ Deadline index for faster queries');
    console.log('  ✓ Ready for cron job integration');
    console.log('\n🎯 Next steps:');
    console.log('  1. Set up cron job to call /api/cron/deadline-reminders');
    console.log('  2. Set CRON_SECRET environment variable');
    console.log('  3. Configure email notifications (optional)');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    if (error.message.includes('Duplicate column')) {
      console.log('ℹ️  Columns already exist, skipping...');
    } else {
      console.error('Stack:', error.stack);
      process.exit(1);
    }
  } finally {
    await connection.end();
  }
}

runMigration();
