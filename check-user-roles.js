const mysql = require('mysql2/promise');

async function checkRoles() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Gorpunadoue@95',
    database: 'medconsult_liberia',
  });

  try {
    // Check column definition
    const [columns] = await connection.query(`
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'medconsult_liberia' 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'role'
    `);

    console.log('Role column type:', columns[0].COLUMN_TYPE);

    // Check existing roles
    const [users] = await connection.query(`
      SELECT DISTINCT role FROM users
    `);

    console.log('\nExisting roles in database:');
    users.forEach(u => console.log('  -', u.role));

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkRoles();
