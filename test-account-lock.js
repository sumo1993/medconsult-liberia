const mysql = require('mysql2/promise');

async function testAccountLock() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Gorpunadoue@95',
    database: 'medconsult_liberia',
  });

  try {
    console.log('Testing Account Lock Feature\n');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Get client account
    const [clients] = await connection.query(
      `SELECT id, email, full_name, status FROM users WHERE email = 'student@example.com'`
    );

    if (clients.length === 0) {
      console.log('❌ Client account not found');
      return;
    }

    const client = clients[0];
    console.log('Current Status:');
    console.log(`  📧 Email: ${client.email}`);
    console.log(`  👤 Name: ${client.full_name}`);
    console.log(`  ✅ Status: ${client.status}\n`);

    // Lock the account
    console.log('🔒 Locking account...\n');
    await connection.query(
      `UPDATE users SET status = 'locked' WHERE id = ?`,
      [client.id]
    );

    // Verify
    const [updated] = await connection.query(
      `SELECT status FROM users WHERE id = ?`,
      [client.id]
    );

    console.log('Updated Status:');
    console.log(`  🔒 Status: ${updated[0].status}\n`);

    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('✅ Account locked successfully!\n');
    console.log('What should happen now:');
    console.log('  1. If client is logged in, they should be logged out within 10 seconds');
    console.log('  2. A modern modal should appear saying "Account Locked"');
    console.log('  3. Client cannot log in again\n');
    console.log('To unlock, run: UPDATE users SET status = "active" WHERE email = "student@example.com"\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

testAccountLock();
