import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    console.log('[Messages API] Fetching messages...');
    const user = await verifyAuth(request);
    if (!user) {
      console.log('[Messages API] Unauthorized - no user');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const requestId = params.id;
    console.log('[Messages API] Assignment ID:', requestId, 'User:', user.email, 'ID:', user.userId);

    // Verify user has access to this request
    const [requests] = await pool.execute<RowDataPacket[]>(
      'SELECT client_id, doctor_id FROM assignment_requests WHERE id = ?',
      [requestId]
    );

    if (requests.length === 0) {
      console.log('[Messages API] Assignment not found');
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const assignmentRequest = requests[0];
    console.log('[Messages API] Assignment client_id:', assignmentRequest.client_id, 'doctor_id:', assignmentRequest.doctor_id);
    
    const isAuthorized =
      assignmentRequest.client_id === user.userId ||
      assignmentRequest.doctor_id === user.userId ||
      user.role === 'admin';

    console.log('[Messages API] Is authorized:', isAuthorized);

    if (!isAuthorized) {
      console.log('[Messages API] User not authorized for this assignment');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Fetch messages
    const [messages] = await pool.execute<RowDataPacket[]>(
      `SELECT am.*, u.full_name as sender_name, u.role as sender_role
       FROM assignment_messages am
       JOIN users u ON am.sender_id = u.id
       WHERE am.assignment_request_id = ?
       ORDER BY am.created_at ASC`,
      [requestId]
    );

    console.log('[Messages API] Found', messages.length, 'message(s)');

    // Add has_attachment flag to messages
    const messagesWithAttachment = messages.map(msg => ({
      ...msg,
      has_attachment: !!msg.attachment_filename,
      attachment_data: null, // Don't send file data in list
    }));

    console.log('[Messages API] Returning', messagesWithAttachment.length, 'message(s)');
    return NextResponse.json(messagesWithAttachment);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const requestId = params.id;

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

    const data = await request.json();
    const { message, attachment } = data;

    if (!message && !attachment) {
      return NextResponse.json({ error: 'Message or attachment required' }, { status: 400 });
    }

    // Prepare attachment data if provided
    let attachmentData = null;
    let attachmentFilename = null;
    let attachmentSize = null;
    let attachmentType = null;

    if (attachment) {
      // attachment should be base64 string with format: data:type;base64,content
      const matches = attachment.match(/^data:(.+);base64,(.+)$/);
      if (matches) {
        attachmentType = matches[1];
        const base64Data = matches[2];
        attachmentData = Buffer.from(base64Data, 'base64');
        attachmentSize = attachmentData.length;
        attachmentFilename = data.filename || `attachment_${Date.now()}`;
      }
    }

    // Insert message
    await pool.execute(
      `INSERT INTO assignment_messages 
       (assignment_request_id, sender_id, message, message_type, 
        attachment_data, attachment_filename, attachment_size, attachment_type)
       VALUES (?, ?, ?, 'general', ?, ?, ?, ?)`,
      [
        requestId,
        user.userId,
        message || '',
        attachmentData,
        attachmentFilename,
        attachmentSize,
        attachmentType
      ]
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Message sent successfully' 
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
