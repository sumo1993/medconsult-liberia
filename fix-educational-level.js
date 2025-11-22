const mysql = require('mysql2/promise');

async function fixEducationalLevel() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Gorpunadoue@95',
    database: 'medconsult_liberia',
  });

  try {
    console.log('Checking educational_level column...\n');

    // Check current column definition
    const [columns] = await connection.query("SHOW COLUMNS FROM users LIKE 'educational_level'");
    console.log('Current definition:', columns[0]);

    console.log('\nChanging educational_level from ENUM to VARCHAR...\n');

    // Change to VARCHAR to allow any value
    await connection.query(`
      ALTER TABLE users 
      MODIFY COLUMN educational_level VARCHAR(100)
    `);

    console.log('✅ Successfully changed educational_level to VARCHAR(100)');
    console.log('Now you can store any education level value!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

fixEducationalLevel();
