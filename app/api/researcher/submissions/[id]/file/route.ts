import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAuth } from '@/lib/middleware';
import { RowDataPacket } from 'mysql2';

// GET - Fetch file data for a submission
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
      `SELECT file_data, file_name, file_type
       FROM research_submissions 
       WHERE id = ? AND researcher_id = ?`,
      [submissionId, user.userId]
    );

    if (submissions.length === 0) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const submission = submissions[0];

    if (!submission.file_data) {
      return NextResponse.json({ error: 'No file attached' }, { status: 404 });
    }

    // Convert buffer to base64 data URL
    const base64 = Buffer.from(submission.file_data).toString('base64');
    const mimeType = submission.file_type || 'application/octet-stream';
    const dataUrl = `data:${mimeType};base64,${base64}`;

    return NextResponse.json({
      file_data: dataUrl,
      file_name: submission.file_name,
      file_type: submission.file_type,
    });
  } catch (error) {
    console.error('Error fetching file:', error);
    return NextResponse.json(
      { error: 'Failed to fetch file' },
      { status: 500 }
    );
  }
}


