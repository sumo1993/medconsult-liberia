import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';

const normalizeId = (value: unknown): number | null => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; replyId: string }> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, replyId } = await params;
    const messageId = normalizeId(id);
    const normalizedReplyId = normalizeId(replyId);
    if (!messageId || !normalizedReplyId) {
      return NextResponse.json({ error: 'Invalid ids' }, { status: 400 });
    }

    const [messages] = await pool.execute<RowDataPacket[]>(
      `SELECT id, user_id, email FROM contact_messages WHERE id = ?`,
      [messageId]
    );
    if (!messages.length) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    const message = messages[0];
    const isDoctor = user.role === 'management' || user.role === 'admin';
    const isOwner = Number(message.user_id || 0) === Number(user.userId);
    const isLegacyOwner =
      !message.user_id &&
      user.role === 'client' &&
      user.email &&
      String(message.email || '').toLowerCase() === user.email.toLowerCase();
    if (!isDoctor && !isOwner && !isLegacyOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [replies] = await pool.execute<RowDataPacket[]>(
      `SELECT attachment_name, attachment_type, attachment_data
       FROM message_replies
       WHERE id = ? AND message_id = ?`,
      [normalizedReplyId, messageId]
    );
    if (!replies.length) {
      return NextResponse.json({ error: 'Reply not found' }, { status: 404 });
    }

    const reply = replies[0];
    if (!reply.attachment_data) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
    }

    const fileBuffer = Buffer.from(reply.attachment_data);
    const filename = String(reply.attachment_name || `attachment-${normalizedReplyId}`);
    const contentType = String(reply.attachment_type || 'application/octet-stream');

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'private, max-age=60',
      },
    });
  } catch (error) {
    console.error('Reply attachment GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch attachment' }, { status: 500 });
  }
}
