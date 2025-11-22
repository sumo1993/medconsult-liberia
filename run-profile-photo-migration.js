const mysql = require('mysql2/promise');

async function runMigration() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Gorpunadoue@95',
      database: 'medconsult_liberia',
    });

    console.log('✓ Connected to database\n');

    // Check if columns exist
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'medconsult_liberia' 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME IN ('profile_photo', 'profile_photo_filename', 'profile_photo_size')
    `);

    const existingColumns = columns.map(col => col.COLUMN_NAME);

    // Add profile_photo column if not exists
    if (!existingColumns.includes('profile_photo')) {
      await connection.query('ALTER TABLE users ADD COLUMN profile_photo LONGBLOB');
      console.log('✓ Added profile_photo column');
    }

    if (!existingColumns.includes('profile_photo_filename')) {
      await connection.query('ALTER TABLE users ADD COLUMN profile_photo_filename VARCHAR(255)');
      console.log('✓ Added profile_photo_filename column');
    }

    if (!existingColumns.includes('profile_photo_size')) {
      await connection.query('ALTER TABLE users ADD COLUMN profile_photo_size INT');
      console.log('✓ Added profile_photo_size column');
    }

    if (existingColumns.length === 3) {
      console.log('⚠️  All columns already exist');
    }

    console.log('✓ Added profile_photo columns to users table\n');
    console.log('✅ Migration complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

runMigration();
