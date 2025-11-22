const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function resetDoctorPassword() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Gorpunadoue@95',
    database: 'medconsult_liberia',
  });

  try {
    console.log('Resetting doctor password...\n');

    // Hash the password properly
    const hashedPassword = await bcrypt.hash('password123', 12);
    console.log('Generated password hash:', hashedPassword.substring(0, 30) + '...\n');

    // Update doctor account
    await connection.query(
      `UPDATE users SET password_hash = ?, status = 'active' WHERE email = ?`,
      [hashedPassword, 'isaacbzeah2018@gmail.com']
    );
    
    console.log('✅ Doctor account updated!\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📧 Email: isaacbzeah2018@gmail.com');
    console.log('🔑 Password: password123');
    console.log('👤 Name: Isaac B Zeah');
    console.log('👨‍⚕️ Role: Consultant/Doctor');
    console.log('✅ Status: Active');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Verify
    const [verify] = await connection.query(
      `SELECT email, password_hash, status FROM users WHERE email = ?`,
      ['isaacbzeah2018@gmail.com']
    );

    console.log('Verification:');
    console.log(`  ✓ Email: ${verify[0].email}`);
    console.log(`  ✓ Status: ${verify[0].status}`);
    console.log(`  ✓ Hash: ${verify[0].password_hash.substring(0, 20)}...`);
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await connection.end();
  }
}

resetDoctorPassword();
