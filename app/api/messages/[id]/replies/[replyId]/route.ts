import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';

const dbClient = (process.env.DB_CLIENT || '').toLowerCase();
const usePostgres =
  dbClient === 'postgres' ||
  dbClient === 'postgresql' ||
  !!process.env.DATABASE_URL;

const normalizeId = (value: unknown): number | null => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
};

async function loadAuthorizedReply(
  request: NextRequest,
  messageId: number,
  replyId: number
) {
  const user = await verifyAuth(request);
  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const [messages] = await pool.execute<RowDataPacket[]>(
    `SELECT id, user_id, email FROM contact_messages WHERE id = ?`,
    [messageId]
  );
  if (!messages.length) {
    return { error: NextResponse.json({ error: 'Message not found' }, { status: 404 }) };
  }
  const message = messages[0];

  const isDoctor = user.role === 'management' || user.role === 'admin';
  const messageOwnerId = normalizeId(message.user_id);
  const isMessageOwner = messageOwnerId !== null && messageOwnerId === normalizeId(user.userId);
  const isLegacyOwner =
    messageOwnerId === null &&
    user.role === 'client' &&
    user.email &&
    String(message.email || '').toLowerCase() === user.email.toLowerCase();

  if (!isDoctor && !isMessageOwner && !isLegacyOwner) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  const [replies] = await pool.execute<RowDataPacket[]>(
    `SELECT id, message_id, replied_by, reply_text, is_deleted
     FROM message_replies
     WHERE id = ? AND message_id = ?`,
    [replyId, messageId]
  );
  if (!replies.length) {
    return { error: NextResponse.json({ error: 'Reply not found' }, { status: 404 }) };
  }
  const reply = replies[0];

  const isReplyOwner = normalizeId(reply.replied_by) === normalizeId(user.userId);
  return { user, reply, isReplyOwner };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; replyId: string }> }
) {
  try {
    const { id, replyId } = await params;
    const messageId = normalizeId(id);
    const normalizedReplyId = normalizeId(replyId);
    if (!messageId || !normalizedReplyId) {
      return NextResponse.json({ error: 'Invalid ids' }, { status: 400 });
    }

    const auth = await loadAuthorizedReply(request, messageId, normalizedReplyId);
    if (auth.error) return auth.error;
    if (!auth.isReplyOwner) {
      return NextResponse.json({ error: 'Only sender can modify this reply' }, { status: 403 });
    }

    const body = await request.json();
    const action = String(body.action || '').toLowerCase();

    if (action === 'edit') {
      const nextText = String(body.reply_text || '').trim();
      if (!nextText) {
        return NextResponse.json({ error: 'Edited reply cannot be empty' }, { status: 400 });
      }

      await pool.execute(
        `UPDATE message_replies
         SET reply_text = ?, edited_at = NOW(), is_deleted = ${usePostgres ? 'FALSE' : '0'}
         WHERE id = ? AND message_id = ?`,
        [nextText, normalizedReplyId, messageId]
      );
      return NextResponse.json({ success: true, message: 'Reply edited successfully' });
    }

    if (action === 'recall') {
      await pool.execute(
        `UPDATE message_replies
         SET reply_text = ?, is_deleted = ${usePostgres ? 'TRUE' : '1'}, deleted_at = NOW()
         WHERE id = ? AND message_id = ?`,
        ['This message was recalled', normalizedReplyId, messageId]
      );
      return NextResponse.json({ success: true, message: 'Reply recalled' });
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (error) {
    console.error('Reply PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update reply' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; replyId: string }> }
) {
  try {
    const { id, replyId } = await params;
    const messageId = normalizeId(id);
    const normalizedReplyId = normalizeId(replyId);
    if (!messageId || !normalizedReplyId) {
      return NextResponse.json({ error: 'Invalid ids' }, { status: 400 });
    }

    const auth = await loadAuthorizedReply(request, messageId, normalizedReplyId);
    if (auth.error) return auth.error;
    if (!auth.isReplyOwner) {
      return NextResponse.json({ error: 'Only sender can delete this reply' }, { status: 403 });
    }

    await pool.execute(
      `UPDATE message_replies
       SET reply_text = ?, is_deleted = ${usePostgres ? 'TRUE' : '1'}, deleted_at = NOW()
       WHERE id = ? AND message_id = ?`,
      ['This message was deleted', normalizedReplyId, messageId]
    );

    return NextResponse.json({ success: true, message: 'Reply deleted' });
  } catch (error) {
    console.error('Reply DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete reply' }, { status: 500 });
  }
}
