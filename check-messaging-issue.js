const mysql = require('mysql2/promise');

async function checkMessagingIssue() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Gorpunadoue@95',
    database: 'medconsult_liberia',
  });

  try {
    console.log('Checking messaging system...\n');

    // Get client
    const [clients] = await connection.query(
      `SELECT id, email, full_name FROM users WHERE email = 'student@example.com'`
    );

    if (clients.length === 0) {
      console.log('❌ Client not found');
      return;
    }

    const client = clients[0];
    console.log(`Client: ${client.full_name} (ID: ${client.id})\n`);

    // Get assignments
    const [assignments] = await connection.query(
      `SELECT id, title, status FROM assignment_requests WHERE client_id = ?`,
      [client.id]
    );

    console.log(`Found ${assignments.length} assignment(s):\n`);

    if (assignments.length === 0) {
      console.log('❌ No assignments found\n');
      return;
    }

    // Check each assignment
    for (const assignment of assignments) {
      console.log(`Assignment: ${assignment.title} (ID: ${assignment.id})`);
      console.log(`Status: ${assignment.status}\n`);

      // Check if assignment_messages table exists
      try {
        const [messages] = await connection.query(
          `SELECT id, sender_id, message, created_at 
           FROM assignment_messages 
           WHERE assignment_request_id = ?
           ORDER BY created_at DESC
           LIMIT 5`,
          [assignment.id]
        );

        console.log(`  Messages: ${messages.length}`);
        
        if (messages.length > 0) {
          messages.forEach((msg, idx) => {
            console.log(`    ${idx + 1}. From user ${msg.sender_id}: "${msg.message.substring(0, 50)}..."`);
          });
        } else {
          console.log('    No messages yet');
        }
        console.log('');

      } catch (error) {
        console.log('  ❌ Error checking messages:', error.message);
        console.log('');
      }
    }

    // Check if assignment_messages table exists
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('Checking assignment_messages table structure...\n');
    
    try {
      const [columns] = await connection.query(
        `SHOW COLUMNS FROM assignment_messages`
      );

      console.log('✅ Table exists with columns:');
      columns.forEach(col => {
        console.log(`  - ${col.Field} (${col.Type})`);
      });
      console.log('');

    } catch (error) {
      console.log('❌ Table does not exist or error:', error.message);
      console.log('\nYou need to run the migration to create this table!');
      console.log('Run: node migrations/create-assignment-messages-table.js\n');
    }

    console.log('═══════════════════════════════════════════════════════════\n');

    // Test URLs
    console.log('Test these URLs in browser:');
    assignments.forEach(assignment => {
      console.log(`\nAssignment: ${assignment.title}`);
      console.log(`  Client URL: http://localhost:3000/dashboard/client/assignments/${assignment.id}`);
      console.log(`  API URL: http://localhost:3000/api/assignment-requests/${assignment.id}/messages`);
    });
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await connection.end();
  }
}

checkMessagingIssue();
