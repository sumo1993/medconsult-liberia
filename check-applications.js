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

async function checkApplications() {
  try {
    const connection = await mysql.createConnection({
      host: envVars.DB_HOST,
      user: envVars.DB_USER,
      password: envVars.DB_PASSWORD,
      database: envVars.DB_NAME,
    });

    console.log('✅ Connected to database');

    // Check if table exists
    const [tables] = await connection.query(
      "SHOW TABLES LIKE 'team_applications'"
    );
    
    if (tables.length === 0) {
      console.log('❌ Table team_applications does not exist');
      await connection.end();
      return;
    }

    console.log('✅ Table team_applications exists');

    // Get all applications
    const [applications] = await connection.query(
      'SELECT * FROM team_applications ORDER BY created_at DESC'
    );

    console.log('\n📊 Applications in database:', applications.length);
    
    if (applications.length > 0) {
      console.log('\n📋 Application Details:');
      applications.forEach((app, index) => {
        console.log(`\n--- Application ${index + 1} ---`);
        console.log('ID:', app.id);
        console.log('Name:', app.full_name);
        console.log('Email:', app.email);
        console.log('Phone:', app.phone);
        console.log('Specialty:', app.specialty);
        console.log('Status:', app.status);
        console.log('Created:', app.created_at);
      });
    } else {
      console.log('❌ No applications found in database');
    }

    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkApplications();
