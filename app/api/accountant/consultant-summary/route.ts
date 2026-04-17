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

    // Assignments split rule:
    // - Assignee consultant: 50%
    // - CEO: 10%
    // - Website: 10%
    // - IT + Accountant + Other team: 30% (combined as team_fee here)
    // IMPORTANT: assignee is consultant_id (fallback doctor_id for legacy rows)
    const [consultantEarnings] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        u.id as consultant_id,
        u.full_name as consultant_name,
        u.email as consultant_email,
        COUNT(ar.id) as total_assignments,
        SUM(COALESCE(ar.final_price, ar.negotiated_price, ar.proposed_price, 0)) as total_amount,
        SUM(ROUND(COALESCE(ar.final_price, ar.negotiated_price, ar.proposed_price, 0) * 0.50, 2)) as consultant_share,
        SUM(ROUND(COALESCE(ar.final_price, ar.negotiated_price, ar.proposed_price, 0) * 0.10, 2)) as website_fee,
        SUM(ROUND(COALESCE(ar.final_price, ar.negotiated_price, ar.proposed_price, 0) * 0.40, 2)) as team_fee,
        MAX(ar.completed_at) as last_completed
       FROM users u
       INNER JOIN assignment_requests ar ON u.id = COALESCE(ar.consultant_id, ar.doctor_id)
       WHERE u.role IN ('management', 'consultant')
       AND ar.status IN ('completed', 'payment_verified', 'payment_uploaded', 'in_progress')
       AND (ar.final_price > 0 OR ar.negotiated_price > 0 OR ar.proposed_price > 0)
       GROUP BY u.id, u.full_name, u.email
       HAVING total_amount > 0
       ORDER BY total_amount DESC`
    );
    
    // Calculate assignment-based shares (works even if consultant_earnings table has no rows)
    const [assignmentShares] = await pool.execute<RowDataPacket[]>(
      `SELECT
        COALESCE(SUM(ROUND(COALESCE(ar.final_price, ar.negotiated_price, ar.proposed_price, 0) * 0.40, 2)), 0) as assignment_team_fee,
        COALESCE(SUM(ROUND(COALESCE(ar.final_price, ar.negotiated_price, ar.proposed_price, 0) * 0.10, 2)), 0) as assignment_website_fee
       FROM users u
       INNER JOIN assignment_requests ar ON u.id = COALESCE(ar.consultant_id, ar.doctor_id)
       WHERE u.role IN ('management', 'consultant')
       AND ar.status IN ('completed', 'payment_verified', 'payment_uploaded', 'in_progress')
       AND (ar.final_price > 0 OR ar.negotiated_price > 0 OR ar.proposed_price > 0)`
    );

    // Add team-only transaction shares (e.g. partnerships/grants) from consultant_earnings
    const [teamOnlyShares] = await pool.execute<RowDataPacket[]>(
      `SELECT
        COALESCE(SUM(team_fee), 0) as extra_team_fee,
        COALESCE(SUM(website_fee), 0) as extra_website_fee
       FROM consultant_earnings
       WHERE consultant_id IS NULL`
    );

    const assignmentTeamFee = parseFloat(assignmentShares[0]?.assignment_team_fee || 0);
    const assignmentWebsiteFee = parseFloat(assignmentShares[0]?.assignment_website_fee || 0);
    const partnerTeamFee = parseFloat(teamOnlyShares[0]?.extra_team_fee || 0);
    const partnerWebsiteFee = parseFloat(teamOnlyShares[0]?.extra_website_fee || 0);

    const teamFeeTotal = assignmentTeamFee + partnerTeamFee;
    const websiteFeeTotal = assignmentWebsiteFee + partnerWebsiteFee;

    return NextResponse.json({
      consultants: consultantEarnings,
      totalTeamFee: teamFeeTotal,
      totalWebsiteFee: websiteFeeTotal,
      breakdown: {
        assignmentTeamFee,
        assignmentWebsiteFee,
        partnerTeamFee,
        partnerWebsiteFee
      }
    });
  } catch (error) {
    console.error('Error fetching consultant summary:', error);
    return NextResponse.json({ error: 'Failed to fetch consultant summary' }, { status: 500 });
  }
}
