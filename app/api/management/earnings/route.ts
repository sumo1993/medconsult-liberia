import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user || (user.role !== 'management' && user.role !== 'consultant' && user.role !== 'researcher')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const consultantId = user.userId;

    // This month earnings
    const [thisMonthResult] = await pool.execute<RowDataPacket[]>(
      `SELECT COALESCE(SUM(COALESCE(final_price, negotiated_price, proposed_price)), 0) as total 
       FROM assignment_requests 
       WHERE doctor_id = ? AND status = 'completed'
       AND MONTH(completed_at) = MONTH(CURRENT_DATE()) 
       AND YEAR(completed_at) = YEAR(CURRENT_DATE())`,
      [consultantId]
    );

    // Last month earnings
    const [lastMonthResult] = await pool.execute<RowDataPacket[]>(
      `SELECT COALESCE(SUM(COALESCE(final_price, negotiated_price, proposed_price)), 0) as total 
       FROM assignment_requests 
       WHERE doctor_id = ? AND status = 'completed'
       AND MONTH(completed_at) = MONTH(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))
       AND YEAR(completed_at) = YEAR(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))`,
      [consultantId]
    );

    // Total earnings
    const [totalResult] = await pool.execute<RowDataPacket[]>(
      `SELECT COALESCE(SUM(COALESCE(final_price, negotiated_price, proposed_price)), 0) as total 
       FROM assignment_requests 
       WHERE doctor_id = ? AND status = 'completed'`,
      [consultantId]
    );

    // Pending payments
    const [pendingResult] = await pool.execute<RowDataPacket[]>(
      `SELECT COALESCE(SUM(COALESCE(final_price, negotiated_price, proposed_price)), 0) as total 
       FROM assignment_requests 
       WHERE doctor_id = ? AND status IN ('payment_uploaded', 'payment_verified', 'in_progress')`,
      [consultantId]
    );

    return NextResponse.json({
      thisMonth: parseFloat(thisMonthResult[0].total),
      lastMonth: parseFloat(lastMonthResult[0].total),
      total: parseFloat(totalResult[0].total),
      pending: parseFloat(pendingResult[0].total),
    });
  } catch (error) {
    console.error('Error fetching earnings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch earnings' },
      { status: 500 }
    );
  }
}
