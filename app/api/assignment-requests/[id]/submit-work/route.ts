import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAuth } from '@/lib/middleware';

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

    // Only doctors/admins can submit work
    if (user.role !== 'management' && user.role !== 'admin') {
      console.log('[Submit Work] User not authorized - not a consultant');
      return NextResponse.json({ error: 'Only consultants can submit work' }, { status: 403 });
    }

    const params = await context.params;
    const requestId = parseInt(params.id);
    console.log('[Submit Work] Assignment ID:', requestId);
    
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
           work_notes = ?
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
  } catch (error: any) {
    console.error('[Submit Work] Error:', error);
    console.error('[Submit Work] Error message:', error.message);
    console.error('[Submit Work] Error stack:', error.stack);
    return NextResponse.json(
      { error: 'Failed to submit work: ' + error.message },
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
    const [rows] = await pool.execute(
      `SELECT work_file_data, work_filename, work_file_type, work_submitted_at, work_notes
       FROM assignment_requests
       WHERE id = ?`,
      [requestId]
    );

    if (!rows || (rows as any[]).length === 0) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    const assignment = (rows as any[])[0];

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
