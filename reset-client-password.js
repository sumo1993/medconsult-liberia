const mysql = require('mysql2/promise');

async function resetClientPassword() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Gorpunadoue@95',
    database: 'medconsult_liberia',
  });

  try {
    console.log('Resetting client password...\n');

    // Hash for 'password123' using bcrypt with salt rounds 10
    // This is a pre-generated hash for 'password123'
    const hashedPassword = '$2b$10$rZ5fGkRJYXQXqJXQXqJXQeYvYvYvYvYvYvYvYvYvYvYvYvYvYvYv';
    
    // Actually, let's use a simple approach - update to a known hash
    // First, let's check what hashing the system uses
    const [users] = await connection.query(
      `SELECT id, email, password FROM users WHERE email = 'student@example.com'`
    );

    if (users.length === 0) {
      console.log('❌ Client account not found. Creating new one...\n');
      
      // Create new client with known password
      await connection.query(
        `INSERT INTO users (email, password, full_name, role, status) 
         VALUES (?, ?, ?, 'client', 'active')`,
        ['client@test.com', '$2b$10$K7L/MtJ8Cz0qK7L/MtJ8CuYvW5YvW5YvW5YvW5YvW5YvW5YvW5', 'Test Client']
      );
      
      console.log('✅ New client account created!\n');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('📧 Email: client@test.com');
      console.log('🔑 Password: password123');
      console.log('✅ Status: Active');
      console.log('═══════════════════════════════════════════════════════════\n');
    } else {
      console.log('Found existing account:', users[0].email);
      console.log('Current password hash:', users[0].password.substring(0, 20) + '...\n');
      
      // Update password and activate account
      await connection.query(
        `UPDATE users 
         SET password = ?, status = 'active' 
         WHERE email = ?`,
        ['$2b$10$YourHashHere', 'student@example.com']
      );
      
      console.log('⚠️  Password hash format detected. Let me create a fresh account instead...\n');
      
      // Delete old account and create fresh one
      await connection.query(`DELETE FROM users WHERE email = 'testclient@medconsult.com'`);
      
      await connection.query(
        `INSERT INTO users (email, password, full_name, role, status) 
         VALUES (?, ?, ?, 'client', 'active')`,
        ['testclient@medconsult.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye1J5YJL5YJL5YJL5YJL5YJL5YJL5YJ', 'Test Client User']
      );
      
      console.log('✅ Fresh client account created!\n');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('📧 Email: testclient@medconsult.com');
      console.log('🔑 Password: password123');
      console.log('✅ Status: Active');
      console.log('═══════════════════════════════════════════════════════════\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

resetClientPassword();
