import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';

async function ensureContactMessagesDefaultsForPostgres() {
  await pool.execute(`
    CREATE SEQUENCE IF NOT EXISTS contact_messages_id_seq
  `);

  await pool.execute(`
    ALTER TABLE contact_messages
    ALTER COLUMN id SET DEFAULT nextval('contact_messages_id_seq')
  `);

  await pool.execute(`
    ALTER SEQUENCE contact_messages_id_seq
    OWNED BY contact_messages.id
  `);

  await pool.execute(`
    SELECT setval(
      'contact_messages_id_seq',
      COALESCE((SELECT MAX(id) FROM contact_messages), 0) + 1,
      false
    )
  `);
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await verifyAuth(request);
    const body = await request.json();
    const { name, email, subject, message } = body;

    // Validate input
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Prefer authenticated client identity to guarantee message ownership visibility.
    let userId: number | null = null;
    if (authUser?.role === 'client' && Number.isFinite(Number(authUser.userId))) {
      userId = Number(authUser.userId);
    } else {
      const [users] = await pool.execute<RowDataPacket[]>(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );
      userId = users.length > 0 ? Number(users[0].id) : null;
    }

    const dbClient = (process.env.DB_CLIENT || '').toLowerCase();
    const usePostgres =
      dbClient === 'postgres' ||
      dbClient === 'postgresql' ||
      !!process.env.DATABASE_URL;
    if (usePostgres) {
      await ensureContactMessagesDefaultsForPostgres();
    }

    // Insert into database with user_id
    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO contact_messages (name, email, subject, message, user_id, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [name, email, subject, message, userId]
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Thank you for your message! We will get back to you soon.',
        id: result.insertId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Failed to submit message. Please try again later.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let rows: RowDataPacket[] = [];

    if (user.role === 'admin' || user.role === 'management') {
      const [adminRows] = await pool.execute<RowDataPacket[]>(
        `SELECT
           cm.id,
           cm.name,
           cm.email,
           cm.subject,
           cm.message,
           cm.user_id,
           cm.created_at,
           COALESCE(MAX(mr.replied_at), cm.created_at) AS latest_activity_at
         FROM contact_messages cm
         LEFT JOIN message_replies mr ON mr.message_id = cm.id
         GROUP BY cm.id, cm.name, cm.email, cm.subject, cm.message, cm.user_id, cm.created_at
         ORDER BY latest_activity_at DESC
         LIMIT 200`
      );
      rows = adminRows;
    } else if (user.role === 'client') {
      const [clientRows] = await pool.execute<RowDataPacket[]>(
        `SELECT
           cm.id,
           cm.name,
           cm.email,
           cm.subject,
           cm.message,
           cm.user_id,
           cm.created_at,
           COALESCE(MAX(mr.replied_at), cm.created_at) AS latest_activity_at
         FROM contact_messages cm
         LEFT JOIN message_replies mr ON mr.message_id = cm.id
         WHERE cm.user_id = ?
            OR (cm.user_id IS NULL AND LOWER(cm.email) = LOWER(?))
         GROUP BY cm.id, cm.name, cm.email, cm.subject, cm.message, cm.user_id, cm.created_at
         ORDER BY latest_activity_at DESC
         LIMIT 200`,
        [user.userId, user.email]
      );
      rows = clientRows;
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(
      { messages: rows },
      {
        status: 200,
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
      }
    );
  } catch (error) {
    console.error('Fetch messages error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
