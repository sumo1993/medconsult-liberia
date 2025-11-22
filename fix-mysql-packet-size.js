const mysql = require('mysql2/promise');

async function fixPacketSize() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Gorpunadoue@95',
      database: 'medconsult_liberia',
    });

    console.log('✓ Connected to database\n');

    // Check current setting
    const [current] = await connection.query("SHOW VARIABLES LIKE 'max_allowed_packet'");
    console.log('Current max_allowed_packet:', current[0].Value, 'bytes');
    console.log('That is:', (current[0].Value / 1024 / 1024).toFixed(2), 'MB\n');

    // Increase to 64MB
    await connection.query('SET GLOBAL max_allowed_packet=67108864');
    console.log('✓ Increased max_allowed_packet to 64MB\n');

    // Verify
    const [updated] = await connection.query("SHOW VARIABLES LIKE 'max_allowed_packet'");
    console.log('New max_allowed_packet:', updated[0].Value, 'bytes');
    console.log('That is:', (updated[0].Value / 1024 / 1024).toFixed(2), 'MB\n');

    console.log('✅ SUCCESS! MySQL can now handle larger uploads.');
    console.log('\n⚠️  Note: This change is temporary.');
    console.log('To make it permanent, restart your Next.js server.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

fixPacketSize();
