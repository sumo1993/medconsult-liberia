const mysql = require('mysql2/promise');
const fs = require('fs');

// Read .env.local manually
const envContent = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

async function checkPasswordColumn() {
  const connection = await mysql.createConnection({
    host: envVars.DB_HOST,
    user: envVars.DB_USER,
    password: envVars.DB_PASSWORD,
    database: envVars.DB_NAME,
  });

  console.log('✅ Connected to database');

  const [columns] = await connection.execute('DESCRIBE users');
  
  console.log('\n📋 All column names:');
  columns.forEach((col, index) => {
    console.log(`${index + 1}. ${col.Field}`);
  });

  const passwordCol = columns.find(col => col.Field.toLowerCase().includes('pass'));
  if (passwordCol) {
    console.log('\n🔐 Password column found:', passwordCol.Field);
  } else {
    console.log('\n❌ No password column found!');
  }

  await connection.end();
}

checkPasswordColumn().catch(console.error);
