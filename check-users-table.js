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

async function checkUsersTable() {
  const connection = await mysql.createConnection({
    host: envVars.DB_HOST,
    user: envVars.DB_USER,
    password: envVars.DB_PASSWORD,
    database: envVars.DB_NAME,
  });

  console.log('✅ Connected to database');

  const [columns] = await connection.execute('DESCRIBE users');
  console.log('\n📋 Users table structure:');
  console.table(columns);

  await connection.end();
}

checkUsersTable().catch(console.error);
