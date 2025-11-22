const mysql = require('mysql2/promise');

async function fixConsultantAssignment() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Gorpunadoue@95',
    database: 'medconsult_liberia',
  });

  try {
    console.log('🔍 Finding Isaac B Zeah\'s user ID...\n');

    // Find Isaac's user ID
    const [users] = await connection.query(`
      SELECT id, full_name, email, role
      FROM users
      WHERE email = 'isaacbzeah2018@gmail.com'
    `);

    if (users.length === 0) {
      console.log('❌ Isaac B Zeah not found in database');
      return;
    }

    const isaac = users[0];
    console.log(`✅ Found consultant: ${isaac.full_name} (${isaac.email})`);
    console.log(`   User ID: ${isaac.id}`);
    console.log(`   Role: ${isaac.role}\n`);

    // Update all assignments to be assigned to Isaac
    const [result] = await connection.execute(`
      UPDATE assignment_requests 
      SET doctor_id = ?
      WHERE doctor_id IS NOT NULL OR doctor_id != ?
    `, [isaac.id, isaac.id]);

    console.log(`✅ Updated ${result.affectedRows} assignment(s)\n`);

    // Show updated assignments
    const [assignments] = await connection.query(`
      SELECT 
        ar.id,
        ar.title,
        ar.status,
        ar.doctor_id,
        u.full_name as consultant_name,
        u.email as consultant_email
      FROM assignment_requests ar
      LEFT JOIN users u ON ar.doctor_id = u.id
      ORDER BY ar.id DESC
    `);

    console.log('📋 Current assignment assignments:\n');
    assignments.forEach(a => {
      console.log(`   Assignment #${a.id}: ${a.title}`);
      if (a.doctor_id) {
        console.log(`   ✅ Consultant: ${a.consultant_name} (${a.consultant_email})\n`);
      } else {
        console.log(`   ⚠️  No consultant assigned\n`);
      }
    });

    // Delete the test doctor account
    console.log('🗑️  Removing test consultant account...');
    await connection.execute(`
      DELETE FROM users WHERE email = 'doctor@medconsult.com'
    `);
    console.log('✅ Test account removed\n');

    console.log('✨ All assignments are now assigned to Isaac B Zeah!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

fixConsultantAssignment();
