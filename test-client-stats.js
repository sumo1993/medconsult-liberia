const mysql = require('mysql2/promise');

async function testStats() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Gorpunadoue@95',
    database: 'medconsult_liberia',
  });

  try {
    console.log('Testing client stats query...\n');

    // Get the test client
    const [users] = await connection.execute(
      `SELECT id, email, full_name FROM users WHERE email = 'student@example.com'`
    );

    if (users.length === 0) {
      console.log('❌ Client not found!');
      return;
    }

    const client = users[0];
    console.log(`Client: ${client.full_name} (${client.email}) - ID: ${client.id}\n`);

    // Test the exact query from the API
    const [assignments] = await connection.execute(
      'SELECT COUNT(*) as count FROM assignment_requests WHERE client_id = ?',
      [client.id]
    );

    console.log('✅ Total assignments:', assignments[0].count);

    // Get assignments with feedback
    const [withFeedback] = await connection.execute(
      'SELECT COUNT(*) as count FROM assignment_requests WHERE client_id = ? AND feedback IS NOT NULL',
      [client.id]
    );

    console.log('✅ With feedback:', withFeedback[0].count);

    // Get completed assignments
    const [completed] = await connection.execute(
      'SELECT COUNT(*) as count FROM assignment_requests WHERE client_id = ? AND status = "completed"',
      [client.id]
    );

    console.log('✅ Completed:', completed[0].count);

    // List all assignments for this client
    const [allAssignments] = await connection.execute(
      'SELECT id, title, status FROM assignment_requests WHERE client_id = ?',
      [client.id]
    );

    console.log('\nAll assignments:');
    allAssignments.forEach(a => {
      console.log(`  #${a.id}: "${a.title}" - ${a.status}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await connection.end();
  }
}

testStats();
