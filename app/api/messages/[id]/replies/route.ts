import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
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

async function ensureMessageRepliesDefaultsForPostgres() {
  await pool.execute(`CREATE SEQUENCE IF NOT EXISTS message_replies_id_seq`);
  await pool.execute(`
    ALTER TABLE message_replies
    ALTER COLUMN id SET DEFAULT nextval('message_replies_id_seq')
  `);
  await pool.execute(`
    ALTER SEQUENCE message_replies_id_seq
    OWNED BY message_replies.id
  `);
  await pool.execute(`
    SELECT setval(
      'message_replies_id_seq',
      COALESCE((SELECT MAX(id) FROM message_replies), 0) + 1,
      false
    )
  `);
}

async function ensureMessageRepliesColumns() {
  try {
    const hasIsRead = await columnExists('message_replies', 'is_read');
    if (!hasIsRead) {
      if (usePostgres) {
        await pool.execute(
          `ALTER TABLE message_replies ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT FALSE`
        );
      } else {
        try {
          await pool.execute(
            `ALTER TABLE message_replies ADD COLUMN is_read TINYINT(1) NOT NULL DEFAULT 0`
          );
        } catch {
          // ignore if already exists/racing migration
        }
      }
    }

    const hasReplyToId = await columnExists('message_replies', 'reply_to_id');
    if (!hasReplyToId) {
      if (usePostgres) {
        await pool.execute(
          `ALTER TABLE message_replies ADD COLUMN IF NOT EXISTS reply_to_id INTEGER NULL`
        );
      } else {
        try {
          await pool.execute(
            `ALTER TABLE message_replies ADD COLUMN reply_to_id INT NULL`
          );
        } catch {}
      }
    }

    const hasEditedAt = await columnExists('message_replies', 'edited_at');
    if (!hasEditedAt) {
      if (usePostgres) {
        await pool.execute(
          `ALTER TABLE message_replies ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP NULL`
        );
      } else {
        try {
          await pool.execute(
            `ALTER TABLE message_replies ADD COLUMN edited_at DATETIME NULL`
          );
        } catch {}
      }
    }

    const hasDeletedAt = await columnExists('message_replies', 'deleted_at');
    if (!hasDeletedAt) {
      if (usePostgres) {
        await pool.execute(
          `ALTER TABLE message_replies ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL`
        );
      } else {
        try {
          await pool.execute(
            `ALTER TABLE message_replies ADD COLUMN deleted_at DATETIME NULL`
          );
        } catch {}
      }
    }

    const hasIsDeleted = await columnExists('message_replies', 'is_deleted');
    if (!hasIsDeleted) {
      if (usePostgres) {
        await pool.execute(
          `ALTER TABLE message_replies ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE`
        );
      } else {
        try {
          await pool.execute(
            `ALTER TABLE message_replies ADD COLUMN is_deleted TINYINT(1) NOT NULL DEFAULT 0`
          );
        } catch {}
      }
    }

    const hasAttachmentName = await columnExists('message_replies', 'attachment_name');
    if (!hasAttachmentName) {
      if (usePostgres) {
        await pool.execute(
          `ALTER TABLE message_replies ADD COLUMN IF NOT EXISTS attachment_name VARCHAR(255) NULL`
        );
      } else {
        try {
          await pool.execute(
            `ALTER TABLE message_replies ADD COLUMN attachment_name VARCHAR(255) NULL`
          );
        } catch {}
      }
    }

    const hasAttachmentType = await columnExists('message_replies', 'attachment_type');
    if (!hasAttachmentType) {
      if (usePostgres) {
        await pool.execute(
          `ALTER TABLE message_replies ADD COLUMN IF NOT EXISTS attachment_type VARCHAR(120) NULL`
        );
      } else {
        try {
          await pool.execute(
            `ALTER TABLE message_replies ADD COLUMN attachment_type VARCHAR(120) NULL`
          );
        } catch {}
      }
    }

    const hasAttachmentSize = await columnExists('message_replies', 'attachment_size');
    if (!hasAttachmentSize) {
      if (usePostgres) {
        await pool.execute(
          `ALTER TABLE message_replies ADD COLUMN IF NOT EXISTS attachment_size BIGINT NULL`
        );
      } else {
        try {
          await pool.execute(
            `ALTER TABLE message_replies ADD COLUMN attachment_size BIGINT NULL`
          );
        } catch {}
      }
    }

    const hasAttachmentData = await columnExists('message_replies', 'attachment_data');
    if (!hasAttachmentData) {
      if (usePostgres) {
        await pool.execute(
          `ALTER TABLE message_replies ADD COLUMN IF NOT EXISTS attachment_data BYTEA NULL`
        );
      } else {
        try {
          await pool.execute(
            `ALTER TABLE message_replies ADD COLUMN attachment_data LONGBLOB NULL`
          );
        } catch {}
      }
    }
  } catch (error) {
    console.log('[message_replies] ensure columns warning:', error);
  }
}

