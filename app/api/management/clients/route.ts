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

    // Get active clients with assignment counts
    const [clients] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        u.id,
        u.full_name,
        u.email,
        COUNT(ar.id) as assignments_count,
        MAX(ar.updated_at) as last_contact,
        SUM(CASE WHEN ar.status = 'completed' THEN 1 ELSE 0 END) as completed_count
       FROM users u
       INNER JOIN assignment_requests ar ON u.id = ar.client_id
       WHERE ar.doctor_id = ?
       GROUP BY u.id, u.full_name, u.email
       ORDER BY last_contact DESC
       LIMIT 20`,
      [consultantId]
    );

    return NextResponse.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    );
  }
}
