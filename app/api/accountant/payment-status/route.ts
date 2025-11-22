import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAuth } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user || (user.role !== 'admin' && user.role !== 'accountant')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get payment status for all consultants
    const [consultantStatus] = await pool.execute(`
      SELECT 
        c.consultant_id,
        c.consultant_name,
        c.consultant_email,
        c.total_amount,
        c.consultant_share,
        COALESCE(SUM(pr.amount), 0) as total_paid,
        (c.consultant_share - COALESCE(SUM(pr.amount), 0)) as unpaid_amount,
        MAX(pr.payment_date) as last_payment_date,
        CASE 
          WHEN (c.consultant_share - COALESCE(SUM(pr.amount), 0)) <= 0 THEN 'paid'
          WHEN COALESCE(SUM(pr.amount), 0) > 0 THEN 'partial'
          ELSE 'unpaid'
        END as payment_status
      FROM (
        SELECT 
          u.id as consultant_id,
          u.full_name as consultant_name,
          u.email as consultant_email,
          SUM(COALESCE(ar.final_price, ar.negotiated_price, ar.proposed_price, 0)) as total_amount,
          SUM(ROUND(COALESCE(ar.final_price, ar.negotiated_price, ar.proposed_price, 0) * 0.75, 2)) as consultant_share
        FROM users u
        INNER JOIN assignment_requests ar ON u.id = ar.doctor_id
        WHERE u.role IN ('management', 'consultant')
        AND ar.status IN ('completed', 'payment_verified', 'payment_uploaded', 'in_progress')
        AND (ar.final_price > 0 OR ar.negotiated_price > 0 OR ar.proposed_price > 0)
        GROUP BY u.id, u.full_name, u.email
      ) c
      LEFT JOIN payment_records pr ON pr.recipient_id = c.consultant_id AND pr.payment_type = 'consultant'
      GROUP BY c.consultant_id, c.consultant_name, c.consultant_email, c.total_amount, c.consultant_share
      HAVING total_amount > 0
      ORDER BY unpaid_amount DESC
    `);

    // Get total team fees from all sources
    const [totalTeamFees]: any = await pool.execute(`
      SELECT 
        SUM(COALESCE(team_fee, 0)) as total_team_fee
      FROM consultant_earnings
    `);
    
    const totalTeamFee = parseFloat(totalTeamFees[0]?.total_team_fee || 0);
    
    // Calculate what each team member should receive
    // Universal distribution for ALL income: CEO 40%, IT 25%, Accountant 15%, Others 15%, Website 5%
    // The team_fee already contains the correct amount based on source
    
    const ceoShare = totalTeamFee * (40 / 95); // 40% of team share (95% total)
    const itShare = totalTeamFee * (25 / 95); // 25% of team share
    const accountantShare = totalTeamFee * (15 / 95); // 15% of team share
    const othersShare = totalTeamFee * (15 / 95); // 15% of team share
    
    // Get payment status for team members
    const [teamPayments]: any = await pool.execute(`
      SELECT 
        payment_type,
        COALESCE(SUM(amount), 0) as total_paid,
        MAX(payment_date) as last_payment_date
      FROM payment_records
      WHERE payment_type IN ('ceo', 'accountant', 'it_specialist', 'other_team')
      GROUP BY payment_type
    `);
    
    // Build team status with unpaid amounts
    const teamStatus = [
      {
        payment_type: 'ceo',
        total_earned: ceoShare,
        total_paid: parseFloat(teamPayments.find((t: any) => t.payment_type === 'ceo')?.total_paid || 0),
        unpaid_amount: ceoShare - parseFloat(teamPayments.find((t: any) => t.payment_type === 'ceo')?.total_paid || 0),
        last_payment_date: teamPayments.find((t: any) => t.payment_type === 'ceo')?.last_payment_date,
        payment_status: (ceoShare - parseFloat(teamPayments.find((t: any) => t.payment_type === 'ceo')?.total_paid || 0)) <= 0 ? 'paid' : 
                       (parseFloat(teamPayments.find((t: any) => t.payment_type === 'ceo')?.total_paid || 0) > 0 ? 'partial' : 'unpaid')
      },
      {
        payment_type: 'accountant',
        total_earned: accountantShare,
        total_paid: parseFloat(teamPayments.find((t: any) => t.payment_type === 'accountant')?.total_paid || 0),
        unpaid_amount: accountantShare - parseFloat(teamPayments.find((t: any) => t.payment_type === 'accountant')?.total_paid || 0),
        last_payment_date: teamPayments.find((t: any) => t.payment_type === 'accountant')?.last_payment_date,
        payment_status: (accountantShare - parseFloat(teamPayments.find((t: any) => t.payment_type === 'accountant')?.total_paid || 0)) <= 0 ? 'paid' : 
                       (parseFloat(teamPayments.find((t: any) => t.payment_type === 'accountant')?.total_paid || 0) > 0 ? 'partial' : 'unpaid')
      },
      {
        payment_type: 'it_specialist',
        total_earned: itShare,
        total_paid: parseFloat(teamPayments.find((t: any) => t.payment_type === 'it_specialist')?.total_paid || 0),
        unpaid_amount: itShare - parseFloat(teamPayments.find((t: any) => t.payment_type === 'it_specialist')?.total_paid || 0),
        last_payment_date: teamPayments.find((t: any) => t.payment_type === 'it_specialist')?.last_payment_date,
        payment_status: (itShare - parseFloat(teamPayments.find((t: any) => t.payment_type === 'it_specialist')?.total_paid || 0)) <= 0 ? 'paid' : 
                       (parseFloat(teamPayments.find((t: any) => t.payment_type === 'it_specialist')?.total_paid || 0) > 0 ? 'partial' : 'unpaid')
      },
      {
        payment_type: 'other_team',
        total_earned: othersShare,
        total_paid: parseFloat(teamPayments.find((t: any) => t.payment_type === 'other_team')?.total_paid || 0),
        unpaid_amount: othersShare - parseFloat(teamPayments.find((t: any) => t.payment_type === 'other_team')?.total_paid || 0),
        last_payment_date: teamPayments.find((t: any) => t.payment_type === 'other_team')?.last_payment_date,
        payment_status: (othersShare - parseFloat(teamPayments.find((t: any) => t.payment_type === 'other_team')?.total_paid || 0)) <= 0 ? 'paid' : 
                       (parseFloat(teamPayments.find((t: any) => t.payment_type === 'other_team')?.total_paid || 0) > 0 ? 'partial' : 'unpaid')
      }
    ];

    return NextResponse.json({
      consultants: consultantStatus,
      team: teamStatus
    });
  } catch (error: any) {
    console.error('Error fetching payment status:', error);
    return NextResponse.json({
      error: 'Failed to fetch payment status',
      details: error.message
    }, { status: 500 });
  }
}
