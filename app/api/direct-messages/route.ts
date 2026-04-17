import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';

const dbClient = (process.env.DB_CLIENT || '').toLowerCase();
const usePostgres =
  dbClient === 'postgres' ||
  dbClient === 'postgresql' ||
  !!process.env.DATABASE_URL;
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
const BLOCKED_TEXT_PATTERNS = [/<script/i, /<\/script>/i, /javascript:/i, /onerror\s*=/i, /onload\s*=/i];
const ALLOWED_ATTACHMENT_MIME_PREFIXES = [
  'image/',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

function toIsoOrNull(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return value.toISOString();
  }

  let normalizedValue: string | number | Date = value as string | number | Date;
  if (typeof value === 'string') {
    const raw = value.trim();
    // PostgreSQL/MySQL often return "YYYY-MM-DD HH:mm:ss(.ffffff)" without TZ.
    // Treat timezone-less database timestamps as UTC to avoid server-local shifts.
    const hasTzInfo = /([zZ]|[+\-]\d{2}:\d{2}|[+\-]\d{4})$/.test(raw);
    if (!hasTzInfo) {
      const isoLike = raw.replace(' ', 'T');
      normalizedValue = `${isoLike}Z`;
    } else {
      normalizedValue = raw;
    }
  }

  const date = new Date(normalizedValue);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function hasBlockedContent(input: string): boolean {
  return BLOCKED_TEXT_PATTERNS.some((pattern) => pattern.test(input));
}

function isAllowedAttachmentType(contentType: string): boolean {
  return ALLOWED_ATTACHMENT_MIME_PREFIXES.some((prefix) =>
    contentType === prefix || contentType.startsWith(prefix)
  );
}

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

async function ensureDirectMessageColumns() {
  const ensure = async (column: string, sqlPg: string, sqlMy: string) => {
    const exists = await columnExists('direct_messages', column);
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
    'reply_to_id',
    `ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS reply_to_id INT NULL`,
    `ALTER TABLE direct_messages ADD COLUMN reply_to_id INT NULL`
  );
  await ensure(
    'reactions',
    `ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS reactions JSON NULL`,
    `ALTER TABLE direct_messages ADD COLUMN reactions JSON NULL`
  );
  await ensure(
    'edited_at',
    `ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP NULL`,
    `ALTER TABLE direct_messages ADD COLUMN edited_at DATETIME NULL`
  );
  await ensure(
    'deleted_at',
    `ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL`,
    `ALTER TABLE direct_messages ADD COLUMN deleted_at DATETIME NULL`
  );
  await ensure(
    'is_deleted',
    `ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE`,
    `ALTER TABLE direct_messages ADD COLUMN is_deleted TINYINT(1) NOT NULL DEFAULT 0`
  );
}

let ensuredColumnsPromise: Promise<void> | null = null;
async function ensureDirectMessageColumnsOnce() {
  if (!ensuredColumnsPromise) {
    ensuredColumnsPromise = ensureDirectMessageColumns().catch((error) => {
      ensuredColumnsPromise = null;
      throw error;
    });
  }
  return ensuredColumnsPromise;
}

// GET - Fetch conversations list or messages with a specific user
export async function GET(request: NextRequest) {
  try {
    await ensureDirectMessageColumnsOnce();
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const withUserId = searchParams.get('with');
    const createdAtExpr = usePostgres
      ? `TO_CHAR(COALESCE(dm.created_at, dm.updated_at), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as created_at`
      : `COALESCE(dm.created_at, dm.updated_at) as created_at`;
    const updatedAtExpr = usePostgres
      ? `TO_CHAR(dm.updated_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as updated_at`
      : `dm.updated_at`;
    const lastMessageAtExpr = usePostgres
      ? `TO_CHAR(dm3.created_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`
      : `dm3.created_at`;

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
          ${createdAtExpr},
          ${updatedAtExpr},
          ${usePostgres ? `TO_CHAR(dm.edited_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')` : 'dm.edited_at'} as edited_at,
          dm.reply_to_id,
          dm.reactions,
          dm.is_deleted,
          sender.full_name as sender_name,
          sender.role as sender_role,
          reply.message as reply_to_text
        FROM direct_messages dm
        JOIN users sender ON dm.sender_id = sender.id
        LEFT JOIN direct_messages reply ON dm.reply_to_id = reply.id
        WHERE (dm.sender_id = ? AND dm.receiver_id = ?)
           OR (dm.sender_id = ? AND dm.receiver_id = ?)
        ORDER BY COALESCE(dm.created_at, dm.updated_at) ASC, dm.id ASC`,
        [user.userId, withUserId, withUserId, user.userId]
      );

      // Mark messages as read
      await pool.execute(
        `UPDATE direct_messages 
         SET is_read = TRUE 
         WHERE receiver_id = ? AND sender_id = ? AND COALESCE(is_read, FALSE) = FALSE`,
        [user.userId, withUserId]
      );

      const normalizedMessages = messages.map((msg) => {
        const normalizedCreatedAt =
          toIsoOrNull(msg.created_at) ||
          toIsoOrNull(msg.updated_at) ||
          new Date().toISOString();
        return {
          ...msg,
          created_at: normalizedCreatedAt,
          is_read: Boolean(msg.is_read),
          reactions: typeof msg.reactions === 'string' ? JSON.parse(msg.reactions || '{}') : msg.reactions || {},
        };
      });

      return NextResponse.json({ messages: normalizedMessages });
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
          (SELECT ${lastMessageAtExpr} FROM direct_messages dm3 
           WHERE (dm3.sender_id = u.id AND dm3.receiver_id = ?) 
              OR (dm3.sender_id = ? AND dm3.receiver_id = u.id)
           ORDER BY dm3.created_at DESC LIMIT 1) as last_message_at,
          (SELECT COUNT(*) FROM direct_messages dm4 
           WHERE dm4.sender_id = u.id AND dm4.receiver_id = ? AND COALESCE(dm4.is_read, FALSE) = FALSE) as unread_count
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

      const normalizedConversations = conversations.map((conv) => ({
        ...conv,
        last_message_at: toIsoOrNull(conv.last_message_at),
      }));

      return NextResponse.json({ conversations: normalizedConversations });
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
    await ensureDirectMessageColumnsOnce();
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { receiverId, message, attachment, filename, replyToId } = await request.json();

    if (!receiverId) {
      return NextResponse.json({ error: 'Receiver is required' }, { status: 400 });
    }

    const messageText = typeof message === 'string' ? message.trim() : '';
    if (!messageText && !attachment) {
      return NextResponse.json({ error: 'Message or attachment is required' }, { status: 400 });
    }
    if (messageText && hasBlockedContent(messageText)) {
      return NextResponse.json({ error: 'Message contains blocked content' }, { status: 400 });
    }

    // Verify receiver exists
    const [receivers] = await pool.execute<RowDataPacket[]>(
      'SELECT id, full_name, role FROM users WHERE id = ?',
      [receiverId]
    );

    if (receivers.length === 0) {
      return NextResponse.json({ error: 'Receiver not found' }, { status: 404 });
    }

    // Check permissions by role
    const receiver = receivers[0];
    const allowedByRole: Record<string, string[]> = {
      admin: ['admin', 'management', 'consultant', 'researcher', 'accountant', 'client'],
      management: ['admin', 'management', 'consultant', 'researcher', 'accountant'],
      consultant: ['admin', 'management'],
      researcher: ['admin', 'accountant', 'researcher'],
      accountant: ['admin', 'researcher', 'accountant'],
      client: ['admin', 'management'],
    };

    const allowedRoles = allowedByRole[user.role] || ['admin', 'management'];
    if (!allowedRoles.includes(receiver.role)) {
      return NextResponse.json(
        { error: `${user.role} cannot message ${receiver.role}` },
        { status: 403 }
      );
    }

    let replyToValue: number | null = null;
    if (replyToId) {
      const replyToCandidate = Number(replyToId);
      if (Number.isFinite(replyToCandidate) && replyToCandidate > 0) {
        const [replyRows] = await pool.execute<RowDataPacket[]>(
          'SELECT sender_id, receiver_id FROM direct_messages WHERE id = ?',
          [replyToCandidate]
        );
        if (replyRows.length) {
          const reply = replyRows[0];
          const isParticipant =
            (Number(reply.sender_id) === Number(user.userId) && Number(reply.receiver_id) === Number(receiverId)) ||
            (Number(reply.receiver_id) === Number(user.userId) && Number(reply.sender_id) === Number(receiverId));
          if (isParticipant) {
            replyToValue = replyToCandidate;
          }
        }
      }
    }

    // Handle attachment
    let attachmentBuffer = null;
    let attachmentType = null;
    if (attachment && filename) {
      const base64Data = attachment.includes(',') ? attachment.split(',')[1] : attachment;
      if (!base64Data) {
        return NextResponse.json({ error: 'Invalid attachment' }, { status: 400 });
      }
      attachmentBuffer = Buffer.from(base64Data, 'base64');
      attachmentType = attachment.split(';')[0].split(':')[1] || 'application/octet-stream';
      if (attachmentBuffer.length > MAX_ATTACHMENT_BYTES) {
        return NextResponse.json({ error: 'Attachment too large (max 5MB)' }, { status: 400 });
      }
      if (!isAllowedAttachmentType(attachmentType)) {
        return NextResponse.json({ error: 'Attachment type not allowed' }, { status: 400 });
      }
      // Malware scan hook placeholder: integrate external scanner before persisting files.
    }

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO direct_messages 
       (sender_id, receiver_id, message, attachment_data, attachment_filename, attachment_type, reply_to_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [user.userId, receiverId, messageText, attachmentBuffer, filename || null, attachmentType, replyToValue]
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

// PATCH - react or recall messages
export async function PATCH(request: NextRequest) {
  try {
    await ensureDirectMessageColumnsOnce();
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const messageId = Number(data?.messageId);
    if (!Number.isFinite(messageId) || messageId <= 0) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
    }

    const [messages] = await pool.execute<RowDataPacket[]>(
      `SELECT id, sender_id, receiver_id, reactions, message, created_at, is_deleted
       FROM direct_messages
       WHERE id = ?`,
      [messageId]
    );

    if (!messages.length) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    const msg = messages[0];
    const isParticipant =
      Number(msg.sender_id) === Number(user.userId) ||
      Number(msg.receiver_id) === Number(user.userId) ||
      user.role === 'admin' ||
      user.role === 'management';

    if (!isParticipant) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const action = String(data?.action || '').toLowerCase();
    if (action === 'edit') {
      if (Number(msg.sender_id) !== Number(user.userId)) {
        return NextResponse.json({ error: 'Only sender can edit this message' }, { status: 403 });
      }
      if (msg.is_deleted) {
        return NextResponse.json({ error: 'Cannot edit recalled message' }, { status: 400 });
      }
      const nextText = String(data?.message || '').trim();
      if (!nextText) {
        return NextResponse.json({ error: 'Edited message cannot be empty' }, { status: 400 });
      }
      if (hasBlockedContent(nextText)) {
        return NextResponse.json({ error: 'Message contains blocked content' }, { status: 400 });
      }
      const createdAt = new Date(msg.created_at);
      const ageMs = Date.now() - createdAt.getTime();
      const editWindowMs = 5 * 60 * 1000;
      if (!Number.isFinite(ageMs) || ageMs > editWindowMs) {
        return NextResponse.json({ error: 'Edit window expired (5 minutes)' }, { status: 400 });
      }

      await pool.execute(
        `UPDATE direct_messages
         SET message = ?, edited_at = NOW()
         WHERE id = ?`,
        [nextText, messageId]
      );

      return NextResponse.json({ success: true, message: nextText });
    }

    if (action === 'recall') {
      if (Number(msg.sender_id) !== Number(user.userId) && user.role !== 'admin' && user.role !== 'management') {
        return NextResponse.json({ error: 'Only sender can recall this message' }, { status: 403 });
      }

      await pool.execute(
        `UPDATE direct_messages
         SET message = ?, is_deleted = ${usePostgres ? 'TRUE' : '1'}, deleted_at = NOW()
         WHERE id = ?`,
        ['This message was recalled', messageId]
      );

      return NextResponse.json({ success: true });
    }

    const emoji = String(data?.emoji || '');
    if (!emoji) {
      return NextResponse.json({ error: 'Emoji is required' }, { status: 400 });
    }

    let reactions: Record<string, number[]> = {};
    if (msg.reactions) {
      reactions = typeof msg.reactions === 'string' ? JSON.parse(msg.reactions) : msg.reactions;
    }

    if (!reactions[emoji]) {
      reactions[emoji] = [];
    }

    const userIdInReactions = reactions[emoji].indexOf(user.userId);
    if (userIdInReactions !== -1) {
      reactions[emoji] = reactions[emoji].filter((id) => id !== user.userId);
      if (!reactions[emoji].length) {
        delete reactions[emoji];
      }
    } else {
      reactions[emoji].push(user.userId);
    }

    await pool.execute(
      'UPDATE direct_messages SET reactions = ? WHERE id = ?',
      [JSON.stringify(reactions), messageId]
    );

    return NextResponse.json({ success: true, reactions });
  } catch (error) {
    console.error('Error updating direct message:', error);
    return NextResponse.json({ error: 'Failed to update message' }, { status: 500 });
  }
}
