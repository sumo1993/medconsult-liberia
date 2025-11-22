import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAuth } from '@/lib/middleware';

// Ensure payment tables exist
async function ensurePaymentTables() {
  try {
    // Check if payment_records table exists
    const [tables]: any = await pool.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'payment_records'
    `);
    
    if (tables.length === 0) {
      // Create payment_records table
      await pool.execute(`
        CREATE TABLE payment_records (
          id INT PRIMARY KEY AUTO_INCREMENT,
          payment_type ENUM('consultant', 'accountant', 'it_specialist', 'other_team') NOT NULL,
          recipient_id INT NULL,
          recipient_name VARCHAR(255) NOT NULL,
          recipient_email VARCHAR(255) NOT NULL,
          amount DECIMAL(10, 2) NOT NULL,
          period_start DATE NOT NULL,
          period_end DATE NOT NULL,
          total_assignments INT DEFAULT 0,
          payment_method VARCHAR(50) DEFAULT 'bank_transfer',
          payment_reference VARCHAR(255) NULL,
          payment_date DATETIME NOT NULL,
          paid_by INT NOT NULL,
          notes TEXT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_recipient (recipient_id),
          INDEX idx_payment_date (payment_date),
          INDEX idx_period (period_start, period_end),
          INDEX idx_payment_type (payment_type)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
      console.log('✅ payment_records table created');
    }
  } catch (error) {
    console.error('Error ensuring payment tables:', error);
  }
}

// POST - Make a payment
export async function POST(request: NextRequest) {
  try {
    await ensurePaymentTables();
    
    const user = await verifyAuth(request);
    if (!user || (user.role !== 'admin' && user.role !== 'accountant')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      payment_type,
      recipient_id,
      recipient_name,
      recipient_email,
      amount,
      period_start,
      period_end,
      total_assignments,
      payment_method,
      payment_reference,
      notes
    } = body;

    if (!payment_type || !recipient_name || !amount || !period_start || !period_end) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Insert payment record
    const [result]: any = await pool.execute(
      `INSERT INTO payment_records 
       (payment_type, recipient_id, recipient_name, recipient_email, amount, 
        period_start, period_end, total_assignments, payment_method, payment_reference, 
        payment_date, paid_by, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)`,
      [
        payment_type,
        recipient_id || null,
        recipient_name,
        recipient_email,
        amount,
        period_start,
        period_end,
        total_assignments || 0,
        payment_method || 'bank_transfer',
        payment_reference || null,
        user.userId,
        notes || null
      ]
    );

    return NextResponse.json({
      message: 'Payment recorded successfully',
      payment_id: result.insertId
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error recording payment:', error);
    return NextResponse.json({
      error: 'Failed to record payment',
      details: error.message
    }, { status: 500 });
  }
}

// GET - Get payment history
export async function GET(request: NextRequest) {
  try {
    await ensurePaymentTables();
    
    const user = await verifyAuth(request);
    if (!user || (user.role !== 'admin' && user.role !== 'accountant')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const payment_type = searchParams.get('payment_type');
    const recipient_id = searchParams.get('recipient_id');
    const year = searchParams.get('year');

    let sql = `
      SELECT pr.*, u.full_name as paid_by_name
      FROM payment_records pr
      LEFT JOIN users u ON pr.paid_by = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (payment_type) {
      sql += ' AND pr.payment_type = ?';
      params.push(payment_type);
    }

    if (recipient_id) {
      sql += ' AND pr.recipient_id = ?';
      params.push(recipient_id);
    }

    if (year) {
      sql += ' AND YEAR(pr.payment_date) = ?';
      params.push(year);
    }

    sql += ' ORDER BY pr.payment_date DESC';

    const [payments] = await pool.execute(sql, params);

    return NextResponse.json(payments);
  } catch (error: any) {
    console.error('Error fetching payment history:', error);
    return NextResponse.json({
      error: 'Failed to fetch payment history',
      details: error.message
    }, { status: 500 });
  }
}
