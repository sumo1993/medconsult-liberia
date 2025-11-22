const mysql = require('mysql2/promise');
const fs = require('fs');

// Read .env.local manually
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim();
});

async function checkUser() {
  const connection = await mysql.createConnection({
    host: env.DB_HOST,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
  });

  console.log('Checking user ID 12...\n');

  const [users] = await connection.execute(
    'SELECT id, full_name, email, role, profile_photo_filename, profile_photo_size FROM users WHERE id = 12'
  );

  if (users.length === 0) {
    console.log('❌ User ID 12 not found!');
  } else {
    console.log('✅ User found:');
    console.log(JSON.stringify(users[0], null, 2));
    console.log('\nRole:', users[0].role);
    console.log('Has photo:', !!users[0].profile_photo_filename);
  }

  await connection.end();
}

checkUser().catch(console.error);
