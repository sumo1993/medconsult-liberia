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

    // Get total assignments
    const [totalResult] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM assignment_requests WHERE doctor_id = ?',
      [consultantId]
    );

    // Get pending assignments
    const [pendingResult] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM assignment_requests 
       WHERE doctor_id = ? AND status IN ('pending_review', 'price_proposed', 'negotiating', 'accepted')`,
      [consultantId]
    );

    // Get in-progress assignments
    const [inProgressResult] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM assignment_requests 
       WHERE doctor_id = ? AND status IN ('in_progress', 'payment_uploaded', 'payment_verified')`,
      [consultantId]
    );

    // Get completed this month
    const [completedThisMonthResult] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM assignment_requests 
       WHERE doctor_id = ? AND status = 'completed' 
       AND MONTH(completed_at) = MONTH(CURRENT_DATE()) 
       AND YEAR(completed_at) = YEAR(CURRENT_DATE())`,
      [consultantId]
    );

    // Get total earnings (sum of final_price for completed assignments)
    const [earningsResult] = await pool.execute<RowDataPacket[]>(
      `SELECT COALESCE(SUM(COALESCE(final_price, negotiated_price, proposed_price)), 0) as total 
       FROM assignment_requests 
       WHERE doctor_id = ? AND status = 'completed'`,
      [consultantId]
    );

    // Get pending payments
    const [pendingPaymentsResult] = await pool.execute<RowDataPacket[]>(
      `SELECT COALESCE(SUM(COALESCE(final_price, negotiated_price, proposed_price)), 0) as total 
       FROM assignment_requests 
       WHERE doctor_id = ? AND status IN ('payment_uploaded', 'payment_verified', 'in_progress')`,
      [consultantId]
    );

    // Calculate average response time (in hours)
    const [responseTimeResult] = await pool.execute<RowDataPacket[]>(
      `SELECT AVG(TIMESTAMPDIFF(HOUR, created_at, reviewed_at)) as avg_hours 
       FROM assignment_requests 
       WHERE doctor_id = ? AND reviewed_at IS NOT NULL`,
      [consultantId]
    );

    // Calculate completion rate
    const totalAssignments = totalResult[0].count;
    const [completedResult] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM assignment_requests WHERE doctor_id = ? AND status = \'completed\'',
      [consultantId]
    );
    const completionRate = totalAssignments > 0 
      ? Math.round((completedResult[0].count / totalAssignments) * 100) 
      : 0;

    // Get active clients count
    const [activeClientsResult] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(DISTINCT client_id) as count 
       FROM assignment_requests 
       WHERE doctor_id = ? AND status NOT IN ('rejected', 'cancelled')`,
      [consultantId]
    );

    return NextResponse.json({
      totalAssignments: totalResult[0].count,
      pendingAssignments: pendingResult[0].count,
      inProgressAssignments: inProgressResult[0].count,
      completedThisMonth: completedThisMonthResult[0].count,
      totalEarnings: parseFloat(earningsResult[0].total),
      pendingPayments: parseFloat(pendingPaymentsResult[0].total),
      averageResponseTime: Math.round(responseTimeResult[0].avg_hours || 0),
      completionRate,
      activeClients: activeClientsResult[0].count,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
