const mysql = require('mysql2/promise');

async function updateConsultantName() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Gorpunadoue@95',
    database: 'medconsult_liberia',
  });

  try {
    console.log('📝 Updating consultant information...\n');

    // Update the consultant account
    const newName = 'Prof. Michael Johnson';
    const email = 'doctor@medconsult.com';

    await connection.execute(
      `UPDATE users SET full_name = ? WHERE email = ?`,
      [newName, email]
    );

    console.log('✅ Consultant information updated!\n');
    console.log(`   Email: ${email}`);
    console.log(`   New Name: ${newName}\n`);
    console.log('The consultant name will now appear correctly in assignments.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

updateConsultantName();
