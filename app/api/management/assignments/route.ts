import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user || (user.role !== 'management' && user.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all assignment requests with client information
    const [assignments] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        ar.*,
        u.full_name as client_name,
        u.email as client_email
       FROM assignment_requests ar
       JOIN users u ON ar.client_id = u.id
       ORDER BY 
         CASE ar.status
           WHEN 'pending' THEN 1
           WHEN 'in_progress' THEN 2
           WHEN 'completed' THEN 3
           WHEN 'rejected' THEN 4
         END,
         ar.created_at DESC`
    );

    return NextResponse.json({ assignments });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignments' },
      { status: 500 }
    );
  }
}
