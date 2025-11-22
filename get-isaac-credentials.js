const mysql = require('mysql2/promise');

async function getIsaacCredentials() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Gorpunadoue@95',
    database: 'medconsult_liberia',
  });

  try {
    console.log('🔍 Looking up Isaac B Zeah\'s account...\n');

    const [users] = await connection.query(`
      SELECT 
        id,
        email,
        full_name,
        role,
        status,
        created_at
      FROM users
      WHERE email = 'isaacbzeah2018@gmail.com'
    `);

    if (users.length === 0) {
      console.log('❌ Isaac B Zeah account not found');
      return;
    }

    const isaac = users[0];
    console.log('✅ Account Found!\n');
    console.log('👤 Consultant Login Credentials:');
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Email: ${isaac.email}`);
    console.log(`   Password: (You need to know this or reset it)`);
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📋 Account Details:');
    console.log(`   Full Name: ${isaac.full_name}`);
    console.log(`   Role: ${isaac.role}`);
    console.log(`   Status: ${isaac.status}`);
    console.log(`   Created: ${isaac.created_at}\n`);
    console.log('🔗 Login at: http://localhost:3000/login\n');
    console.log('⚠️  Note: Passwords are encrypted and cannot be retrieved.');
    console.log('   If you don\'t know the password, I can reset it for you.\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

getIsaacCredentials();
