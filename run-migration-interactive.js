// Interactive migration script to add featured image columns
const mysql = require('mysql2/promise');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function runMigration() {
  let connection;
  
  try {
    console.log('=== Database Migration: Add Featured Image Support ===\n');
    
    // Get database credentials
    const host = await question('Database host (default: localhost): ') || 'localhost';
    const user = await question('Database user (default: root): ') || 'root';
    const password = await question('Database password: ');
    const database = await question('Database name (default: medconsult_liberia): ') || 'medconsult_liberia';
    
    console.log('\nConnecting to database...');
    
    // Create connection
    connection = await mysql.createConnection({
      host,
      user,
      password,
      database,
    });

    console.log('✓ Connected to database\n');

    // Check if columns already exist
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'research_posts' 
      AND COLUMN_NAME IN ('featured_image', 'featured_image_filename', 'featured_image_size', 'download_count')
    `, [database]);

    if (columns.length > 0) {
      console.log('⚠ Some columns already exist:');
      console.log('  ', columns.map(c => c.COLUMN_NAME).join(', '));
      const proceed = await question('\nDo you want to skip this migration? (y/n): ');
      if (proceed.toLowerCase() === 'y') {
        console.log('Migration skipped.');
        return;
      }
    }

    // Run migration
    console.log('Running migration...\n');
    
    await connection.query(`
      ALTER TABLE research_posts 
      ADD COLUMN featured_image LONGBLOB AFTER pdf_size,
      ADD COLUMN featured_image_filename VARCHAR(255) AFTER featured_image,
      ADD COLUMN featured_image_size INT AFTER featured_image_filename,
      ADD COLUMN download_count INT DEFAULT 0 AFTER views
    `);

    console.log('✓ Migration completed successfully!\n');
    console.log('✓ Added columns:');
    console.log('  - featured_image (LONGBLOB)');
    console.log('  - featured_image_filename (VARCHAR(255))');
    console.log('  - featured_image_size (INT)');
    console.log('  - download_count (INT DEFAULT 0)');

  } catch (error) {
    console.error('\n✗ Migration failed:', error.message);
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('  Check your database credentials and try again.');
    } else if (error.code === 'ER_DUP_FIELDNAME') {
      console.error('  Column already exists. Migration may have been run previously.');
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✓ Database connection closed');
    }
    rl.close();
  }
}

// Run the migration
runMigration();
