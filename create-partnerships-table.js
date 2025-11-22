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

async function createPartnershipsTable() {
  const connection = await mysql.createConnection({
    host: envVars.DB_HOST,
    user: envVars.DB_USER,
    password: envVars.DB_PASSWORD,
    database: envVars.DB_NAME,
  });

  try {
    console.log('Creating partnerships table...');

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS partnerships (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(100) NOT NULL,
        logo VARCHAR(500) NULL,
        description TEXT NULL,
        website VARCHAR(500) NULL,
        contact_email VARCHAR(255) NULL,
        contact_phone VARCHAR(50) NULL,
        display_order INT DEFAULT 0,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        approved_by INT NULL,
        approved_at TIMESTAMP NULL,
        INDEX idx_status (status),
        INDEX idx_status_order (status, display_order)
      )
    `);

    console.log('✅ Partnerships table created successfully!');
    console.log('Status values: pending, approved, rejected');
    console.log('Only approved partnerships will show on public page');

  } catch (error) {
    console.error('❌ Error creating table:', error);
  } finally {
    await connection.end();
  }
}

createPartnershipsTable();
