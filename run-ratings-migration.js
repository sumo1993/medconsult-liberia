const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

async function runMigration() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Gorpunadoue@95',
    database: 'medconsult_liberia',
    multipleStatements: true
  });

  try {
    console.log('🌟 Starting ratings system migration...\n');

    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', 'add-ratings-system.sql');
    const sql = await fs.readFile(migrationPath, 'utf8');

    // Execute the migration
    console.log('📝 Creating ratings table and updating users table...');
    await connection.query(sql);

    console.log('\n✅ Migration completed successfully!');
    console.log('\n⭐ Ratings system features:');
    console.log('  ✓ Ratings table created');
    console.log('  ✓ 1-5 star rating system');
    console.log('  ✓ Optional review text');
    console.log('  ✓ One rating per assignment per client');
    console.log('  ✓ Average rating tracking for doctors');
    console.log('  ✓ Performance indexes added');
    console.log('\n🎉 Clients can now rate doctors after completion!');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

runMigration();
