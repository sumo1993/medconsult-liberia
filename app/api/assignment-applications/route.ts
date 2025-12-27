import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';

// GET - Fetch all applications for admin/management
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin' && user.role !== 'management') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get('assignmentId');
    const status = searchParams.get('status');

    let query = `
      SELECT 
        aa.id,
        aa.assignment_id,
        aa.consultant_id,
        aa.message,
        aa.status,
        aa.created_at,
        aa.reviewed_at,
        aa.rejection_reason,
        u.full_name as consultant_name,
        u.email as consultant_email,
        ar.title as assignment_title,
        ar.subject as assignment_subject,
        reviewer.full_name as reviewed_by_name
      FROM assignment_applications aa
      JOIN users u ON aa.consultant_id = u.id
      JOIN assignment_requests ar ON aa.assignment_id = ar.id
      LEFT JOIN users reviewer ON aa.reviewed_by = reviewer.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (assignmentId) {
      query += ' AND aa.assignment_id = ?';
      params.push(assignmentId);
    }

    if (status) {
      query += ' AND aa.status = ?';
      params.push(status);
    }

    query += ' ORDER BY aa.created_at DESC';

    const [applications] = await pool.execute<RowDataPacket[]>(query, params);

    return NextResponse.json({ applications });
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}

