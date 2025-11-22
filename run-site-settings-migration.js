const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Gorpunadoue@95',
      database: 'medconsult_liberia',
      multipleStatements: true
    });

    console.log('✓ Connected to database\n');
    
    // Check if table already exists
    const [tables] = await connection.query(
      "SHOW TABLES LIKE 'site_settings'"
    );

    if (tables.length > 0) {
      console.log('⚠️  site_settings table already exists');
      console.log('✓ Migration skipped\n');
    } else {
      const sql = fs.readFileSync(
        path.join(__dirname, 'migrations', 'create-site-settings.sql'),
        'utf8'
      );
      
      await connection.query(sql);
      console.log('✓ Created site_settings table');
      console.log('✓ Inserted default social media settings\n');
    }

    // Verify
    const [settings] = await connection.query('SELECT * FROM site_settings');
    console.log('✅ SUCCESS! Site settings table ready');
    console.log(`Found ${settings.length} setting(s)\n`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

runMigration();
