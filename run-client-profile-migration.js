const mysql = require('mysql2/promise');
const fs = require('fs');
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
    console.log('Connected to database');

    // Read and execute the migration SQL
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrations', 'add-client-profile-fields.sql'),
      'utf8'
    );

    console.log('Running migration...');
    await connection.query(migrationSQL);
    console.log('✅ Migration completed successfully!');
    console.log('Added client profile fields to users table');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

runMigration();
