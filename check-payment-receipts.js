const mysql = require('mysql2/promise');

async function checkPaymentReceipts() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Gorpunadoue@95',
    database: 'medconsult_liberia',
  });

  try {
    console.log('🔍 Checking payment receipts in assignments...\n');

    // Check all assignments with payment receipts
    const [assignments] = await connection.query(`
      SELECT 
        ar.id,
        ar.title,
        ar.client_id,
        ar.status,
        ar.final_price,
        ar.proposed_price,
        ar.negotiated_price,
        ar.payment_receipt_filename,
        ar.payment_method,
        ar.updated_at,
        u.email as client_email,
        u.full_name as client_name
      FROM assignment_requests ar
      LEFT JOIN users u ON ar.client_id = u.id
      WHERE ar.payment_receipt_filename IS NOT NULL
      ORDER BY ar.updated_at DESC
    `);

    if (assignments.length === 0) {
      console.log('❌ No assignments with payment receipts found\n');
      return;
    }

    console.log(`Found ${assignments.length} assignment(s) with payment receipts:\n`);

    assignments.forEach((a, index) => {
      const price = a.final_price || a.negotiated_price || a.proposed_price || 0;
      console.log(`📄 Assignment ${index + 1}:`);
      console.log(`   ID: ${a.id}`);
      console.log(`   Title: ${a.title}`);
      console.log(`   Client: ${a.client_name} (${a.client_email})`);
      console.log(`   Status: ${a.status}`);
      console.log(`   Price: $${price}`);
      console.log(`   Payment Method: ${a.payment_method || 'N/A'}`);
      console.log(`   Receipt Filename: ${a.payment_receipt_filename}`);
      console.log(`   Updated: ${a.updated_at}`);
      
      // Check if it should appear in payment history
      if (a.status === 'completed' || a.status === 'payment_uploaded') {
        console.log(`   ✅ Should appear in Payment History`);
      } else {
        console.log(`   ⚠️  Status "${a.status}" - Will NOT appear in Payment History`);
        console.log(`      (Only "completed" and "payment_uploaded" statuses are shown)`);
      }
      console.log('');
    });

    // Check what statuses exist
    console.log('\n📊 All assignment statuses in database:');
    const [statuses] = await connection.query(`
      SELECT DISTINCT status, COUNT(*) as count
      FROM assignment_requests
      GROUP BY status
    `);
    
    statuses.forEach(s => {
      console.log(`   ${s.status}: ${s.count} assignment(s)`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkPaymentReceipts();
