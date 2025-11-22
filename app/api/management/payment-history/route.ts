import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user || user.role !== 'management') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const consultantId = user.userId;

    // Get payment history from completed and in-progress assignments
    const [payments] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        ar.id as assignment_id,
        ar.title as assignment_title,
        ar.status,
        COALESCE(ar.final_price, ar.negotiated_price, ar.proposed_price, 0) as amount,
        ar.payment_method,
        COALESCE(ar.completed_at, ar.updated_at) as payment_date,
        u.full_name as client_name
       FROM assignment_requests ar
       JOIN users u ON ar.client_id = u.id
       WHERE ar.doctor_id = ?
       AND ar.status IN ('completed', 'payment_uploaded', 'payment_verified', 'in_progress')
       AND ar.payment_receipt_filename IS NOT NULL
       ORDER BY payment_date DESC`,
      [consultantId]
    );

    // Format the data
    const formattedPayments = payments.map(p => ({
      id: p.assignment_id,
      assignment_id: p.assignment_id,
      assignment_title: p.assignment_title,
      client_name: p.client_name,
      amount: parseFloat(p.amount),
      status: p.status === 'completed' ? 'completed' : 'pending',
      payment_date: p.payment_date,
      payment_method: p.payment_method || 'Mobile Money',
    }));

    return NextResponse.json(formattedPayments);
  } catch (error) {
    console.error('Error fetching payment history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment history' },
      { status: 500 }
    );
  }
}
