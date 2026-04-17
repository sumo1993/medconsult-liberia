import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';

async function ensureAssignmentRequestIdDefaultForPostgres() {
  await pool.execute(`
    CREATE SEQUENCE IF NOT EXISTS assignment_requests_id_seq
  `);

  await pool.execute(`
    ALTER TABLE assignment_requests
    ALTER COLUMN id SET DEFAULT nextval('assignment_requests_id_seq')
  `);

  await pool.execute(`
    ALTER SEQUENCE assignment_requests_id_seq
    OWNED BY assignment_requests.id
  `);

  await pool.execute(`
    SELECT setval(
      'assignment_requests_id_seq',
      COALESCE((SELECT MAX(id) FROM assignment_requests), 0) + 1,
      false
    )
  `);
}

// GET - Fetch assignment requests (filtered by role)
export async function GET(request: NextRequest) {
  try {
    console.log('[API] Fetching assignment requests...');
    const user = await verifyAuth(request);
    if (!user) {
      console.log('[API] Unauthorized - no user');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[API] User:', user.email, 'Role:', user.role, 'ID:', user.userId);

    // Self-heal legacy rows imported without timestamps so sorting remains stable.
    await pool.execute(`
      UPDATE assignment_requests
      SET created_at = NOW(),
          updated_at = NOW()
      WHERE created_at IS NULL
    `);

    let query = '';
    let params: unknown[] = [];

    if (user.role === 'client') {
      // Clients see only their requests
      query = `
        SELECT ar.*, 
               u.full_name as doctor_name,
               u.email as doctor_email
        FROM assignment_requests ar
        LEFT JOIN users u ON ar.doctor_id = u.id
        WHERE ar.client_id = ?
        ORDER BY ar.id DESC
      `;
      params = [user.userId];
      console.log('[API] Fetching assignments for client ID:', user.userId);
    } else if (user.role === 'management' || user.role === 'admin' || user.role === 'consultant' || user.role === 'researcher') {
      // Management, Admin, Consultants, and Researchers see all assignments
      query = `
        SELECT ar.*, 
               c.full_name as client_name,
               c.email as client_email,
               d.full_name as doctor_name,
               consultant.full_name as consultant_name,
               (SELECT COUNT(*) FROM assignment_applications aa WHERE aa.assignment_id = ar.id AND aa.status = 'pending') as pending_applications
        FROM assignment_requests ar
        LEFT JOIN users c ON ar.client_id = c.id
        LEFT JOIN users d ON ar.doctor_id = d.id
        LEFT JOIN users consultant ON ar.consultant_id = consultant.id
        ORDER BY ar.id DESC
      `;
      params = [];
      console.log('[API] Fetching all assignments for', user.role);
    } else {
      return NextResponse.json({ error: 'Unauthorized role' }, { status: 403 });
    }

    const [requests] = await pool.execute<RowDataPacket[]>(query, params);
    console.log('[API] Found', requests.length, 'assignment(s)');

    // Remove BLOB data from response
    const sanitizedRequests = requests.map(req => ({
      ...req,
      attachment_data: null,
      payment_receipt_data: null,
      has_attachment: !!req.attachment_data,
      has_receipt: !!req.payment_receipt_data,
    }));

    console.log('[API] Returning', sanitizedRequests.length, 'sanitized assignment(s)');
    return NextResponse.json(sanitizedRequests);
  } catch (error) {
    console.error('Error fetching assignment requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignment requests' },
      { status: 500 }
    );
  }
}

// POST - Create new assignment request (client only)
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user || user.role !== 'client') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { title, description, subject, deadline, attachment_data, attachment_filename } = data;

    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }

    // Convert base64 attachment to buffer if provided
    let attachmentBuffer = null;
    let attachmentSize = 0;
    if (attachment_data && attachment_filename) {
      const base64Data = attachment_data.includes(',')
        ? attachment_data.split(',')[1]
        : attachment_data;
      attachmentBuffer = Buffer.from(base64Data, 'base64');
      attachmentSize = attachmentBuffer.length;
    }

    const dbClient = (process.env.DB_CLIENT || '').toLowerCase();
    const usePostgres =
      dbClient === 'postgres' ||
      dbClient === 'postgresql' ||
      !!process.env.DATABASE_URL;

    if (usePostgres) {
      await ensureAssignmentRequestIdDefaultForPostgres();
    }

    const [columns] = await pool.execute<RowDataPacket[]>(
      usePostgres
        ? `SELECT column_name
           FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = 'assignment_requests'`
        : `SELECT COLUMN_NAME
           FROM INFORMATION_SCHEMA.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'assignment_requests'`
    );
    const existingColumns = new Set(
      columns.map((row) =>
        String((row as RowDataPacket).column_name || (row as RowDataPacket).COLUMN_NAME || '').toLowerCase()
      )
    );

    const fieldValues: Record<string, unknown> = {
      client_id: user.userId,
      title,
      description,
      subject: subject || null,
      deadline: deadline || null,
      priority: data.priority || 'medium',
      attachment_filename: attachment_filename || null,
      attachment_data: attachmentBuffer,
      attachment_size: attachmentSize,
      created_at: new Date(),
      updated_at: new Date(),
      status: 'pending_review',
    };

    const insertEntries = Object.entries(fieldValues).filter(([column]) =>
      existingColumns.has(column.toLowerCase())
    );

    if (!insertEntries.length) {
      return NextResponse.json(
        { error: 'No compatible columns found for assignment insert' },
        { status: 500 }
      );
    }

    const insertColumns = insertEntries.map(([column]) => column).join(', ');
    const placeholders = insertEntries.map(() => '?').join(', ');
    const values = insertEntries.map(([, value]) => value);

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO assignment_requests (${insertColumns}) VALUES (${placeholders})`,
      values
    );

    return NextResponse.json({
      success: true,
      message: 'Assignment request submitted successfully',
      requestId: result.insertId,
    });
  } catch (error: unknown) {
    const errorObj = error as { message?: string; code?: string };
    console.error('Error creating assignment request:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create assignment request',
        details: errorObj?.message || 'Unknown error',
        code: errorObj?.code || '' 
      },
      { status: 500 }
    );
  }
}
