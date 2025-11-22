const mysql = require('mysql2/promise');

async function showAllUsers() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Gorpunadoue@95',
    database: 'medconsult_liberia'
  });

  try {
    console.log('👥 ALL USERS IN SYSTEM\n');
    console.log('='.repeat(80));

    // Get all users
    const [users] = await connection.execute(
      `SELECT id, email, full_name, role, status, created_at 
       FROM users 
       ORDER BY role, id`
    );

    if (users.length === 0) {
      console.log('❌ No users found in database!');
      return;
    }

    console.log(`\nTotal Users: ${users.length}\n`);

    // Group by role
    const roles = {
      admin: [],
      management: [],
      client: []
    };

    users.forEach(user => {
      if (roles[user.role]) {
        roles[user.role].push(user);
      }
    });

    // Display Admin users
    if (roles.admin.length > 0) {
      console.log('🔐 ADMIN USERS');
      console.log('-'.repeat(80));
      roles.admin.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.full_name || 'No Name'}`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   🔑 Password: [Check with admin - passwords are hashed]`);
        console.log(`   👤 Role: ${user.role}`);
        console.log(`   📊 Status: ${user.status}`);
        console.log(`   📅 Created: ${user.created_at}`);
      });
      console.log('');
    }

    // Display Management/Doctor users
    if (roles.management.length > 0) {
      console.log('👨‍⚕️ MANAGEMENT/DOCTOR USERS');
      console.log('-'.repeat(80));
      roles.management.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.full_name || 'No Name'}`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   🔑 Password: [Hashed in database]`);
        console.log(`   👤 Role: ${user.role}`);
        console.log(`   📊 Status: ${user.status}`);
        console.log(`   📅 Created: ${user.created_at}`);
      });
      console.log('');
    }

    // Display Client users
    if (roles.client.length > 0) {
      console.log('👨‍🎓 CLIENT/STUDENT USERS');
      console.log('-'.repeat(80));
      roles.client.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.full_name || 'No Name'}`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   🔑 Password: [Hashed in database]`);
        console.log(`   👤 Role: ${user.role}`);
        console.log(`   📊 Status: ${user.status}`);
        console.log(`   📅 Created: ${user.created_at}`);
      });
      console.log('');
    }

    console.log('='.repeat(80));
    console.log('\n⚠️  IMPORTANT NOTES:');
    console.log('   - Passwords are hashed using bcrypt for security');
    console.log('   - Original passwords cannot be retrieved from database');
    console.log('   - Users must remember their passwords or reset them');
    console.log('   - Only users with status "active" can login');
    console.log('\n📋 COMMON TEST CREDENTIALS (if using default setup):');
    console.log('   - Doctor: isaacbzeah2018@gmail.com / [your password]');
    console.log('   - Client: student@example.com / [your password]');
    console.log('\n💡 To reset a password, you need to:');
    console.log('   1. Hash the new password with bcrypt');
    console.log('   2. Update the database with the hashed password');
    console.log('   3. Or implement a password reset feature');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

showAllUsers();
