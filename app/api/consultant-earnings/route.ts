import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAuth } from '@/lib/middleware';

// Ensure fee breakdown columns exist
async function ensureFeeBreakdownColumns() {
  try {
    const [columns]: any = await pool.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'consultant_earnings' 
      AND COLUMN_NAME = 'website_fee'
    `);
    
    if (columns.length === 0) {
      await pool.execute(`
        ALTER TABLE consultant_earnings 
        ADD COLUMN website_fee DECIMAL(10, 2) DEFAULT 0,
        ADD COLUMN team_fee DECIMAL(10, 2) DEFAULT 0,
        ADD COLUMN notes TEXT
      `);
      console.log('✅ Fee breakdown columns added to consultant_earnings');
    }
  } catch (error) {
    console.error('Error ensuring fee breakdown columns:', error);
  }
}

// GET consultant earnings
export async function GET(request: NextRequest) {
  try {
    await ensureFeeBreakdownColumns(); // Ensure columns exist
    
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const consultantId = searchParams.get('consultantId');
    const status = searchParams.get('status');

    let sql = `
      SELECT ce.*, 
             u.full_name as consultant_name,
             u.email as consultant_email,
             t.description as transaction_description,
             t.transaction_date
      FROM consultant_earnings ce
      JOIN users u ON ce.consultant_id = u.id
      LEFT JOIN transactions t ON ce.transaction_id = t.id
      WHERE 1=1
    `;
    const params: any[] = [];

    // Consultants and Researchers can only see their own earnings
    if (user.role === 'consultant' || user.role === 'researcher') {
      sql += ' AND ce.consultant_id = ?';
      params.push(user.userId);
    } else if (consultantId) {
      sql += ' AND ce.consultant_id = ?';
      params.push(consultantId);
    }

    if (status) {
      sql += ' AND ce.payment_status = ?';
      params.push(status);
    }

    sql += ' ORDER BY ce.created_at DESC';

    const [earnings] = await pool.execute(sql, params);
    return NextResponse.json(earnings);
  } catch (error) {
    console.error('Error fetching consultant earnings:', error);
    return NextResponse.json({ error: 'Failed to fetch earnings' }, { status: 500 });
  }
}

// PUT update earning payment status
export async function PUT(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user || (user.role !== 'admin' && user.role !== 'accountant')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, payment_status, notes } = body;

    if (!id || !payment_status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const payment_date = payment_status === 'paid' ? new Date() : null;

    await pool.execute(
      `UPDATE consultant_earnings 
       SET payment_status = ?, payment_date = ?, notes = ?, updated_at = NOW()
       WHERE id = ?`,
      [payment_status, payment_date, notes, id]
    );

    return NextResponse.json({ message: 'Earning updated successfully' });
  } catch (error) {
    console.error('Error updating earning:', error);
    return NextResponse.json({ error: 'Failed to update earning' }, { status: 500 });
  }
}
