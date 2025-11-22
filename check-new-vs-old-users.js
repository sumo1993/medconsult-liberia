const mysql = require('mysql2/promise');

async function checkUsers() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Gorpunadoue@95',
    database: 'medconsult_liberia',
  });

  try {
    console.log('🔍 Comparing old vs new client users...\n');

    // Get all client users ordered by creation date
    const [users] = await connection.query(`
      SELECT 
        id, 
        email, 
        full_name,
        phone,
        phone_number,
        created_at,
        status,
        email_verified
      FROM users 
      WHERE role = 'client'
      ORDER BY created_at ASC
    `);

    if (users.length === 0) {
      console.log('❌ No client users found');
      return;
    }

    console.log(`Found ${users.length} client user(s):\n`);

    users.forEach((user, index) => {
      const isOld = index < Math.floor(users.length / 2);
      console.log(`${isOld ? '📅 OLD' : '🆕 NEW'} User ${index + 1}:`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Full Name: ${user.full_name || '(empty)'}`);
      console.log(`   Phone (old field): ${user.phone || '(empty)'}`);
      console.log(`   Phone Number (new field): ${user.phone_number || '(empty)'}`);
      console.log(`   Created: ${user.created_at}`);
      console.log(`   Status: ${user.status}`);
      console.log(`   Email Verified: ${user.email_verified}`);
      console.log('');
    });

    // Now test if we can update the newest user
    const newestUser = users[users.length - 1];
    console.log(`\n🧪 Testing UPDATE on newest user (ID: ${newestUser.id})...\n`);

    const testData = {
      city: 'Test City',
      county: 'Test County',
      phone_number: '555-TEST',
      bio: 'Test bio for debugging'
    };

    const [updateResult] = await connection.execute(
      `UPDATE users SET city = ?, county = ?, phone_number = ?, bio = ? WHERE id = ?`,
      [testData.city, testData.county, testData.phone_number, testData.bio, newestUser.id]
    );

    console.log(`✅ Update executed:`);
    console.log(`   Affected rows: ${updateResult.affectedRows}`);
    console.log(`   Changed rows: ${updateResult.changedRows}`);

    // Verify the update
    const [verifyResult] = await connection.execute(
      `SELECT id, email, city, county, phone_number, bio FROM users WHERE id = ?`,
      [newestUser.id]
    );

    console.log(`\n📋 Verified data after update:`);
    console.log(verifyResult[0]);

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.sqlMessage) {
      console.error('SQL Error:', error.sqlMessage);
    }
  } finally {
    await connection.end();
  }
}

checkUsers();
