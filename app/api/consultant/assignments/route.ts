import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only consultants can access their assignments
    if (user.role !== 'consultant') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch assignments assigned to this consultant
    const [assignments] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        ar.id,
        ar.title,
        ar.subject,
        ar.description,
        ar.status,
        ar.deadline,
        ar.final_price,
        ar.currency,
        ar.created_at,
        ar.assigned_at,
        c.full_name as client_name
      FROM assignment_requests ar
      LEFT JOIN users c ON ar.client_id = c.id
      WHERE ar.consultant_id = ?
      ORDER BY ar.created_at DESC`,
      [user.userId]
    );

    return NextResponse.json({ assignments });
  } catch (error) {
    console.error('Error fetching consultant assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignments' },
      { status: 500 }
    );
  }
}

