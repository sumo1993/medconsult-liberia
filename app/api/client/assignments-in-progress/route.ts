import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user || user.role !== 'client') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientId = user.userId;

    // Get assignments that are in progress (accepted, payment_uploaded, payment_verified, in_progress)
    const [assignments] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        ar.id,
        ar.title,
        ar.status,
        ar.deadline,
        DATEDIFF(ar.deadline, NOW()) as days_left,
        u.full_name as consultant_name,
        CASE 
          WHEN ar.status = 'accepted' THEN 'Accepted - Awaiting Payment'
          WHEN ar.status = 'payment_uploaded' THEN 'Payment Uploaded'
          WHEN ar.status = 'payment_verified' THEN 'Payment Verified'
          WHEN ar.status = 'in_progress' THEN 'Work In Progress'
          ELSE ar.status
        END as status_label
       FROM assignment_requests ar
       LEFT JOIN users u ON ar.doctor_id = u.id
       WHERE ar.client_id = ?
       AND ar.status IN ('accepted', 'payment_uploaded', 'payment_verified', 'in_progress')
       ORDER BY ar.deadline ASC
       LIMIT 5`,
      [clientId]
    );

    return NextResponse.json(assignments);
  } catch (error) {
    console.error('Error fetching in-progress assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch in-progress assignments' },
      { status: 500 }
    );
  }
}
