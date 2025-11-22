const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function createActiveClient() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Gorpunadoue@95',
    database: 'medconsult_liberia',
  });

  try {
    // Check if active client exists
    const [activeClients] = await connection.query(
      `SELECT email, full_name FROM users WHERE role = 'client' AND status = 'active' LIMIT 1`
    );

    if (activeClients.length > 0) {
      console.log('✅ Active client account already exists!\n');
      console.log('═══════════════════════════════════════════════════════════\n');
      console.log(`👤 Name: ${activeClients[0].full_name}`);
      console.log(`📧 Email: ${activeClients[0].email}`);
      console.log(`🔑 Password: password123`);
      console.log(`✅ Status: Active\n`);
      console.log('═══════════════════════════════════════════════════════════\n');
    } else {
      console.log('Creating new active client account...\n');
      
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      await connection.query(
        `INSERT INTO users (email, password, full_name, role, status) 
         VALUES (?, ?, ?, 'client', 'active')`,
        ['client@medconsult.com', hashedPassword, 'John Doe']
      );
      
      console.log('✅ Active client account created!\n');
      console.log('═══════════════════════════════════════════════════════════\n');
      console.log('👤 Name: John Doe');
      console.log('📧 Email: client@medconsult.com');
      console.log('🔑 Password: password123');
      console.log('✅ Status: Active\n');
      console.log('═══════════════════════════════════════════════════════════\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

createActiveClient();
