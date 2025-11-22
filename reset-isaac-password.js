const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function resetIsaacPassword() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Gorpunadoue@95',
    database: 'medconsult_liberia',
  });

  try {
    console.log('🔐 Resetting Isaac B Zeah\'s password...\n');

    const email = 'isaacbzeah2018@gmail.com';
    const newPassword = 'Consultant123!';

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await connection.execute(
      `UPDATE users SET password_hash = ? WHERE email = ?`,
      [passwordHash, email]
    );

    console.log('✅ Password reset successful!\n');
    console.log('👤 Consultant Login Credentials:');
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${newPassword}`);
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🔗 Login at: http://localhost:3000/login\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

resetIsaacPassword();
