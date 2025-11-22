const mysql = require('mysql2/promise');

async function checkClientAssignments() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Gorpunadoue@95',
    database: 'medconsult_liberia',
  });

  try {
    console.log('Checking client assignments...\n');

    // Get client ID
    const [clients] = await connection.query(
      `SELECT id, email, full_name FROM users WHERE email = 'student@example.com'`
    );

    if (clients.length === 0) {
      console.log('❌ Client not found');
      return;
    }

    const client = clients[0];
    console.log(`Client: ${client.full_name} (ID: ${client.id})\n`);

    // Check assignment_requests table
    const [assignments] = await connection.query(
      `SELECT id, title, subject, status, created_at 
       FROM assignment_requests 
       WHERE client_id = ?
       ORDER BY created_at DESC`,
      [client.id]
    );

    console.log(`Found ${assignments.length} assignment(s):\n`);

    if (assignments.length === 0) {
      console.log('❌ No assignments found for this client\n');
      console.log('Creating a test assignment...\n');
      
      // Create a test assignment
      await connection.query(
        `INSERT INTO assignment_requests 
         (client_id, title, subject, description, deadline, status) 
         VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY), 'pending_review')`,
        [
          client.id,
          'Test Assignment - Help with Research Paper',
          'Medical Research',
          'I need help with my medical research paper on cardiovascular diseases. Please review and provide feedback.'
        ]
      );
      
      console.log('✅ Test assignment created!\n');
      
      // Fetch again
      const [newAssignments] = await connection.query(
        `SELECT id, title, subject, status, created_at 
         FROM assignment_requests 
         WHERE client_id = ?
         ORDER BY created_at DESC`,
        [client.id]
      );
      
      console.log('Updated assignment list:\n');
      newAssignments.forEach((assignment, index) => {
        console.log(`${index + 1}. ${assignment.title}`);
        console.log(`   ID: ${assignment.id}`);
        console.log(`   Subject: ${assignment.subject}`);
        console.log(`   Status: ${assignment.status}`);
        console.log(`   Created: ${assignment.created_at}`);
        console.log('');
      });
    } else {
      assignments.forEach((assignment, index) => {
        console.log(`${index + 1}. ${assignment.title}`);
        console.log(`   ID: ${assignment.id}`);
        console.log(`   Subject: ${assignment.subject}`);
        console.log(`   Status: ${assignment.status}`);
        console.log(`   Created: ${assignment.created_at}`);
        console.log('');
      });
    }

    // Check the API endpoint
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('API Endpoint Test:');
    console.log(`GET /api/assignment-requests?client_id=${client.id}`);
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await connection.end();
  }
}

checkClientAssignments();
