const mysql = require('mysql2/promise');

async function testRatings() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Gorpunadoue@95',
    database: 'medconsult_liberia'
  });

  try {
    console.log('🔍 Testing Ratings System...\n');

    // Check if ratings table exists
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'ratings'"
    );
    console.log('1. Ratings table exists:', tables.length > 0 ? '✅' : '❌');

    if (tables.length > 0) {
      // Check table structure
      const [structure] = await connection.execute('DESCRIBE ratings');
      console.log('\n2. Table Structure:');
      structure.forEach(col => {
        console.log(`   - ${col.Field}: ${col.Type}`);
      });

      // Check for ratings
      const [ratings] = await connection.execute(
        'SELECT COUNT(*) as count FROM ratings'
      );
      console.log(`\n3. Total Ratings: ${ratings[0].count}`);

      // Check users table for rating columns
      const [userCols] = await connection.execute(
        "SHOW COLUMNS FROM users LIKE '%rating%'"
      );
      console.log('\n4. User Rating Columns:');
      userCols.forEach(col => {
        console.log(`   - ${col.Field}: ${col.Type}`);
      });

      // Get sample ratings if any
      if (ratings[0].count > 0) {
        const [samples] = await connection.execute(
          `SELECT r.*, u.full_name as doctor_name, c.full_name as client_name
           FROM ratings r
           JOIN users u ON r.doctor_id = u.id
           JOIN users c ON r.client_id = c.id
           LIMIT 5`
        );
        console.log('\n5. Sample Ratings:');
        samples.forEach(r => {
          console.log(`   - ${r.client_name} rated ${r.doctor_name}: ${r.rating} stars`);
        });
      }

      // Check doctors with ratings
      const [doctors] = await connection.execute(
        `SELECT u.id, u.full_name, u.average_rating, u.total_ratings
         FROM users u
         WHERE u.role = 'management'
         LIMIT 5`
      );
      console.log('\n6. Doctors:');
      doctors.forEach(d => {
        console.log(`   - ${d.full_name} (ID: ${d.id}): Avg ${d.average_rating || 0}, Total ${d.total_ratings || 0}`);
      });
    }

    console.log('\n✅ Test Complete!');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

testRatings();
