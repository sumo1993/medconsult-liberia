const mysql = require('mysql2/promise');

async function updateName() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Gorpunadoue@95',
    database: 'medconsult_liberia',
  });

  try {
    console.log('Checking current name...\n');
    
    // Check users table
    const [users] = await connection.execute(
      'SELECT id, full_name, email FROM users WHERE email LIKE "%zeah%"'
    );
    console.log('Users table:', users);
    
    // Check user_profiles table
    const [profiles] = await connection.execute(
      'SELECT user_id, full_name FROM user_profiles WHERE user_id IN (SELECT id FROM users WHERE email LIKE "%zeah%")'
    );
    console.log('User profiles table:', profiles);
    
    // Update both tables
    console.log('\nUpdating to "Isaac B. Zeah"...\n');
    
    await connection.execute(
      'UPDATE users SET full_name = ? WHERE email LIKE "%zeah%"',
      ['Isaac B. Zeah']
    );
    
    await connection.execute(
      'UPDATE user_profiles SET full_name = ? WHERE user_id IN (SELECT id FROM users WHERE email LIKE "%zeah%")',
      ['Isaac B. Zeah']
    );
    
    console.log('✅ Name updated successfully!');
    console.log('New name: Isaac B. Zeah');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

updateName();
