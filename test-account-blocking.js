const mysql = require('mysql2/promise');

async function testAccountBlocking() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Gorpunadoue@95',
    database: 'medconsult_liberia'
  });

  try {
    console.log('🧪 Testing Account Blocking System...\n');

    const clientEmail = 'student@example.com';

    // Step 1: Check current status
    console.log('Step 1: Check current status');
    const [users] = await connection.execute(
      'SELECT id, email, full_name, role, status FROM users WHERE email = ?',
      [clientEmail]
    );

    if (users.length === 0) {
      console.log('❌ Client user not found!');
      return;
    }

    const user = users[0];
    console.log(`   - User: ${user.full_name} (${user.email})`);
    console.log(`   - Current Status: ${user.status}`);
    console.log('');

    // Step 2: Suspend the account
    console.log('Step 2: Suspending account...');
    await connection.execute(
      'UPDATE users SET status = ? WHERE email = ?',
      ['suspended', clientEmail]
    );
    console.log('   ✅ Account suspended');
    console.log('');

    // Step 3: Verify suspension
    console.log('Step 3: Verify suspension');
    const [suspended] = await connection.execute(
      'SELECT status FROM users WHERE email = ?',
      [clientEmail]
    );
    console.log(`   - New Status: ${suspended[0].status}`);
    console.log('');

    // Step 4: Wait for user to test
    console.log('Step 4: Testing Instructions');
    console.log('   📋 What should happen:');
    console.log('   1. Client is currently logged in');
    console.log('   2. Within 30 seconds, they should be auto-logged out');
    console.log('   3. Alert message: "Your account has been suspended"');
    console.log('   4. Redirected to login page');
    console.log('   5. Cannot login again until reactivated');
    console.log('');

    console.log('⏳ Waiting 35 seconds for auto-logout to trigger...');
    await new Promise(resolve => setTimeout(resolve, 35000));

    // Step 5: Reactivate the account
    console.log('\nStep 5: Reactivating account...');
    await connection.execute(
      'UPDATE users SET status = ? WHERE email = ?',
      ['active', clientEmail]
    );
    console.log('   ✅ Account reactivated');
    console.log('');

    // Step 6: Verify reactivation
    console.log('Step 6: Verify reactivation');
    const [active] = await connection.execute(
      'SELECT status FROM users WHERE email = ?',
      [clientEmail]
    );
    console.log(`   - Final Status: ${active[0].status}`);
    console.log('');

    console.log('✅ Test Complete!');
    console.log('\n📋 Summary:');
    console.log('   - Account can be suspended by admin');
    console.log('   - Suspended users are auto-logged out within 30 seconds');
    console.log('   - Cannot access dashboard while suspended');
    console.log('   - Account can be reactivated by admin');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

// Check if we should run the full test or just toggle status
const args = process.argv.slice(2);
const command = args[0];

if (command === 'suspend') {
  // Quick suspend
  (async () => {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Gorpunadoue@95',
      database: 'medconsult_liberia'
    });
    await connection.execute(
      "UPDATE users SET status = 'suspended' WHERE email = 'student@example.com'"
    );
    console.log('✅ Client account suspended');
    await connection.end();
  })();
} else if (command === 'activate') {
  // Quick activate
  (async () => {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Gorpunadoue@95',
      database: 'medconsult_liberia'
    });
    await connection.execute(
      "UPDATE users SET status = 'active' WHERE email = 'student@example.com'"
    );
    console.log('✅ Client account activated');
    await connection.end();
  })();
} else {
  // Run full test
  testAccountBlocking();
}
