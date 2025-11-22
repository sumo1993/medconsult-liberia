const mysql = require('mysql2/promise');

async function getClientCredentials() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Gorpunadoue@95',
    database: 'medconsult_liberia',
  });

  try {
    console.log('Fetching client accounts...\n');

    const [clients] = await connection.query(
      `SELECT id, email, full_name, role, status, created_at 
       FROM users 
       WHERE role = 'client' 
       ORDER BY created_at DESC 
       LIMIT 5`
    );

    if (clients.length === 0) {
      console.log('❌ No client accounts found in the database.');
      console.log('\nCreating a test client account...\n');
      
      // Create a test client account
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      await connection.query(
        `INSERT INTO users (email, password, full_name, role, status) 
         VALUES (?, ?, ?, 'client', 'active')`,
        ['client@example.com', hashedPassword, 'Test Client']
      );
      
      console.log('✅ Test client account created!');
      console.log('\n📧 Email: client@example.com');
      console.log('🔑 Password: password123');
      console.log('👤 Role: Client');
      console.log('✅ Status: Active\n');
    } else {
      console.log('📋 Available Client Accounts:\n');
      console.log('═══════════════════════════════════════════════════════════\n');
      
      clients.forEach((client, index) => {
        console.log(`${index + 1}. ${client.full_name || 'No Name'}`);
        console.log(`   📧 Email: ${client.email}`);
        console.log(`   🔑 Password: password123 (default for test accounts)`);
        console.log(`   👤 Role: ${client.role}`);
        console.log(`   ✅ Status: ${client.status}`);
        console.log(`   📅 Created: ${client.created_at}`);
        console.log('');
      });
      
      console.log('═══════════════════════════════════════════════════════════\n');
      console.log('💡 Note: If the default password doesn\'t work, the account');
      console.log('   may have been created with a different password.\n');
      console.log('🔄 You can reset any password by running the password reset script.\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

getClientCredentials();
