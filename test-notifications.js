const mysql = require('mysql2/promise');

async function testNotifications() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Gorpunadoue@95',
      database: 'medconsult_liberia',
    });

    console.log('✓ Connected to database\n');

    // Check each table
    console.log('📊 NOTIFICATION COUNTS:\n');

    // All messages
    const [messages] = await connection.query(
      "SELECT COUNT(*) as count FROM contact_messages"
    );
    console.log(`📧 Total Messages: ${messages[0].count}`);

    // Pending appointments
    const [appointments] = await connection.query(
      "SELECT COUNT(*) as count FROM appointments WHERE status = 'pending'"
    );
    console.log(`📅 Pending Appointments: ${appointments[0].count}`);

    // Pending assignments
    const [assignments] = await connection.query(
      "SELECT COUNT(*) as count FROM assignments WHERE status = 'pending'"
    );
    console.log(`📝 Pending Assignments: ${assignments[0].count}`);

    // Pending donation inquiries
    const [donations] = await connection.query(
      "SELECT COUNT(*) as count FROM donation_inquiries WHERE status = 'pending'"
    );
    console.log(`💰 Pending Donation Inquiries: ${donations[0].count}`);

    // Draft research posts
    const [research] = await connection.query(
      "SELECT COUNT(*) as count FROM research_posts WHERE status = 'draft'"
    );
    console.log(`📄 Draft Research Posts: ${research[0].count}`);

    console.log('\n✅ Test complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

testNotifications();
