const mysql = require('mysql2/promise');

async function getDoctorCredentials() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Gorpunadoue@95',
    database: 'medconsult_liberia',
  });

  try {
    console.log('Fetching doctor/consultant accounts...\n');

    const [doctors] = await connection.query(
      `SELECT id, email, full_name, role, status, created_at 
       FROM users 
       WHERE role = 'management' 
       ORDER BY created_at DESC 
       LIMIT 5`
    );

    if (doctors.length === 0) {
      console.log('❌ No doctor/consultant accounts found in the database.\n');
    } else {
      console.log('📋 Available Doctor/Consultant Accounts:\n');
      console.log('═══════════════════════════════════════════════════════════\n');
      
      doctors.forEach((doctor, index) => {
        console.log(`${index + 1}. ${doctor.full_name || 'No Name'}`);
        console.log(`   📧 Email: ${doctor.email}`);
        console.log(`   🔑 Password: password123 (default for test accounts)`);
        console.log(`   👤 Role: ${doctor.role}`);
        console.log(`   ✅ Status: ${doctor.status}`);
        console.log(`   📅 Created: ${doctor.created_at}`);
        console.log('');
      });
      
      console.log('═══════════════════════════════════════════════════════════\n');
      console.log('💡 Note: If the default password doesn\'t work, the account');
      console.log('   may have been created with a different password.\n');
    }

    // Also check admin accounts
    console.log('\n📋 Admin Accounts:\n');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const [admins] = await connection.query(
      `SELECT id, email, full_name, role, status 
       FROM users 
       WHERE role = 'admin' 
       LIMIT 3`
    );

    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.full_name || 'No Name'}`);
      console.log(`   📧 Email: ${admin.email}`);
      console.log(`   🔑 Password: password123 (default for test accounts)`);
      console.log(`   👤 Role: ${admin.role}`);
      console.log(`   ✅ Status: ${admin.status}`);
      console.log('');
    });

    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

getDoctorCredentials();
