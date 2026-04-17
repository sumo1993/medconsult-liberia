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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const messageId = normalizeId(id);
    if (!messageId) {
      return NextResponse.json({ error: 'Invalid message id' }, { status: 400 });
    }

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT sender_id, receiver_id, attachment_data, attachment_filename, attachment_type
       FROM direct_messages
       WHERE id = ?`,
      [messageId]
    );

    if (!rows.length) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    const message = rows[0];
    const isParticipant =
      Number(message.sender_id) === Number(user.userId) ||
      Number(message.receiver_id) === Number(user.userId) ||
      user.role === 'admin' ||
      user.role === 'management';

    if (!isParticipant) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!message.attachment_data) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
    }

    const filename = message.attachment_filename || 'attachment';
    const contentType = message.attachment_type || 'application/octet-stream';
    const buffer = message.attachment_data;

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error downloading attachment:', error);
    return NextResponse.json({ error: 'Failed to download attachment' }, { status: 500 });
  }
}
