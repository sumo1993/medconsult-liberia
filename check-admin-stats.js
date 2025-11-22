const mysql = require('mysql2/promise');
const fs = require('fs');

async function checkAdminStats() {
  console.log('🔍 Checking Admin Dashboard Stats...\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'medconsult_liberia',
  });

  try {
    // Check users table
    const [users] = await connection.execute('SELECT COUNT(*) as count FROM users');
    console.log('✅ Total Users:', users[0].count);

    // Check contact_messages table
    try {
      const [messages] = await connection.execute('SELECT COUNT(*) as count FROM contact_messages');
      console.log('✅ Total Messages:', messages[0].count);
    } catch (error) {
      console.log('❌ Contact Messages table error:', error.message);
    }

    // Check appointments table
    try {
      const [appointments] = await connection.execute('SELECT COUNT(*) as count FROM appointments');
      console.log('✅ Total Appointments:', appointments[0].count);
    } catch (error) {
      console.log('❌ Appointments table error:', error.message);
    }

    // Check research_posts table
    try {
      const [research] = await connection.execute('SELECT COUNT(*) as count FROM research_posts');
      console.log('✅ Total Research Posts:', research[0].count);
    } catch (error) {
      console.log('❌ Research Posts table error:', error.message);
    }

    // Check assignment_requests table
    try {
      const [assignments] = await connection.execute('SELECT COUNT(*) as count FROM assignment_requests');
      console.log('✅ Total Assignment Requests:', assignments[0].count);
    } catch (error) {
      console.log('❌ Assignment Requests table error:', error.message);
    }

    console.log('\n📊 Summary:');
    console.log('If you see ❌ errors above, those tables might be missing or have issues.');
    console.log('If you see ✅ for all, the database is fine and the issue is elsewhere.');

  } catch (error) {
    console.error('\n❌ Database connection error:', error.message);
  } finally {
    await connection.end();
  }
}

checkAdminStats();
