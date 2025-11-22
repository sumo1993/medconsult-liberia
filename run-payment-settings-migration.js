const mysql = require('mysql2/promise');

async function runMigration() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Gorpunadoue@95',
      database: 'medconsult_liberia',
      multipleStatements: true,
    });

    console.log('✓ Connected to database\n');

    // Check if table already exists
    const [tables] = await connection.query(
      "SHOW TABLES LIKE 'payment_settings'"
    );

    if (tables.length > 0) {
      console.log('⚠️  payment_settings table already exists');
      console.log('✓ Migration skipped\n');
    } else {
      // Create table
      await connection.query(`
        CREATE TABLE payment_settings (
          id INT PRIMARY KEY AUTO_INCREMENT,
          settings_json JSON NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log('✓ Created payment_settings table');

      // Insert default settings
      await connection.query(`
        INSERT INTO payment_settings (settings_json) VALUES (
          JSON_OBJECT(
            'mobileMoneyEnabled', true,
            'orangeMoneyNumber', '',
            'orangeMoneyName', '',
            'mtnNumber', '+231 888 293976',
            'mtnName', '',
            'bankTransferEnabled', false,
            'bankName', '',
            'accountName', '',
            'accountNumber', '',
            'swiftCode', '',
            'branchName', '',
            'internationalEnabled', false,
            'paypalEmail', '',
            'wiseEmail', '',
            'westernUnionName', '',
            'organizationName', 'MedConsult Liberia'
          )
        )
      `);
      console.log('✓ Inserted default payment settings\n');
    }

    // Verify
    const [settings] = await connection.query('SELECT * FROM payment_settings');
    console.log('✅ SUCCESS! Payment settings table ready');
    console.log(`Found ${settings.length} settings record(s)\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

runMigration();
