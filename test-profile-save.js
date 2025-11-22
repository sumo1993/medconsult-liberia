const mysql = require('mysql2/promise');

async function testProfileData() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Gorpunadoue@95',
    database: 'medconsult_liberia',
  });

  try {
    console.log('🔍 Checking user profile data...\n');

    // Get all users with their profile data
    const [users] = await connection.query(`
      SELECT 
        id, 
        email, 
        full_name, 
        role,
        date_of_birth,
        gender,
        city,
        county,
        phone_number,
        educational_level,
        bio
      FROM users 
      WHERE role = 'client'
      ORDER BY created_at DESC
      LIMIT 5
    `);

    if (users.length === 0) {
      console.log('❌ No client users found');
      return;
    }

    console.log(`Found ${users.length} client user(s):\n`);

    users.forEach((user, index) => {
      console.log(`👤 User ${index + 1}:`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Full Name: ${user.full_name || '(empty)'}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Date of Birth: ${user.date_of_birth || '(empty)'}`);
      console.log(`   Gender: ${user.gender || '(empty)'}`);
      console.log(`   City: ${user.city || '(empty)'}`);
      console.log(`   County: ${user.county || '(empty)'}`);
      console.log(`   Phone: ${user.phone_number || '(empty)'}`);
      console.log(`   Education: ${user.educational_level || '(empty)'}`);
      console.log(`   Bio: ${user.bio ? user.bio.substring(0, 50) + '...' : '(empty)'}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

testProfileData();
