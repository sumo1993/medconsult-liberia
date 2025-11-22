import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAuth } from '@/lib/middleware';
import { RowDataPacket } from 'mysql2';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user || (user.role !== 'admin' && user.role !== 'accountant')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all consultants with their total earnings from completed assignments
    const [consultantEarnings] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        u.id as consultant_id,
        u.full_name as consultant_name,
        u.email as consultant_email,
        COUNT(ar.id) as total_assignments,
        SUM(COALESCE(ar.final_price, ar.negotiated_price, ar.proposed_price, 0)) as total_amount,
        SUM(ROUND(COALESCE(ar.final_price, ar.negotiated_price, ar.proposed_price, 0) * 0.75, 2)) as consultant_share,
        SUM(ROUND(COALESCE(ar.final_price, ar.negotiated_price, ar.proposed_price, 0) * 0.10, 2)) as website_fee,
        SUM(ROUND(COALESCE(ar.final_price, ar.negotiated_price, ar.proposed_price, 0) * 0.15, 2)) as team_fee,
        MAX(ar.completed_at) as last_completed
       FROM users u
       INNER JOIN assignment_requests ar ON u.id = ar.doctor_id
       WHERE u.role IN ('management', 'consultant')
       AND ar.status IN ('completed', 'payment_verified', 'payment_uploaded', 'in_progress')
       AND (ar.final_price > 0 OR ar.negotiated_price > 0 OR ar.proposed_price > 0)
       GROUP BY u.id, u.full_name, u.email
       HAVING total_amount > 0
       ORDER BY total_amount DESC`
    );
    
    // Get total team fees from ALL sources (assignments + partnerships/grants)
    const [totalTeamFees] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        SUM(COALESCE(team_fee, 0)) as total_team_fee,
        SUM(COALESCE(website_fee, 0)) as total_website_fee
       FROM consultant_earnings`
    );
    
    const teamFeeTotal = totalTeamFees[0]?.total_team_fee || 0;
    const websiteFeeTotal = totalTeamFees[0]?.total_website_fee || 0;

    return NextResponse.json({
      consultants: consultantEarnings,
      totalTeamFee: teamFeeTotal,
      totalWebsiteFee: websiteFeeTotal
    });
  } catch (error) {
    console.error('Error fetching consultant summary:', error);
    return NextResponse.json({ error: 'Failed to fetch consultant summary' }, { status: 500 });
  }
}
