import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user || (user.role !== 'admin' && user.role !== 'accountant')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all payments from assignment_requests (client payments)
    // Include all assignments with payment activity (payment uploaded, verified, in progress, or completed)
    // Calculate 75/10/15 split for each payment
    const [assignmentPayments] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        ar.id,
        'assignment_payment' as payment_type,
        ar.title as description,
        COALESCE(ar.final_price, ar.negotiated_price, ar.proposed_price, 0) as amount,
        ROUND(COALESCE(ar.final_price, ar.negotiated_price, ar.proposed_price, 0) * 0.75, 2) as consultant_share,
        ROUND(COALESCE(ar.final_price, ar.negotiated_price, ar.proposed_price, 0) * 0.10, 2) as website_fee,
        ROUND(COALESCE(ar.final_price, ar.negotiated_price, ar.proposed_price, 0) * 0.15, 2) as team_fee,
        ar.payment_method,
        ar.payment_receipt_filename as receipt,
        CASE 
          WHEN ar.status = 'completed' THEN 'completed'
          WHEN ar.status = 'payment_verified' THEN 'verified'
          WHEN ar.status = 'payment_uploaded' THEN 'pending'
          WHEN ar.status = 'in_progress' THEN 'in_progress'
          ELSE 'pending'
        END as payment_status,
        ar.status as assignment_status,
        COALESCE(ar.completed_at, ar.updated_at) as payment_date,
        u_client.full_name as client_name,
        u_client.email as client_email,
        u_doctor.full_name as consultant_name,
        u_doctor.email as consultant_email,
        CONCAT('ASSIGN-', ar.id) as transaction_id
       FROM assignment_requests ar
       LEFT JOIN users u_client ON ar.client_id = u_client.id
       LEFT JOIN users u_doctor ON ar.doctor_id = u_doctor.id
       WHERE ar.status IN ('payment_uploaded', 'payment_verified', 'in_progress', 'completed')
       AND (ar.final_price > 0 OR ar.negotiated_price > 0 OR ar.proposed_price > 0)
       ORDER BY ar.updated_at DESC`
    );

    // Get all transactions from transactions table with 75/10/15 breakdown
    const [transactions] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        t.id,
        'transaction' as payment_type,
        t.description,
        t.amount,
        ROUND(t.amount * 0.75, 2) as consultant_share,
        ROUND(t.amount * 0.10, 2) as website_fee,
        ROUND(t.amount * 0.15, 2) as team_fee,
        t.payment_method,
        t.receipt_photo as receipt,
        t.payment_status,
        t.transaction_type as assignment_status,
        t.transaction_date as payment_date,
        u_client.full_name as client_name,
        u_client.email as client_email,
        u_consultant.full_name as consultant_name,
        u_consultant.email as consultant_email,
        CONCAT('TRANS-', t.id) as transaction_id
       FROM transactions t
       LEFT JOIN users u_client ON t.client_id = u_client.id
       LEFT JOIN users u_consultant ON t.consultant_id = u_consultant.id
       ORDER BY t.transaction_date DESC`
    );

    // Combine all payments
    const allPayments = [
      ...assignmentPayments.map(p => ({
        id: p.id,
        payment_type: p.payment_type,
        transaction_id: p.transaction_id,
        description: p.description,
        amount: parseFloat(p.amount) || 0,
        payment_method: p.payment_method || 'Mobile Money',
        payment_status: p.payment_status,
        assignment_status: p.assignment_status,
        payment_date: p.payment_date,
        client_name: p.client_name,
        client_email: p.client_email,
        consultant_name: p.consultant_name,
        consultant_email: p.consultant_email,
        has_receipt: !!p.receipt,
        receipt_filename: p.receipt
      })),
      ...transactions.map(t => ({
        id: t.id,
        payment_type: t.payment_type,
        transaction_id: t.transaction_id,
        description: t.description,
        amount: parseFloat(t.amount) || 0,
        payment_method: t.payment_method || 'Cash',
        payment_status: t.payment_status,
        assignment_status: t.assignment_status,
        payment_date: t.payment_date,
        client_name: t.client_name,
        client_email: t.client_email,
        consultant_name: t.consultant_name,
        consultant_email: t.consultant_email,
        has_receipt: false,
        receipt_filename: null
      }))
    ];

    // Sort by date
    allPayments.sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());

    // Calculate summary stats
    const totalRevenue = allPayments
      .filter(p => p.payment_status === 'completed' || p.payment_status === 'verified')
      .reduce((sum, p) => sum + p.amount, 0);

    const pendingPayments = allPayments
      .filter(p => p.payment_status === 'pending')
      .reduce((sum, p) => sum + p.amount, 0);

    const totalPayments = allPayments.length;
    const completedPayments = allPayments.filter(p => p.payment_status === 'completed' || p.payment_status === 'verified').length;

    return NextResponse.json({
      payments: allPayments,
      summary: {
        totalRevenue,
        pendingPayments,
        totalPayments,
        completedPayments
      }
    });
  } catch (error) {
    console.error('Error fetching all payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}
