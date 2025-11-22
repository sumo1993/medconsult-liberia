const mysql = require('mysql2/promise');

async function checkTable() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Gorpunadoue@95',
      database: 'medconsult_liberia',
    });

    console.log('✓ Connected to database\n');

    // Check table structure
    const [columns] = await connection.query('DESCRIBE contact_messages');
    console.log('contact_messages table structure:');
    columns.forEach(col => {
      console.log(`  ${col.Field} (${col.Type})`);
    });

    // Check sample data
    const [rows] = await connection.query('SELECT * FROM contact_messages LIMIT 3');
    console.log(`\nSample data (${rows.length} rows):`);
    console.log(JSON.stringify(rows, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

checkTable();
