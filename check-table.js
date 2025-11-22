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
    const [columns] = await connection.query(`
      DESCRIBE research_posts
    `);

    console.log('research_posts table structure:');
    console.log('================================');
    columns.forEach(col => {
      console.log(`${col.Field.padEnd(30)} ${col.Type.padEnd(20)} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    console.log('\n✓ Table check complete');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

checkTable();
