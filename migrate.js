// Simple migration script with password prompt
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
    console.log('=== Database Migration ===\n');
    
    const password = await question('Enter MySQL root password (press Enter if no password): ');
    
    console.log('\nConnecting to database...');
    
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: password,
      database: 'medconsult_liberia',
    });

    console.log('✓ Connected!\n');
    console.log('Running migration...\n');
    
    await connection.query(`
      ALTER TABLE research_posts 
      ADD COLUMN featured_image LONGBLOB AFTER pdf_size,
      ADD COLUMN featured_image_filename VARCHAR(255) AFTER featured_image,
      ADD COLUMN featured_image_size INT AFTER featured_image_filename,
      ADD COLUMN download_count INT DEFAULT 0 AFTER views
    `);

    console.log('✅ SUCCESS! Migration completed!\n');
    console.log('Added columns:');
    console.log('  ✓ featured_image');
    console.log('  ✓ featured_image_filename');
    console.log('  ✓ featured_image_size');
    console.log('  ✓ download_count\n');

  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('\n⚠️  Columns already exist!');
      console.log('Migration was previously run. No action needed.\n');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n❌ Wrong password! Try again.\n');
    } else {
      console.error('\n❌ Error:', error.message, '\n');
    }
  } finally {
    if (connection) await connection.end();
    rl.close();
  }
}

runMigration();
