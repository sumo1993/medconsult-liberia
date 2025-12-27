import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';

// GET - Fetch conversations list or messages with a specific user
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const withUserId = searchParams.get('with');

    if (withUserId) {
      // Fetch messages with a specific user
      const [messages] = await pool.execute<RowDataPacket[]>(
        `SELECT 
          dm.id,
          dm.sender_id,
          dm.receiver_id,
          dm.message,
          dm.attachment_filename,
          dm.attachment_type,
          dm.is_read,
          dm.created_at,
          sender.full_name as sender_name,
          sender.role as sender_role
        FROM direct_messages dm
        JOIN users sender ON dm.sender_id = sender.id
        WHERE (dm.sender_id = ? AND dm.receiver_id = ?)
           OR (dm.sender_id = ? AND dm.receiver_id = ?)
        ORDER BY dm.created_at ASC`,
        [user.userId, withUserId, withUserId, user.userId]
      );

      // Mark messages as read
      await pool.execute(
        `UPDATE direct_messages 
         SET is_read = TRUE 
         WHERE receiver_id = ? AND sender_id = ? AND is_read = FALSE`,
        [user.userId, withUserId]
      );

      return NextResponse.json({ messages });
    } else {
      // Fetch conversation list (unique users messaged with)
      const [conversations] = await pool.execute<RowDataPacket[]>(
        `SELECT 
          u.id as user_id,
          u.full_name,
          u.role,
          (SELECT message FROM direct_messages dm2 
           WHERE (dm2.sender_id = u.id AND dm2.receiver_id = ?) 
              OR (dm2.sender_id = ? AND dm2.receiver_id = u.id)
           ORDER BY dm2.created_at DESC LIMIT 1) as last_message,
          (SELECT created_at FROM direct_messages dm3 
           WHERE (dm3.sender_id = u.id AND dm3.receiver_id = ?) 
              OR (dm3.sender_id = ? AND dm3.receiver_id = u.id)
           ORDER BY dm3.created_at DESC LIMIT 1) as last_message_at,
          (SELECT COUNT(*) FROM direct_messages dm4 
           WHERE dm4.sender_id = u.id AND dm4.receiver_id = ? AND dm4.is_read = FALSE) as unread_count
        FROM users u
        WHERE u.id IN (
          SELECT DISTINCT 
            CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END as other_user
          FROM direct_messages
          WHERE sender_id = ? OR receiver_id = ?
        )
        ORDER BY last_message_at DESC`,
        [user.userId, user.userId, user.userId, user.userId, user.userId, user.userId, user.userId, user.userId]
      );

      return NextResponse.json({ conversations });
    }
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST - Send a new message
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { receiverId, message, attachment, filename } = await request.json();

    if (!receiverId || !message?.trim()) {
      return NextResponse.json({ error: 'Receiver and message are required' }, { status: 400 });
    }

    // Verify receiver exists
    const [receivers] = await pool.execute<RowDataPacket[]>(
      'SELECT id, full_name, role FROM users WHERE id = ?',
      [receiverId]
    );

    if (receivers.length === 0) {
      return NextResponse.json({ error: 'Receiver not found' }, { status: 404 });
    }

    // Check permissions - consultants can only message management/admin
    // Admin can message anyone
    const receiver = receivers[0];
    if (user.role === 'consultant') {
      if (!['admin', 'management'].includes(receiver.role)) {
        return NextResponse.json({ 
          error: 'Consultants can only message management or admin' 
        }, { status: 403 });
      }
    }

    // Handle attachment
    let attachmentBuffer = null;
    let attachmentType = null;
    if (attachment && filename) {
      const base64Data = attachment.includes(',') ? attachment.split(',')[1] : attachment;
      attachmentBuffer = Buffer.from(base64Data, 'base64');
      attachmentType = attachment.split(';')[0].split(':')[1] || 'application/octet-stream';
    }

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO direct_messages 
       (sender_id, receiver_id, message, attachment_data, attachment_filename, attachment_type)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [user.userId, receiverId, message.trim(), attachmentBuffer, filename || null, attachmentType]
    );

    return NextResponse.json({ 
      success: true, 
      messageId: result.insertId,
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

