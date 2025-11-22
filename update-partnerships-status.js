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

async function updatePartnershipsStatus() {
  const connection = await mysql.createConnection({
    host: envVars.DB_HOST,
    user: envVars.DB_USER,
    password: envVars.DB_PASSWORD,
    database: envVars.DB_NAME,
  });

  try {
    console.log('Updating partnerships table to support published status...\n');

    // Alter the status column to include 'published'
    await connection.execute(`
      ALTER TABLE partnerships 
      MODIFY COLUMN status ENUM('pending', 'approved', 'rejected', 'published') DEFAULT 'pending'
    `);

    console.log('✅ Partnerships table updated successfully!');
    console.log('Status values now: pending, approved, rejected, published');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await connection.end();
  }
}

updatePartnershipsStatus();
