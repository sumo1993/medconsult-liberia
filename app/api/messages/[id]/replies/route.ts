import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';

// GET - Fetch replies for a message
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
    const messageId = parseInt(id);

    // Verify user has access to this message
    const [messages] = await pool.execute<RowDataPacket[]>(
      `SELECT cm.*, u.email as sender_email 
       FROM contact_messages cm
       JOIN users u ON cm.user_id = u.id
       WHERE cm.id = ?`,
      [messageId]
    );

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    const message = messages[0];

    // Check if user has access
    // Doctors/admins can view any message
    // Clients can view their own messages or messages without user_id (legacy messages)
    const isDoctor = user.role === 'management' || user.role === 'admin';
    const isMessageOwner = message.user_id === user.userId;
    const isLegacyMessage = message.user_id === null;
    
    if (!isDoctor && !isMessageOwner && !isLegacyMessage) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get all replies for this message
    const [replies] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        mr.*,
        u.full_name as replier_name,
        u.email as replier_email,
        u.role as replier_role
       FROM message_replies mr
       JOIN users u ON mr.replied_by = u.id
       WHERE mr.message_id = ?
       ORDER BY mr.replied_at ASC`,
      [messageId]
    );

    return NextResponse.json({ replies });
  } catch (error) {
    console.error('Error fetching replies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch replies' },
      { status: 500 }
    );
  }
}

// POST - Send a reply to a message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const messageId = parseInt(id);
    const { reply_text } = await request.json();

    if (!reply_text || reply_text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Reply text is required' },
        { status: 400 }
      );
    }

    // Verify message exists and user has access
    const [messages] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM contact_messages WHERE id = ?',
      [messageId]
    );

    if (!messages || messages.length === 0) {
      return NextResponse.json({ 
        error: 'Message not found',
        details: `No message found with ID ${messageId}`
      }, { status: 404 });
    }

    const message = messages[0];

    // Check if user has access
    // Doctors/admins can reply to any message
    // Clients can reply to their own messages or messages without user_id (legacy messages)
    const isDoctor = user.role === 'management' || user.role === 'admin';
    const isMessageOwner = message.user_id === user.userId;
    const isLegacyMessage = message.user_id === null;
    
    if (!isDoctor && !isMessageOwner && !isLegacyMessage) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        details: 'You do not have permission to reply to this message'
      }, { status: 403 });
    }

    // Insert reply
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO message_replies (message_id, reply_text, replied_by) 
       VALUES (?, ?, ?)`,
      [messageId, reply_text.trim(), user.userId]
    );

    // Get the created reply with user info
    const [newReply] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        mr.*,
        u.full_name as replier_name,
        u.email as replier_email,
        u.role as replier_role
       FROM message_replies mr
       JOIN users u ON mr.replied_by = u.id
       WHERE mr.id = ?`,
      [result.insertId]
    );

    return NextResponse.json({
      success: true,
      message: 'Reply sent successfully',
      reply: newReply[0],
    });
  } catch (error: any) {
    console.error('Error sending reply:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send reply',
        details: error.message || 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
