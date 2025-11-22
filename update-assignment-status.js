const mysql = require('mysql2/promise');

async function updateStatus() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Gorpunadoue@95',
    database: 'medconsult_liberia',
  });

  try {
    console.log('Updating assignment #2 status...\n');

    // Update status from payment_verified to in_progress
    await connection.execute(
      `UPDATE assignment_requests 
       SET status = 'in_progress', payment_verified_at = NOW()
       WHERE id = 2 AND status = 'payment_verified'`
    );

    console.log('✅ Status updated to "in_progress"\n');

    // Verify the change
    const [result] = await connection.execute(
      `SELECT id, title, status FROM assignment_requests WHERE id = 2`
    );

    console.log('Current status:');
    console.log(`  Assignment #${result[0].id}: "${result[0].title}" - Status: ${result[0].status}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

updateStatus();
