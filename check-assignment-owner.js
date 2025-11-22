const mysql = require('mysql2/promise');

async function checkOwner() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Gorpunadoue@95',
    database: 'medconsult_liberia',
  });

  try {
    console.log('Checking assignment ownership...\n');

    const [assignments] = await connection.execute(
      `SELECT ar.id, ar.title, ar.client_id, ar.status,
              u.email as client_email, u.full_name as client_name
       FROM assignment_requests ar
       JOIN users u ON ar.client_id = u.id
       ORDER BY ar.id`
    );

    console.log('All Assignments:');
    assignments.forEach(a => {
      console.log(`  #${a.id}: "${a.title}" - Client: ${a.client_name} (${a.client_email}) - Status: ${a.status}`);
    });

    console.log('\n---\n');

    // Check the test client
    const [testClient] = await connection.execute(
      `SELECT id, email, full_name FROM users WHERE email = 'student@example.com'`
    );

    if (testClient.length > 0) {
      const client = testClient[0];
      console.log(`Test Client: ${client.full_name} (${client.email}) - ID: ${client.id}\n`);

      const [clientAssignments] = await connection.execute(
        `SELECT COUNT(*) as count FROM assignment_requests WHERE client_id = ?`,
        [client.id]
      );

      console.log(`Total assignments for this client: ${clientAssignments[0].count}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkOwner();
