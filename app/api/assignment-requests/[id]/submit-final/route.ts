import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAuth } from '@/lib/middleware';
import { RowDataPacket } from 'mysql2';

interface FinalFileRow extends RowDataPacket {
  final_submission_data: Buffer | null;
  final_submission_filename: string | null;
  final_submission_type: string | null;
}

// POST - Submit final work
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    console.log('[Submit Final] Starting final submission...');
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'consultant' && user.role !== 'management' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Only consultants can submit final work' }, { status: 403 });
    }

    const params = await context.params;
    const requestId = parseInt(params.id);

    // Verify assignment ownership/authorization
    const [assignments] = await pool.execute<RowDataPacket[]>(
      'SELECT id, consultant_id, doctor_id FROM assignment_requests WHERE id = ?',
      [requestId]
    );
    if (assignments.length === 0) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }
    const assignment = assignments[0];
    const isAssignedConsultant =
      assignment.consultant_id === user.userId || assignment.doctor_id === user.userId;
    const isManagementOrAdmin = user.role === 'management' || user.role === 'admin';
    if (!isAssignedConsultant && !isManagementOrAdmin) {
      return NextResponse.json({ error: 'You are not assigned to this assignment' }, { status: 403 });
    }
    
    const body = await request.json();
    const { fileData, filename, notes } = body;

    if (!fileData || !filename) {
      return NextResponse.json({ error: 'File and filename required' }, { status: 400 });
    }

    // Convert base64 to buffer
    const base64Data = fileData.split(',')[1];
    const fileBuffer = Buffer.from(base64Data, 'base64');
    const fileSize = fileBuffer.length;
    const mimeMatch = fileData.match(/data:([^;]+);/);
    const fileType = mimeMatch ? mimeMatch[1] : 'application/octet-stream';

    console.log('[Submit Final] Uploading final work:', filename, 'Size:', fileSize);

    // Update with final submission
    await pool.execute(
      `UPDATE assignment_requests 
       SET final_submission_data = ?, 
           final_submission_filename = ?, 
           final_submission_size = ?, 
           final_submission_type = ?,
           final_submitted_at = NOW(),
            final_submission_notes = ?,
           client_review_status = 'pending',
           status = CASE
             WHEN status IN ('assigned', 'payment_verified', 'payment_uploaded') THEN 'in_progress'
             ELSE status
           END
       WHERE id = ?`,
      [fileBuffer, filename, fileSize, fileType, notes || null, requestId]
    );

    // Notify client about final work submission
    await pool.execute(
      `INSERT INTO assignment_messages (assignment_request_id, sender_id, message, message_type)
       VALUES (?, ?, ?, 'general')`,
      [
        requestId,
        user.userId,
        `✅ Final work completed and submitted: ${filename}${notes ? '\n\nNotes: ' + notes : '\n\nPlease review and accept or request revisions.'}`
      ]
    );

    console.log('[Submit Final] Final work submitted successfully');

    return NextResponse.json({ 
      success: true, 
      message: 'Final work submitted for client review'
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Submit Final] Error:', error);
    return NextResponse.json(
      { error: 'Failed to submit final work: ' + message },
      { status: 500 }
    );
  }
}

// GET - Download final submission
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const requestId = parseInt(params.id);

    const [rows] = await pool.execute<FinalFileRow[]>(
      `SELECT final_submission_data, final_submission_filename, final_submission_type
       FROM assignment_requests WHERE id = ?`,
      [requestId]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    const assignment = rows[0];
    if (!assignment.final_submission_data) {
      return NextResponse.json({ error: 'No final submission yet' }, { status: 404 });
    }

    return new NextResponse(assignment.final_submission_data, {
      headers: {
        'Content-Type': assignment.final_submission_type || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${assignment.final_submission_filename}"`,
      },
    });
  } catch (error) {
    console.error('[Download Final] Error:', error);
    return NextResponse.json({ error: 'Failed to download' }, { status: 500 });
  }
}
