// Direct migration script - runs the SQL migration
const mysql = require('mysql2/promise');

async function runMigration() {
  let connection;
  
  try {
    console.log('Connecting to database...');
    
    // Create connection using same config as the app
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '', // Empty password - common for local MySQL
      database: 'medconsult_liberia',
    });

    console.log('✓ Connected to database\n');

    console.log('Running migration: Add featured image columns...\n');
    
    // Run the ALTER TABLE command
    await connection.query(`
      ALTER TABLE research_posts 
      ADD COLUMN featured_image LONGBLOB AFTER pdf_size,
      ADD COLUMN featured_image_filename VARCHAR(255) AFTER featured_image,
      ADD COLUMN featured_image_size INT AFTER featured_image_filename,
      ADD COLUMN download_count INT DEFAULT 0 AFTER views
    `);

    console.log('✅ Migration completed successfully!\n');
    console.log('Added columns:');
    console.log('  ✓ featured_image (LONGBLOB)');
    console.log('  ✓ featured_image_filename (VARCHAR(255))');
    console.log('  ✓ featured_image_size (INT)');
    console.log('  ✓ download_count (INT DEFAULT 0)\n');

    // Verify columns were added
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME, DATA_TYPE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'medconsult_liberia' 
      AND TABLE_NAME = 'research_posts'
      AND COLUMN_NAME IN ('featured_image', 'featured_image_filename', 'featured_image_size', 'download_count')
      ORDER BY ORDINAL_POSITION
    `);

    console.log('Verification:');
    columns.forEach(col => {
      console.log(`  ✓ ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
    });

  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('⚠️  Columns already exist - migration was previously run');
      console.log('No action needed. Image upload feature is ready to use!');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('❌ Access denied - check database password');
      console.error('Update the password in run-migration-direct.js');
    } else {
      console.error('❌ Migration failed:', error.message);
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✓ Database connection closed');
    }
  }
}

// Run the migration
runMigration();
