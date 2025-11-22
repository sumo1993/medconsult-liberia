const mysql = require('mysql2/promise');

async function simulateProfileGet() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Gorpunadoue@95',
    database: 'medconsult_liberia',
  });

  try {
    const userId = 7; // The newest user
    console.log(`🔍 Simulating GET /api/profile for user ID: ${userId}\n`);

    // This is exactly what the API does
    const [users] = await connection.query(`
      SELECT id, email, role, status, full_name, title, date_of_birth, gender, city, county, country,
       educational_level, marital_status, employment_status, occupation, 
       phone_number, emergency_contact_name, emergency_contact_phone, 
       emergency_contact_relationship, specialization, years_of_experience,
       license_number, research_interests, current_projects, bio,
       average_rating, total_ratings
       FROM users WHERE id = ?
    `, [userId]);

    if (users.length === 0) {
      console.log('❌ User not found');
      return;
    }

    console.log('✅ User data retrieved from database:');
    console.log(JSON.stringify(users[0], null, 2));

    // Check user_profiles table
    console.log('\n🔍 Checking user_profiles table...\n');
    const [profiles] = await connection.query(
      'SELECT * FROM user_profiles WHERE user_id = ?',
      [userId]
    );

    if (profiles.length === 0) {
      console.log('⚠️  No profile found in user_profiles table (this is OK, data is in users table)');
    } else {
      console.log('📋 Profile data from user_profiles table:');
      console.log(JSON.stringify(profiles[0], null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.sqlMessage) {
      console.error('SQL Error:', error.sqlMessage);
    }
  } finally {
    await connection.end();
  }
}

simulateProfileGet();
