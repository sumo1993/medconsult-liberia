import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow clients to access their own payments
    if (user.role !== 'client') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch assignments with payment receipts (completed, payment_uploaded, or in_progress with receipt)
    const [assignments] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        ar.id as assignment_id,
        ar.title as assignment_title,
        COALESCE(ar.final_price, ar.negotiated_price, ar.proposed_price, 0) as amount,
        ar.status,
        ar.payment_receipt_filename as receipt_filename,
        ar.payment_method,
        ar.updated_at as created_at,
        CASE 
          WHEN ar.status = 'completed' THEN 'completed'
          WHEN ar.status = 'payment_uploaded' THEN 'pending'
          WHEN ar.status = 'in_progress' THEN 'pending'
          WHEN ar.status = 'payment_verified' THEN 'completed'
          ELSE 'pending'
        END as payment_status,
        CONCAT('ASSIGN-', ar.id) as transaction_id,
        CASE 
          WHEN ar.status = 'completed' THEN 'Payment verified - Assignment completed'
          WHEN ar.status = 'payment_uploaded' THEN 'Payment uploaded - Awaiting verification'
          WHEN ar.status = 'in_progress' THEN 'Payment uploaded - Work in progress'
          WHEN ar.status = 'payment_verified' THEN 'Payment verified'
          ELSE 'Payment for assignment'
        END as notes
       FROM assignment_requests ar
       WHERE ar.client_id = ? 
       AND ar.payment_receipt_filename IS NOT NULL
       ORDER BY ar.updated_at DESC`,
      [user.userId]
    );

    // Format the data to match payment structure
    const paymentsData = assignments.map(a => ({
      id: a.assignment_id,
      assignment_id: a.assignment_id,
      assignment_title: a.assignment_title,
      amount: parseFloat(a.amount) || 0,
      status: a.payment_status,
      payment_method: a.payment_method || 'Mobile Money',
      created_at: a.created_at,
      transaction_id: a.transaction_id,
      notes: a.notes,
      receipt_filename: a.receipt_filename,
      has_receipt: !!a.receipt_filename,
      receipt_data: null
    }));

    return NextResponse.json(paymentsData);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}
