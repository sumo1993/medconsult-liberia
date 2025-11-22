const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function createDoctorAccount() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Gorpunadoue@95',
    database: 'medconsult_liberia',
  });

  try {
    console.log('👨‍⚕️ Creating doctor account...\n');

    // Doctor/Management credentials
    const email = 'doctor@medconsult.com';
    const password = 'Doctor123!';
    const fullName = 'Dr. John Smith';
    const role = 'management'; // Doctors use management role

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert doctor
    const [result] = await connection.execute(
      `INSERT INTO users (email, password_hash, full_name, role, status, email_verified) 
       VALUES (?, ?, ?, ?, 'active', 1)`,
      [email, passwordHash, fullName, role]
    );

    console.log('✅ Doctor account created successfully!\n');
    console.log('📋 Login Credentials:');
    console.log('   Email: ' + email);
    console.log('   Password: ' + password);
    console.log('   Role: ' + role);
    console.log('   Status: active\n');
    console.log('🔗 Login at: http://localhost:3000/login\n');

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      console.log('⚠️  Doctor account already exists!');
      console.log('   Email: doctor@medconsult.com');
      console.log('   Try using the existing account or use a different email.\n');
    } else {
      console.error('❌ Error:', error.message);
    }
  } finally {
    await connection.end();
  }
}

createDoctorAccount();
