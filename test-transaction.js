const mysql = require('mysql2/promise');

async function testTransaction() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'medconsult_db',
    waitForConnections: true,
    connectionLimit: 10,
  });

  try {
    // Test inserting a transaction with team distribution
    const [result] = await pool.execute(
      `INSERT INTO transactions 
       (transaction_type, amount, currency, description, consultant_id, client_id, 
        partnership_id, payment_method, payment_status, transaction_date, created_by, receipt_photo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'partnership_payment',
        1000,
        'USD',
        'Test partnership payment',
        null,
        null,
        null,
        'bank_transfer',
        'completed',
        new Date(),
        1,
        null
      ]
    );

    console.log('Transaction created:', result.insertId);

    // Test creating team earning entry
    const teamFee = 150; // 15% of 1000
    const [earningResult] = await pool.execute(
      `INSERT INTO consultant_earnings 
       (consultant_id, transaction_id, amount, commission_rate, net_earning, payment_status, 
        website_fee, team_fee, notes)
       VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?)`,
      [
        null,
        result.insertId,
        1000,
        0,
        0,
        0,
        teamFee,
        'Team distribution from partnership_payment: 15% team ($150.00)'
      ]
    );

    console.log('Team earning created:', earningResult.insertId);
    console.log('SUCCESS!');

  } catch (error) {
    console.error('ERROR:', error.message);
    console.error('SQL Error:', error.sqlMessage);
    console.error('Code:', error.code);
  } finally {
    await pool.end();
  }
}

testTransaction();
