import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAuth } from '@/lib/middleware';
import { RowDataPacket } from 'mysql2';

// GET - Fetch single submission
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const submissionId = parseInt(id);

    const [submissions] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        id, researcher_id, data_type, title, description, location,
        date_collected, sample_count, notes, file_name, file_type, status,
        reviewed_by, reviewed_at, created_at, updated_at,
        CASE WHEN file_data IS NOT NULL THEN 1 ELSE 0 END as has_file
       FROM research_submissions 
       WHERE id = ? AND researcher_id = ?`,
      [submissionId, user.userId]
    );

    if (submissions.length === 0) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const submission = submissions[0];
    
    return NextResponse.json({
      ...submission,
      has_file: Boolean(submission.has_file),
    });
  } catch (error) {
    console.error('Error fetching submission:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submission' },
      { status: 500 }
    );
  }
}

