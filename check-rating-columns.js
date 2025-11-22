const mysql = require('mysql2/promise');

async function checkColumns() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Gorpunadoue@95',
    database: 'medconsult_liberia'
  });

  try {
    console.log('🔍 Checking users table for rating columns...\n');

    // Check for rating columns
    const [columns] = await connection.execute(
      "SHOW COLUMNS FROM users LIKE '%rating%'"
    );

    if (columns.length === 0) {
      console.log('❌ NO RATING COLUMNS FOUND!');
      console.log('\n📝 Need to add these columns:');
      console.log('   - average_rating DECIMAL(3,2)');
      console.log('   - total_ratings INT');
      console.log('\n🔧 Running ALTER TABLE to add columns...\n');

      // Add the columns
      await connection.execute(
        `ALTER TABLE users 
         ADD COLUMN average_rating DECIMAL(3,2) DEFAULT 0.00,
         ADD COLUMN total_ratings INT DEFAULT 0`
      );

      console.log('✅ Columns added successfully!');

      // Verify
      const [newColumns] = await connection.execute(
        "SHOW COLUMNS FROM users LIKE '%rating%'"
      );
      console.log('\n✅ Verified columns:');
      newColumns.forEach(col => {
        console.log(`   - ${col.Field}: ${col.Type}`);
      });

    } else {
      console.log('✅ Rating columns exist:');
      columns.forEach(col => {
        console.log(`   - ${col.Field}: ${col.Type}`);
      });
    }

    // Check doctor's current rating values
    console.log('\n📊 Current doctor rating values:');
    const [doctors] = await connection.execute(
      `SELECT id, full_name, email, average_rating, total_ratings 
       FROM users 
       WHERE role = 'management'`
    );
    
    doctors.forEach(d => {
      console.log(`   - ${d.full_name} (${d.email}): avg=${d.average_rating}, total=${d.total_ratings}`);
    });

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkColumns();
