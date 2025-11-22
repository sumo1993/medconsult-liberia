import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAuth } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.userId;
    const userRole = user.role;

    // Get total team fees from all sources
    const [totalTeamFees]: any = await pool.execute(`
      SELECT 
        SUM(COALESCE(team_fee, 0)) as total_team_fee
      FROM consultant_earnings
    `);
    
    const totalTeamFee = parseFloat(totalTeamFees[0]?.total_team_fee || 0);

    let earnings = {
      role: userRole,
      totalEarned: 0,
      totalPaid: 0,
      unpaid: 0,
      lastPaymentDate: null,
      paymentStatus: 'unpaid',
      breakdown: {}
    };

    // Determine payment type based on role
    let paymentType = '';
    let sharePercentage = 0;

    if (userRole === 'admin') {
      paymentType = 'it_specialist';
      sharePercentage = 25 / 95; // 25% of team share
    } else if (userRole === 'accountant') {
      paymentType = 'accountant';
      sharePercentage = 15 / 95; // 15% of team share
    } else if (userRole === 'management') {
      paymentType = 'ceo';
      sharePercentage = 40 / 95; // 40% of team share
      
      // Management also gets consultant earnings
      const [consultantEarnings]: any = await pool.execute(`
        SELECT 
          SUM(COALESCE(net_earning, 0)) as total_consultant_earning,
          SUM(COALESCE(amount, 0)) as total_amount
        FROM consultant_earnings
        WHERE consultant_id = ?
      `, [userId]);
      
      earnings.breakdown = {
        consultantEarnings: parseFloat(consultantEarnings[0]?.total_consultant_earning || 0),
        totalAssignmentAmount: parseFloat(consultantEarnings[0]?.total_amount || 0)
      };
    } else if (userRole === 'consultant') {
      // Consultants get their direct earnings from assignments
      paymentType = 'consultant';
      
      const [consultantEarnings]: any = await pool.execute(`
        SELECT 
          SUM(COALESCE(net_earning, 0)) as total_consultant_earning,
          SUM(COALESCE(amount, 0)) as total_amount,
          COUNT(*) as total_assignments
        FROM consultant_earnings
        WHERE consultant_id = ?
      `, [userId]);
      
      earnings.breakdown = {
        consultantEarnings: parseFloat(consultantEarnings[0]?.total_consultant_earning || 0),
        totalAssignmentAmount: parseFloat(consultantEarnings[0]?.total_amount || 0),
        totalAssignments: parseInt(consultantEarnings[0]?.total_assignments || 0)
      };
      
      earnings.totalEarned = earnings.breakdown.consultantEarnings;
      
      // Get consultant payments
      const [consultantPayments]: any = await pool.execute(`
        SELECT 
          COALESCE(SUM(amount), 0) as consultant_paid,
          MAX(payment_date) as last_payment_date
        FROM payment_records
        WHERE payment_type = 'consultant' AND recipient_id = ?
      `, [userId]);
      
      earnings.totalPaid = parseFloat(consultantPayments[0]?.consultant_paid || 0);
      earnings.lastPaymentDate = consultantPayments[0]?.last_payment_date;
      earnings.unpaid = earnings.totalEarned - earnings.totalPaid;
      
      // Determine payment status
      if (earnings.unpaid <= 0) {
        earnings.paymentStatus = 'paid';
      } else if (earnings.totalPaid > 0) {
        earnings.paymentStatus = 'partial';
      } else {
        earnings.paymentStatus = 'unpaid';
      }
      
      return NextResponse.json(earnings);
    } else {
      return NextResponse.json({ error: 'Role not eligible for team earnings' }, { status: 403 });
    }

    // Calculate team share earnings
    const teamShareEarned = totalTeamFee * sharePercentage;

    // Get payments made to this user
    const [payments]: any = await pool.execute(`
      SELECT 
        COALESCE(SUM(amount), 0) as total_paid,
        MAX(payment_date) as last_payment_date
      FROM payment_records
      WHERE payment_type = ?
    `, [paymentType]);

    const totalPaid = parseFloat(payments[0]?.total_paid || 0);
    const lastPaymentDate = payments[0]?.last_payment_date;

    // For management, add consultant payments
    if (userRole === 'management') {
      const [consultantPayments]: any = await pool.execute(`
        SELECT 
          COALESCE(SUM(amount), 0) as consultant_paid
        FROM payment_records
        WHERE payment_type = 'consultant' AND recipient_id = ?
      `, [userId]);
      
      const consultantPaid = parseFloat(consultantPayments[0]?.consultant_paid || 0);
      earnings.breakdown = {
        ...earnings.breakdown,
        consultantPaid
      };
      
      earnings.totalEarned = (earnings.breakdown.consultantEarnings || 0) + teamShareEarned;
      earnings.totalPaid = consultantPaid + totalPaid;
    } else {
      earnings.totalEarned = teamShareEarned;
      earnings.totalPaid = totalPaid;
    }

    earnings.unpaid = earnings.totalEarned - earnings.totalPaid;
    earnings.lastPaymentDate = lastPaymentDate;
    
    // Determine payment status
    if (earnings.unpaid <= 0) {
      earnings.paymentStatus = 'paid';
    } else if (earnings.totalPaid > 0) {
      earnings.paymentStatus = 'partial';
    } else {
      earnings.paymentStatus = 'unpaid';
    }

    earnings.breakdown = {
      ...earnings.breakdown,
      teamShareEarned,
      teamSharePaid: totalPaid,
      teamShareUnpaid: teamShareEarned - totalPaid
    };

    return NextResponse.json(earnings);
  } catch (error: any) {
    console.error('Error fetching earnings:', error);
    return NextResponse.json({
      error: 'Failed to fetch earnings',
      details: error.message
    }, { status: 500 });
  }
}
