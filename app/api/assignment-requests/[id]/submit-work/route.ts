import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAuth } from '@/lib/middleware';
import { RowDataPacket } from 'mysql2';

interface WorkFileRow extends RowDataPacket {
  work_file_data: Buffer | null;
  work_filename: string | null;
  work_file_type: string | null;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    console.log('[Submit Work] Starting upload...');
    const user = await verifyAuth(request);
    if (!user) {
      console.log('[Submit Work] Unauthorized - no user');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Submit Work] User:', user.email, 'Role:', user.role);

    // Allow assigned consultant (primary), plus admin/management overrides.
    if (user.role !== 'consultant' && user.role !== 'management' && user.role !== 'admin') {
      console.log('[Submit Work] User not authorized - invalid role for submission');
      return NextResponse.json({ error: 'Only consultants can submit work' }, { status: 403 });
    }

    const params = await context.params;
    const requestId = parseInt(params.id);
    console.log('[Submit Work] Assignment ID:', requestId);

    // Verify assignment ownership/authorization
    const [assignments] = await pool.execute<RowDataPacket[]>(
      'SELECT id, consultant_id, doctor_id, status FROM assignment_requests WHERE id = ?',
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
    console.log('[Submit Work] Received filename:', filename, 'Has notes:', !!notes);

    if (!fileData || !filename) {
      return NextResponse.json({ error: 'File data and filename are required' }, { status: 400 });
    }

    // Convert base64 to buffer
    const base64Data = fileData.split(',')[1];
    const fileBuffer = Buffer.from(base64Data, 'base64');
    const fileSize = fileBuffer.length;
    
    // Get MIME type from data URL
    const mimeMatch = fileData.match(/data:([^;]+);/);
    const fileType = mimeMatch ? mimeMatch[1] : 'application/octet-stream';

    console.log('[Submit Work] Uploading work for assignment:', requestId);
    console.log('[Submit Work] Filename:', filename, 'Size:', fileSize, 'Type:', fileType);

    // Update assignment with work file
    await pool.execute(
      `UPDATE assignment_requests 
       SET work_file_data = ?, 
           work_filename = ?, 
           work_file_size = ?, 
           work_file_type = ?,
           work_submitted_at = NOW(),
           work_notes = ?,
           status = CASE
             WHEN status IN ('assigned', 'payment_verified', 'payment_uploaded') THEN 'in_progress'
             ELSE status
           END
       WHERE id = ?`,
      [fileBuffer, filename, fileSize, fileType, notes || null, requestId]
    );

    // Notify client about work submission
    await pool.execute(
      `INSERT INTO assignment_messages (assignment_request_id, sender_id, message, message_type)
       VALUES (?, ?, ?, 'general')`,
      [
        requestId,
        user.userId,
        `📄 Work file uploaded: ${filename}${notes ? '\n\nNotes: ' + notes : '\n\nPlease review the submitted work.'}`
      ]
    );

    console.log('[Submit Work] Work uploaded successfully');

    return NextResponse.json({ 
      success: true, 
      message: 'Work submitted successfully',
      filename,
      size: fileSize
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Submit Work] Error:', error);
    if (error instanceof Error) {
      console.error('[Submit Work] Error message:', error.message);
      console.error('[Submit Work] Error stack:', error.stack);
    }
    return NextResponse.json(
      { error: 'Failed to submit work: ' + message },
      { status: 500 }
    );
  }
}

// GET - Download submitted work
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

    // Get the work file
    const [rows] = await pool.execute<WorkFileRow[]>(
      `SELECT work_file_data, work_filename, work_file_type, work_submitted_at, work_notes
       FROM assignment_requests
       WHERE id = ?`,
      [requestId]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    const assignment = rows[0];

    if (!assignment.work_file_data) {
      return NextResponse.json({ error: 'No work file submitted yet' }, { status: 404 });
    }

    console.log('[Download Work] Serving file:', assignment.work_filename);

    // Return file
    return new NextResponse(assignment.work_file_data, {
      headers: {
        'Content-Type': assignment.work_file_type || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${assignment.work_filename}"`,
      },
    });
  } catch (error) {
    console.error('[Download Work] Error:', error);
    return NextResponse.json(
      { error: 'Failed to download work' },
      { status: 500 }
    );
  }
}
