const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Read .env.local file manually
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

async function getAdminCredentials() {
  const connection = await mysql.createConnection({
    host: envVars.DB_HOST,
    user: envVars.DB_USER,
    password: envVars.DB_PASSWORD,
    database: envVars.DB_NAME,
  });

  try {
    console.log('Fetching admin credentials...\n');

    const [admins] = await connection.execute(
      `SELECT email, role FROM users WHERE role = 'admin' LIMIT 5`
    );

    if (admins.length > 0) {
      console.log('📋 Admin Accounts Found:\n');
      admins.forEach((admin, index) => {
        console.log(`${index + 1}. Email: ${admin.email}`);
        console.log(`   Role: ${admin.role}`);
        console.log(`   Password: (hashed in database)\n`);
      });
      
      console.log('⚠️  Note: Passwords are hashed in the database for security.');
      console.log('If you need to login, use the email above and the password you set during registration.');
      console.log('\nIf you forgot the password, you can reset it through the forgot password page.');
    } else {
      console.log('❌ No admin accounts found in the database.');
      console.log('You may need to create an admin account first.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await connection.end();
  }
}

getAdminCredentials();
