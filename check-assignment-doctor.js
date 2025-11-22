const mysql = require('mysql2/promise');

async function checkAssignmentDoctor() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Gorpunadoue@95',
    database: 'medconsult_liberia',
  });

  try {
    console.log('🔍 Checking assignment consultant assignments...\n');

    const [assignments] = await connection.query(`
      SELECT 
        ar.id,
        ar.title,
        ar.status,
        ar.client_id,
        ar.doctor_id,
        c.full_name as client_name,
        c.email as client_email,
        d.full_name as consultant_name,
        d.email as consultant_email
      FROM assignment_requests ar
      LEFT JOIN users c ON ar.client_id = c.id
      LEFT JOIN users d ON ar.doctor_id = d.id
      ORDER BY ar.id DESC
    `);

    if (assignments.length === 0) {
      console.log('❌ No assignments found\n');
      return;
    }

    console.log(`Found ${assignments.length} assignment(s):\n`);

    assignments.forEach((a, index) => {
      console.log(`📄 Assignment ${index + 1}:`);
      console.log(`   ID: ${a.id}`);
      console.log(`   Title: ${a.title}`);
      console.log(`   Status: ${a.status}`);
      console.log(`   Client: ${a.client_name} (${a.client_email})`);
      
      if (a.doctor_id) {
        console.log(`   ✅ Consultant Assigned: ${a.consultant_name} (${a.consultant_email})`);
      } else {
        console.log(`   ⚠️  No consultant assigned yet`);
      }
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkAssignmentDoctor();
