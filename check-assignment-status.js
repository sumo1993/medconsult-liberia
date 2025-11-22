const mysql = require('mysql2/promise');

async function checkStatus() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Gorpunadoue@95',
    database: 'medconsult_liberia',
  });

  try {
    console.log('Checking assignment status...\n');

    const [rows] = await connection.query(`
      SELECT id, title, status, payment_verified_at 
      FROM assignment_requests 
      WHERE title = 'math'
      ORDER BY created_at DESC 
      LIMIT 1
    `);

    if (rows.length > 0) {
      console.log('Assignment found:');
      console.log('ID:', rows[0].id);
      console.log('Title:', rows[0].title);
      console.log('Status:', rows[0].status);
      console.log('Payment Verified At:', rows[0].payment_verified_at);
    } else {
      console.log('No assignment found with title "math"');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkStatus();
