const mysql = require('mysql2/promise');

async function runMigration() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Gorpunadoue@95',
      database: 'medconsult_liberia',
    });

    console.log('✓ Connected to database\n');

    // Check if table already exists
    const [tables] = await connection.query(
      "SHOW TABLES LIKE 'donation_inquiries'"
    );

    if (tables.length > 0) {
      console.log('⚠️  donation_inquiries table already exists');
      console.log('✓ Migration skipped\n');
    } else {
      // Create table
      await connection.query(`
        CREATE TABLE donation_inquiries (
          id INT PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          phone VARCHAR(50),
          amount VARCHAR(100),
          message TEXT NOT NULL,
          status ENUM('pending', 'contacted', 'completed') DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log('✓ Created donation_inquiries table\n');
    }

    // Verify
    const [inquiries] = await connection.query('SELECT COUNT(*) as count FROM donation_inquiries');
    console.log('✅ SUCCESS! Donation inquiries table ready');
    console.log(`Found ${inquiries[0].count} inquiry record(s)\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

runMigration();
