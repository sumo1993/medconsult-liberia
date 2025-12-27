import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';

// Helper to check if column exists
async function columnExists(table: string, column: string): Promise<boolean> {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = ? AND COLUMN_NAME = ?`,
      [table, column]
    );
    return rows.length > 0;
  } catch {
    return false;
  }
}

// Ensure reply_to_id and reactions columns exist
async function ensureMessageColumns() {
  try {
    const hasReplyTo = await columnExists('assignment_messages', 'reply_to_id');
    const hasReactions = await columnExists('assignment_messages', 'reactions');
    
    if (!hasReplyTo) {
      await pool.execute(`ALTER TABLE assignment_messages ADD COLUMN reply_to_id INT NULL`);
    }
    if (!hasReactions) {
      await pool.execute(`ALTER TABLE assignment_messages ADD COLUMN reactions JSON NULL`);
    }
  } catch (error) {
    console.log('Columns may already exist:', error);
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await ensureMessageColumns();
    
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
    
    // Allow access for: client, assigned doctor, admin, or management
    const isAuthorized =
      assignmentRequest.client_id === user.userId ||
      assignmentRequest.doctor_id === user.userId ||
      user.role === 'admin' ||
      user.role === 'management';

    console.log('[Messages API] Is authorized:', isAuthorized, 'User role:', user.role);

    if (!isAuthorized) {
      console.log('[Messages API] User not authorized for this assignment');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Fetch messages with reply info
    const [messages] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        am.*, 
        u.full_name as sender_name, 
        u.role as sender_role,
        reply.message as reply_to_message,
        reply.sender_id as reply_to_sender_id,
        reply_user.full_name as reply_to_sender_name,
        reply.attachment_filename as reply_to_attachment
       FROM assignment_messages am
       JOIN users u ON am.sender_id = u.id
       LEFT JOIN assignment_messages reply ON am.reply_to_id = reply.id
       LEFT JOIN users reply_user ON reply.sender_id = reply_user.id
       WHERE am.assignment_request_id = ?
       ORDER BY am.created_at ASC`,
      [requestId]
    );

    console.log('[Messages API] Found', messages.length, 'message(s)');

    // Process messages
    const messagesWithData = messages.map(msg => ({
      ...msg,
      has_attachment: !!msg.attachment_filename,
      attachment_data: null, // Don't send file data in list
      reactions: msg.reactions ? (typeof msg.reactions === 'string' ? JSON.parse(msg.reactions) : msg.reactions) : {},
      reply_to: msg.reply_to_id ? {
        id: msg.reply_to_id,
        message: msg.reply_to_message,
        sender_name: msg.reply_to_sender_name,
        attachment_filename: msg.reply_to_attachment
      } : null
    }));

    console.log('[Messages API] Returning', messagesWithData.length, 'message(s)');
    return NextResponse.json(messagesWithData);
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
    await ensureMessageColumns();
    
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
    // Allow access for: client, assigned doctor, admin, or management
    const isAuthorized =
      assignmentRequest.client_id === user.userId ||
      assignmentRequest.doctor_id === user.userId ||
      user.role === 'admin' ||
      user.role === 'management';

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const data = await request.json();
    const { message, attachment, replyToId } = data;

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

    // Insert message with reply_to_id support
    await pool.execute(
      `INSERT INTO assignment_messages 
       (assignment_request_id, sender_id, message, message_type, 
        attachment_data, attachment_filename, attachment_size, attachment_type, reply_to_id)
       VALUES (?, ?, ?, 'general', ?, ?, ?, ?, ?)`,
      [
        requestId,
        user.userId,
        message || '',
        attachmentData,
        attachmentFilename,
        attachmentSize,
        attachmentType,
        replyToId || null
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

// PATCH - Add/remove reaction to a message
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await ensureMessageColumns();
    
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
      user.role === 'admin' ||
      user.role === 'management';

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const data = await request.json();
    const { messageId, emoji, action } = data;

    if (!messageId || !emoji) {
      return NextResponse.json({ error: 'Message ID and emoji required' }, { status: 400 });
    }

    // Get current reactions
    const [messages] = await pool.execute<RowDataPacket[]>(
      'SELECT reactions FROM assignment_messages WHERE id = ? AND assignment_request_id = ?',
      [messageId, requestId]
    );

    if (messages.length === 0) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    let reactions: Record<string, number[]> = {};
    if (messages[0].reactions) {
      reactions = typeof messages[0].reactions === 'string' 
        ? JSON.parse(messages[0].reactions) 
        : messages[0].reactions;
    }

    // Initialize emoji array if not exists
    if (!reactions[emoji]) {
      reactions[emoji] = [];
    }

    const userIdInReactions = reactions[emoji].indexOf(user.userId);

    if (action === 'remove' || userIdInReactions !== -1) {
      // Remove user's reaction
      reactions[emoji] = reactions[emoji].filter(id => id !== user.userId);
      // Clean up empty emoji arrays
      if (reactions[emoji].length === 0) {
        delete reactions[emoji];
      }
    } else {
      // Add user's reaction
      reactions[emoji].push(user.userId);
    }

    // Update database
    await pool.execute(
      'UPDATE assignment_messages SET reactions = ? WHERE id = ?',
      [JSON.stringify(reactions), messageId]
    );

    return NextResponse.json({ 
      success: true, 
      reactions 
    });
  } catch (error) {
    console.error('Error updating reaction:', error);
    return NextResponse.json(
      { error: 'Failed to update reaction' },
      { status: 500 }
    );
  }
}
