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
    console.log('Adding message attachment fields...\n');

    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrations', 'add-message-attachments.sql'),
      'utf8'
    );

    await connection.query(migrationSQL);
    console.log('✅ Migration completed successfully!');
    console.log('Added fields: attachment_data, attachment_filename, attachment_size, attachment_type');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

runMigration();
