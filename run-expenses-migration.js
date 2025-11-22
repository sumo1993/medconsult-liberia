const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'medconsult_liberia',
    multipleStatements: true
  });

  try {
    console.log('Connected to database');
    
    const sql = fs.readFileSync(
      path.join(__dirname, 'migrations', 'create-expenses-table.sql'),
      'utf8'
    );
    
    await connection.query(sql);
    console.log('✅ Expenses table created successfully!');
    
  } catch (error) {
    console.error('❌ Error running migration:', error);
  } finally {
    await connection.end();
  }
}

runMigration();
