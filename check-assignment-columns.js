const mysql = require('mysql2/promise');

async function checkColumns() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Gorpunadoue@95',
    database: 'medconsult_liberia',
  });

  try {
    const [columns] = await connection.query(`
      SHOW COLUMNS FROM assignment_requests
    `);

    console.log('📋 assignment_requests table columns:\n');
    columns.forEach(col => {
      console.log(`   ${col.Field} (${col.Type})`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkColumns();
