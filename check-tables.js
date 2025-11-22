const mysql = require('mysql2/promise');

async function checkTables() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Gorpunadoue@95',
    database: 'medconsult_liberia',
  });

  try {
    console.log('Checking tables...\n');

    const [tables] = await connection.query("SHOW TABLES LIKE 'assignment%'");
    console.log('Assignment tables:', tables);

    if (tables.length === 0) {
      console.log('\n❌ No assignment tables found!');
      console.log('Running migration...\n');
      
      const fs = require('fs');
      const path = require('path');
      const migrationSQL = fs.readFileSync(
        path.join(__dirname, 'migrations', 'add-assignment-request-workflow.sql'),
        'utf8'
      );
      
      await connection.query(migrationSQL);
      console.log('✅ Migration completed!');
    } else {
      console.log('\n✅ Tables exist!');
      
      // Check structure
      const [columns] = await connection.query("DESCRIBE assignment_requests");
      console.log('\nTable structure:');
      console.log(columns.map(c => `${c.Field} (${c.Type})`).join('\n'));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkTables();
