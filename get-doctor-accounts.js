const mysql = require('mysql2/promise');

async function getDoctorAccounts() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Gorpunadoue@95',
    database: 'medconsult_liberia',
  });

  try {
    console.log('🔍 Fetching doctor accounts...\n');

    const [doctors] = await connection.query(`
      SELECT 
        id,
        email,
        full_name,
        role,
        status,
        created_at
      FROM users 
      WHERE role = 'doctor'
      ORDER BY created_at DESC
    `);

    if (doctors.length === 0) {
      console.log('❌ No doctor accounts found');
      return;
    }

    console.log(`Found ${doctors.length} doctor account(s):\n`);

    doctors.forEach((doctor, index) => {
      console.log(`👨‍⚕️ Doctor ${index + 1}:`);
      console.log(`   ID: ${doctor.id}`);
      console.log(`   Email: ${doctor.email}`);
      console.log(`   Full Name: ${doctor.full_name}`);
      console.log(`   Status: ${doctor.status}`);
      console.log(`   Created: ${doctor.created_at}`);
      console.log('   Password: (Check your records or reset password)\n');
    });

    console.log('\n📝 Note: For security reasons, passwords are hashed and cannot be retrieved.');
    console.log('   If you need to access a doctor account, you can:');
    console.log('   1. Use the password you set when creating the account');
    console.log('   2. Reset the password through the admin panel');
    console.log('   3. Create a new doctor account\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

getDoctorAccounts();
