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

    // Check if table exists
    const [tables] = await connection.query(
      "SHOW TABLES LIKE 'payment_settings'"
    );

    if (tables.length === 0) {
      console.log('❌ payment_settings table does not exist!');
      console.log('Run: node run-payment-settings-migration.js');
      return;
    }

    console.log('✓ Table exists\n');

    // Check table structure
    const [columns] = await connection.query('DESCRIBE payment_settings');
    console.log('Table structure:');
    columns.forEach(col => {
      console.log(`  ${col.Field} (${col.Type})`);
    });

    // Check data
    const [rows] = await connection.query('SELECT * FROM payment_settings');
    console.log(`\n✓ Found ${rows.length} record(s)`);
    
    if (rows.length > 0) {
      console.log('\nFirst record:');
      console.log(JSON.stringify(rows[0], null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (connection) await connection.end();
  }
}

checkTable();
