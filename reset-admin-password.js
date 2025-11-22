const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function resetAdminPassword() {
  console.log('🔐 Resetting Admin Password...\n');

  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Gorpunadoue@95',
    database: 'medconsult_liberia',
  });

  try {
    // New password
    const newPassword = 'Admin@123';
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update admin password
    await connection.execute(
      'UPDATE users SET password_hash = ? WHERE email = ?',
      [hashedPassword, 'admin@medconsult.com']
    );
    
    console.log('✅ Admin password reset successfully!');
    console.log('\n📧 Login Credentials:');
    console.log('   Email: admin@medconsult.com');
    console.log('   Password: Admin@123');
    console.log('\n🔗 Login at: http://localhost:3000/login');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

resetAdminPassword();
