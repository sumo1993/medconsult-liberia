const mysql = require('mysql2/promise');

async function checkClientUser() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Gorpunadoue@95',
    database: 'medconsult_liberia'
  });

  try {
    console.log('🔍 Checking Client Users...\n');

    // Get all client users
    const [clients] = await connection.execute(
      `SELECT id, email, full_name, role, status, created_at 
       FROM users 
       WHERE role = 'client'`
    );

    if (clients.length === 0) {
      console.log('❌ NO CLIENT USERS FOUND!');
      console.log('\n📝 You need to create a client account:');
      console.log('   1. Go to /signup');
      console.log('   2. Create account with role "client"');
      console.log('   3. Login and test');
    } else {
      console.log(`✅ Found ${clients.length} client user(s):\n`);
      clients.forEach((client, index) => {
        console.log(`${index + 1}. ${client.full_name || 'No name'} (${client.email})`);
        console.log(`   - ID: ${client.id}`);
        console.log(`   - Role: ${client.role}`);
        console.log(`   - Status: ${client.status}`);
        console.log(`   - Created: ${client.created_at}`);
        
        if (client.status !== 'active') {
          console.log(`   ⚠️  WARNING: Status is "${client.status}", should be "active"`);
        } else {
          console.log(`   ✅ Status is active`);
        }
        console.log('');
      });

      // Check if there are assignments for these clients
      console.log('📊 Checking assignments for clients:\n');
      for (const client of clients) {
        const [assignments] = await connection.execute(
          'SELECT COUNT(*) as count FROM assignment_requests WHERE client_id = ?',
          [client.id]
        );
        console.log(`   - ${client.email}: ${assignments[0].count} assignment(s)`);
      }
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkClientUser();
