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

async function columnExists(table: string, column: string): Promise<boolean> {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      usePostgres
        ? `SELECT column_name
           FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = ? AND column_name = ?`
        : `SELECT COLUMN_NAME
           FROM INFORMATION_SCHEMA.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
      [table, column]
    );
    return rows.length > 0;
  } catch {
    return false;
  }
}

async function ensureContactMessagesColumns() {
  const ensure = async (column: string, sqlPg: string, sqlMy: string) => {
    const exists = await columnExists('contact_messages', column);
    if (exists) return;
    if (usePostgres) {
      await pool.execute(sqlPg);
    } else {
      try {
        await pool.execute(sqlMy);
      } catch {}
    }
  };

  await ensure(
    'edited_at',
    `ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP NULL`,
    `ALTER TABLE contact_messages ADD COLUMN edited_at DATETIME NULL`
  );
  await ensure(
    'deleted_at',
    `ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL`,
    `ALTER TABLE contact_messages ADD COLUMN deleted_at DATETIME NULL`
  );
  await ensure(
    'is_deleted',
    `ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE`,
    `ALTER TABLE contact_messages ADD COLUMN is_deleted TINYINT(1) NOT NULL DEFAULT 0`
  );
}

async function loadAuthorizedMessage(messageId: number, request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  await ensureContactMessagesColumns();
  const [messages] = await pool.execute<RowDataPacket[]>(
    `SELECT id, user_id, email, message, is_deleted
     FROM contact_messages
     WHERE id = ?`,
    [messageId]
  );

  if (!messages.length) {
    return { error: NextResponse.json({ error: 'Message not found' }, { status: 404 }) };
  }

  const message = messages[0];
  const isDoctor = user.role === 'management' || user.role === 'admin';
  const messageUserId = normalizeId(message.user_id);
  const isOwner = messageUserId !== null && messageUserId === normalizeId(user.userId);
  const isLegacyOwner = messageUserId === null && user.role === 'client' && user.email && String(message.email || '').toLowerCase() === user.email.toLowerCase();

  if (!isDoctor && !isOwner && !isLegacyOwner) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { user, message, isDoctor, isOwner: isOwner || isLegacyOwner };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const messageId = normalizeId(id);
    if (!messageId) {
      return NextResponse.json({ error: 'Invalid message id' }, { status: 400 });
    }

    const auth = await loadAuthorizedMessage(messageId, request);
    if (auth.error) return auth.error;
    if (!auth.isOwner) {
      return NextResponse.json({ error: 'Only sender can modify this message' }, { status: 403 });
    }

    const body = await request.json();
    const action = String(body.action || '').toLowerCase();

    if (action === 'edit') {
      const nextText = String(body.message || '').trim();
      if (!nextText) {
        return NextResponse.json({ error: 'Edited text cannot be empty' }, { status: 400 });
      }

      await pool.execute(
        `UPDATE contact_messages
         SET message = ?, edited_at = NOW(), is_deleted = ${usePostgres ? 'FALSE' : '0'}
         WHERE id = ?`,
        [nextText, messageId]
      );
      return NextResponse.json({ success: true, message: 'Message edited successfully' });
    }

    if (action === 'recall') {
      await pool.execute(
        `UPDATE contact_messages
         SET message = ?, is_deleted = ${usePostgres ? 'TRUE' : '1'}, deleted_at = NOW()
         WHERE id = ?`,
        ['This message was recalled', messageId]
      );
      return NextResponse.json({ success: true, message: 'Message recalled' });
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (error) {
    console.error('Message PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update message' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const messageId = normalizeId(id);
    if (!messageId) {
      return NextResponse.json({ error: 'Invalid message id' }, { status: 400 });
    }

    const auth = await loadAuthorizedMessage(messageId, request);
    if (auth.error) return auth.error;
    if (!auth.isOwner) {
      return NextResponse.json({ error: 'Only sender can delete this message' }, { status: 403 });
    }

    await pool.execute(
      `UPDATE contact_messages
       SET message = ?, is_deleted = ${usePostgres ? 'TRUE' : '1'}, deleted_at = NOW()
       WHERE id = ?`,
      ['This message was deleted', messageId]
    );

    return NextResponse.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    console.error('Message DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
  }
}
