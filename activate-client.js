const mysql = require('mysql2/promise');

async function activateClient() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Gorpunadoue@95',
    database: 'medconsult_liberia'
  });

  try {
    console.log('🔧 Activating client user...\n');

    // Update client status to active
    const [result] = await connection.execute(
      `UPDATE users 
       SET status = 'active' 
       WHERE role = 'client' AND email = 'student@example.com'`
    );

    console.log('✅ Client user activated!');
    
    // Verify
    const [clients] = await connection.execute(
      `SELECT id, email, full_name, role, status 
       FROM users 
       WHERE role = 'client' AND email = 'student@example.com'`
    );

    if (clients.length > 0) {
      const client = clients[0];
      console.log('\n📋 Updated User Info:');
      console.log(`   - Name: ${client.full_name}`);
      console.log(`   - Email: ${client.email}`);
      console.log(`   - Role: ${client.role}`);
      console.log(`   - Status: ${client.status} ✅`);
      console.log('\n🎉 Client can now login and access dashboard!');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

activateClient();
