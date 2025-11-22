const mysql = require('mysql2/promise');

async function testProfileAPI() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Gorpunadoue@95',
    database: 'medconsult_liberia'
  });

  try {
    console.log('🧪 Testing Profile API Query...\n');

    // Simulate the exact query from the API
    const [users] = await connection.execute(
      `SELECT id, email, role, full_name, title, date_of_birth, gender, city, county, country,
       educational_level, marital_status, employment_status, occupation, 
       phone_number, emergency_contact_name, emergency_contact_phone, 
       emergency_contact_relationship, specialization, years_of_experience,
       license_number, research_interests, current_projects, bio,
       average_rating, total_ratings
       FROM users WHERE id = ?`,
      [3] // Doctor Isaac B Zeah
    );

    if (users.length > 0) {
      const user = users[0];
      console.log('✅ Profile API Query Result:\n');
      console.log('📋 Basic Info:');
      console.log(`   - ID: ${user.id}`);
      console.log(`   - Name: ${user.full_name}`);
      console.log(`   - Email: ${user.email}`);
      console.log(`   - Role: ${user.role}`);
      
      console.log('\n⭐ Rating Data:');
      console.log(`   - average_rating: ${user.average_rating}`);
      console.log(`   - total_ratings: ${user.total_ratings}`);
      
      if (user.average_rating !== undefined && user.total_ratings !== undefined) {
        console.log('\n✅ SUCCESS! Rating fields are now included in the query!');
        console.log(`\n📊 Dashboard will show:`);
        console.log(`   - Average Rating: ${parseFloat(user.average_rating).toFixed(1)}`);
        console.log(`   - Total Reviews: ${user.total_ratings}`);
      } else {
        console.log('\n❌ ERROR! Rating fields are still undefined!');
      }
    } else {
      console.log('❌ No user found with ID 3');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

testProfileAPI();
