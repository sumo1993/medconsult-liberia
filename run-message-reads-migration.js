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
    console.log('Creating assignment_message_reads table...\n');

    const sqlPath = path.join(__dirname, 'migrations', 'create-message-reads-table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    await connection.query(sql);

    console.log('✅ Table created successfully!\n');
    console.log('This table tracks when users last read messages for each assignment.');
    console.log('It enables unread message notifications.\n');

  } catch (error) {
    console.error('❌ Migration error:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

runMigration();
