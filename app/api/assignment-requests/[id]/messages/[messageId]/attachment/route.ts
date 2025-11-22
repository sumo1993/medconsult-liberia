import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const { id: requestId, messageId } = params;

    // Verify user has access to this request
    const [requests] = await pool.execute<RowDataPacket[]>(
      'SELECT client_id, doctor_id FROM assignment_requests WHERE id = ?',
      [requestId]
    );

    if (requests.length === 0) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const assignmentRequest = requests[0];
    const isAuthorized =
      assignmentRequest.client_id === user.userId ||
      assignmentRequest.doctor_id === user.userId ||
      user.role === 'admin';

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Fetch message attachment
    const [messages] = await pool.execute<RowDataPacket[]>(
      `SELECT attachment_data, attachment_filename, attachment_type
       FROM assignment_messages
       WHERE id = ? AND assignment_request_id = ?`,
      [messageId, requestId]
    );

    if (messages.length === 0 || !messages[0].attachment_data) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
    }

    const message = messages[0];
    const buffer = Buffer.from(message.attachment_data);
    const filename = message.attachment_filename || 'attachment';
    const contentType = message.attachment_type || 'application/octet-stream';

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error downloading attachment:', error);
    return NextResponse.json(
      { error: 'Failed to download attachment' },
      { status: 500 }
    );
  }
}
