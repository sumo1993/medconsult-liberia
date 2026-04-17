import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';

// GET - Download/Stream file from database
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Fetch file with assignment ownership info
    const [files] = await pool.execute<RowDataPacket[]>(
      `SELECT af.file_name, af.file_type, af.file_data, ar.client_id, ar.consultant_id, ar.doctor_id
       FROM assignment_files af
       JOIN assignment_requests ar ON af.assignment_request_id = ar.id
       WHERE af.id = ?`,
      [id]
    );

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const file = files[0];

    // Verify the user is a participant or admin/management
    const isParticipant =
      file.client_id === user.userId ||
      file.consultant_id === user.userId ||
      file.doctor_id === user.userId;
    const isPrivileged = ['admin', 'management', 'accountant'].includes(user.role);
    if (!isParticipant && !isPrivileged) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if file has data
    if (!file.file_data || file.file_data.length === 0) {
      return NextResponse.json({ 
        error: 'File data not available',
        message: 'This file was uploaded before BLOB storage was enabled. Please re-upload the file to view it online.',
        file_name: file.file_name
      }, { status: 404 });
    }

    // Convert Buffer to Uint8Array for NextResponse
    const fileBuffer = Buffer.from(file.file_data);

    // Return file with proper headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': file.file_type || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${file.file_name}"`,
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return NextResponse.json(
      { error: 'Failed to serve file' },
      { status: 500 }
    );
  }
}
