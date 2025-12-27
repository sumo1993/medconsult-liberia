import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';

// GET - Fetch ALL assignment requests for consultants to view the pipeline
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only consultants can view this endpoint
    if (user.role !== 'consultant') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch ALL assignments so consultants can see the full pipeline
    // They can apply/express interest, but only work on ones assigned to them
    const [assignments] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        ar.id,
        ar.title,
        ar.subject,
        ar.description,
        ar.status,
        ar.deadline,
        ar.final_price,
        ar.proposed_price,
        ar.currency,
        ar.created_at,
        ar.assigned_at,
        ar.consultant_id,
        ar.final_submission_filename,
        ar.work_filename,
        ar.final_submitted_at,
        c.full_name as client_name,
        consultant.full_name as assigned_consultant_name,
        (SELECT COUNT(*) FROM assignment_applications aa WHERE aa.assignment_id = ar.id AND aa.consultant_id = ?) as has_applied,
        (SELECT status FROM assignment_applications aa WHERE aa.assignment_id = ar.id AND aa.consultant_id = ? LIMIT 1) as application_status,
        CASE WHEN ar.final_submission_data IS NOT NULL THEN 1 ELSE 0 END as has_final_work
      FROM assignment_requests ar
      LEFT JOIN users c ON ar.client_id = c.id
      LEFT JOIN users consultant ON ar.consultant_id = consultant.id
      ORDER BY ar.created_at DESC`,
      [user.userId, user.userId]
    );

    return NextResponse.json({ assignments });
  } catch (error) {
    console.error('Error fetching available assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignments' },
      { status: 500 }
    );
  }
}

