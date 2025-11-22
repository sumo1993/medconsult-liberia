const mysql = require('mysql2/promise');

async function updateMessage() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Gorpunadoue@95',
    database: 'medconsult_liberia',
  });

  try {
    console.log('Updating payment confirmation message...\n');

    // Update the old message text to new text
    const [result] = await connection.execute(
      `UPDATE assignment_messages 
       SET message = 'Payment confirmed. In process.'
       WHERE message LIKE '%Payment confirmed%' 
       AND message LIKE '%in progress%'`
    );

    console.log('✅ Updated', result.affectedRows, 'message(s)\n');
    
    // Show updated messages
    const [messages] = await connection.execute(
      `SELECT id, assignment_request_id, message, created_at 
       FROM assignment_messages 
       WHERE message LIKE '%Payment confirmed%'
       ORDER BY created_at DESC
       LIMIT 5`
    );

    console.log('Recent payment messages:');
    messages.forEach(msg => {
      console.log(`  - Assignment #${msg.assignment_request_id}: "${msg.message}"`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

updateMessage();
