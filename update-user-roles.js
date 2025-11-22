const mysql = require('mysql2/promise');

async function updateUserRoles() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Gorpunadoue@95',
    database: 'medconsult_liberia'
  });

  try {
    console.log('Updating user roles...');

    // Modify the role enum to include accountant and consultant
    await connection.execute(`
      ALTER TABLE users 
      MODIFY COLUMN role ENUM('admin', 'management', 'client', 'accountant', 'consultant') DEFAULT 'client'
    `);
    
    console.log('✅ User roles updated successfully!');
    console.log('Available roles: admin, management, client, accountant, consultant');
  } catch (error) {
    console.error('Error updating roles:', error);
  } finally {
    await connection.end();
  }
}

updateUserRoles();
