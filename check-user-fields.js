const mysql = require('mysql2/promise');

async function checkUserFields() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Gorpunadoue@95',
    database: 'medconsult_liberia',
  });

  try {
    console.log('Checking users table structure...\n');

    const [columns] = await connection.query("DESCRIBE users");
    console.log('Available fields in users table:');
    columns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type})`);
    });

    console.log('\n\nChecking management user data...');
    const [users] = await connection.query("SELECT id, email, full_name, role FROM users WHERE role IN ('management', 'admin') LIMIT 5");
    console.log('\nManagement/Admin users:');
    users.forEach(user => {
      console.log(`  ID: ${user.id}, Email: ${user.email}, Name: ${user.full_name}, Role: ${user.role}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkUserFields();