async function markIncomingRepliesAsRead(messageId: number, viewerUserId: number) {
  try {
    const hasIsRead = await columnExists('message_replies', 'is_read');
    if (!hasIsRead) return;

    if (usePostgres) {
      await pool.execute(
        `UPDATE message_replies
         SET is_read = TRUE
         WHERE message_id = ? AND replied_by <> ? AND COALESCE(is_read, FALSE) = FALSE`,
        [messageId, viewerUserId]
      );
    } else {
      await pool.execute(
        `UPDATE message_replies
         SET is_read = 1
         WHERE message_id = ? AND replied_by <> ? AND COALESCE(is_read, 0) = 0`,
        [messageId, viewerUserId]
      );
    }
  } catch (error) {
    console.log('[message_replies] mark read warning:', error);
  }
}

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
    if (!Number.isFinite(messageId)) {
      return NextResponse.json({ error: 'Invalid message id' }, { status: 400 });
    }

    // Verify user has access to this message
    const [messages] = await pool.execute<RowDataPacket[]>(
      `SELECT cm.*, u.email as sender_email 
       FROM contact_messages cm
       LEFT JOIN users u ON cm.user_id = u.id
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
    const messageUserId = normalizeId(message.user_id);
    const isMessageOwner = messageUserId !== null && messageUserId === normalizeId(user.userId);
    const isLegacyMessage = messageUserId === null;
    
    if (!isDoctor && !isMessageOwner && !isLegacyMessage) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await ensureMessageRepliesColumns();
    await markIncomingRepliesAsRead(messageId, user.userId);

    // Get all replies for this message
    const [replies] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        mr.id,
        mr.message_id,
        mr.reply_text,
        mr.replied_by,
        mr.replied_at,
        mr.is_read,
        mr.is_deleted,
        mr.deleted_at,
        mr.edited_at,
        mr.reply_to_id,
        mr.attachment_name,
        mr.attachment_type,
        mr.attachment_size,
        u.full_name as replier_name,
        u.email as replier_email,
        u.role as replier_role,
        quoted.reply_text AS reply_to_text
       FROM message_replies mr
       JOIN users u ON mr.replied_by = u.id
       LEFT JOIN message_replies quoted ON mr.reply_to_id = quoted.id
       WHERE mr.message_id = ?
       ORDER BY mr.replied_at ASC, mr.id ASC`,
      [messageId]
    );

    const mappedReplies = (Array.isArray(replies) ? replies : []).map((reply) => ({
      ...reply,
      has_attachment: !!reply.attachment_name,
    }));

    return NextResponse.json(
      { replies: mappedReplies },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
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
    if (!Number.isFinite(messageId)) {
      return NextResponse.json({ error: 'Invalid message id' }, { status: 400 });
    }
    const body = await request.json();
    const reply_text = typeof body.reply_text === 'string' ? body.reply_text : '';
    const attachment = body.attachment as {
      name?: string;
      type?: string;
      size?: number;
      data?: string;
    } | undefined;
    const reply_to_id = normalizeId(body.reply_to_id);

    const trimmedReply = reply_text.trim();
    const hasAttachment = !!attachment?.name && !!attachment?.data;
    if (!trimmedReply && !hasAttachment) {
      return NextResponse.json(
        { error: 'Reply text or attachment is required' },
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
    const messageUserId = normalizeId(message.user_id);
    const isMessageOwner = messageUserId !== null && messageUserId === normalizeId(user.userId);
    const isLegacyMessage = messageUserId === null;
    
    if (!isDoctor && !isMessageOwner && !isLegacyMessage) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        details: 'You do not have permission to reply to this message'
      }, { status: 403 });
    }

    const dbClient = (process.env.DB_CLIENT || '').toLowerCase();
    const usePostgres =
      dbClient === 'postgres' ||
      dbClient === 'postgresql' ||
      !!process.env.DATABASE_URL;
    await ensureMessageRepliesColumns();
    if (usePostgres) {
      await ensureMessageRepliesDefaultsForPostgres();
    }

    let attachmentBuffer: Buffer | null = null;
    let attachmentName: string | null = null;
    let attachmentType: string | null = null;
    let attachmentSize: number | null = null;

    if (hasAttachment && attachment) {
      const cleanName = String(attachment.name || '')
        .trim()
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .slice(0, 180);
      const rawSize = Number(attachment.size || 0);
      if (!cleanName) {
        return NextResponse.json({ error: 'Invalid attachment name' }, { status: 400 });
      }

      const base64Data = String(attachment.data || '').includes(',')
        ? String(attachment.data).split(',')[1]
        : String(attachment.data || '');
      attachmentBuffer = Buffer.from(base64Data, 'base64');
      if (!attachmentBuffer || attachmentBuffer.length === 0) {
        return NextResponse.json({ error: 'Invalid attachment data' }, { status: 400 });
      }
      if (attachmentBuffer.length > 8 * 1024 * 1024) {
        return NextResponse.json({ error: 'Attachment too large. Max 8MB' }, { status: 400 });
      }

      attachmentName = cleanName;
      attachmentType = String(attachment.type || 'application/octet-stream').slice(0, 120);
      attachmentSize = rawSize > 0 ? rawSize : attachmentBuffer.length;
    }

    // Insert reply
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO message_replies (
         message_id, reply_text, replied_by, replied_at, reply_to_id,
         attachment_name, attachment_type, attachment_size, attachment_data
       ) 
       VALUES (?, ?, ?, NOW(), ?, ?, ?, ?, ?)`,
      [messageId, trimmedReply || '', user.userId, reply_to_id, attachmentName, attachmentType, attachmentSize, attachmentBuffer]
    );

    // Get the created reply with user info
    const [newReply] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        mr.id,
        mr.message_id,
        mr.reply_text,
        mr.replied_by,
        mr.replied_at,
        mr.is_read,
        mr.is_deleted,
        mr.deleted_at,
        mr.edited_at,
        mr.reply_to_id,
        mr.attachment_name,
        mr.attachment_type,
        mr.attachment_size,
        u.full_name as replier_name,
        u.email as replier_email,
        u.role as replier_role,
        quoted.reply_text AS reply_to_text
       FROM message_replies mr
       JOIN users u ON mr.replied_by = u.id
       LEFT JOIN message_replies quoted ON mr.reply_to_id = quoted.id
       WHERE mr.id = ?`,
      [result.insertId]
    );

    const safeReply = newReply[0]
      ? {
          ...newReply[0],
          has_attachment: !!newReply[0].attachment_name,
          attachment_data: undefined,
        }
      : null;

    return NextResponse.json({
      success: true,
      message: 'Reply sent successfully',
      reply: safeReply,
    });
  } catch (error: unknown) {
    console.error('Error sending reply:', error);
    const details = error instanceof Error ? error.message : 'Unknown error';
    const stack = error instanceof Error ? error.stack : undefined;
    return NextResponse.json(
      { 
        error: 'Failed to send reply',
        details,
        stack: process.env.NODE_ENV === 'development' ? stack : undefined
      },
      { status: 500 }
    );
  }
}
