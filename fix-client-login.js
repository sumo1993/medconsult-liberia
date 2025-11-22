const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function fixClientLogin() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Gorpunadoue@95',
    database: 'medconsult_liberia',
  });

  try {
    console.log('Checking database structure...\n');

    // Check table structure
    const [columns] = await connection.query(
      `SHOW COLUMNS FROM users WHERE Field LIKE '%password%'`
    );

    console.log('Password column(s) found:');
    columns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type})`);
    });
    console.log('');

    const passwordColumn = columns[0].Field; // Get the actual column name
    console.log(`Using column: ${passwordColumn}\n`);

    // Hash the password properly
    const hashedPassword = await bcrypt.hash('password123', 12);
    console.log('Generated password hash:', hashedPassword.substring(0, 30) + '...\n');

    // Check if client exists
    const [existing] = await connection.query(
      `SELECT id, email, status FROM users WHERE email = 'student@example.com'`
    );

    if (existing.length > 0) {
      console.log('Updating existing client account...\n');
      
      // Update with correct column name
      await connection.query(
        `UPDATE users SET ${passwordColumn} = ?, status = 'active' WHERE email = ?`,
        [hashedPassword, 'student@example.com']
      );
      
      console.log('✅ Client account updated!\n');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('📧 Email: student@example.com');
      console.log('🔑 Password: password123');
      console.log('👤 Name: Grace Zeah');
      console.log('✅ Status: Active');
      console.log('═══════════════════════════════════════════════════════════\n');
    } else {
      console.log('Creating new client account...\n');
      
      // Create new account with correct column name
      const insertQuery = `INSERT INTO users (email, ${passwordColumn}, full_name, role, status) VALUES (?, ?, ?, 'client', 'active')`;
      
      await connection.query(insertQuery, [
        'client@medconsult.com',
        hashedPassword,
        'Test Client'
      ]);
      
      console.log('✅ New client account created!\n');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('📧 Email: client@medconsult.com');
      console.log('🔑 Password: password123');
      console.log('👤 Name: Test Client');
      console.log('✅ Status: Active');
      console.log('═══════════════════════════════════════════════════════════\n');
    }

    // Verify the update
    const [verify] = await connection.query(
      `SELECT email, ${passwordColumn}, status FROM users WHERE email IN ('student@example.com', 'client@medconsult.com')`
    );

    console.log('Verification:');
    verify.forEach(user => {
      console.log(`  ✓ ${user.email} - Status: ${user.status} - Hash: ${user[passwordColumn].substring(0, 20)}...`);
    });
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await connection.end();
  }
}

fixClientLogin();
