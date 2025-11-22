import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';

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

    let query = '';
    let params: any[] = [];

    if (user.role === 'client') {
      // Clients see only their requests
      query = `
        SELECT ar.*, 
               u.full_name as doctor_name,
               u.email as doctor_email
        FROM assignment_requests ar
        LEFT JOIN users u ON ar.doctor_id = u.id
        WHERE ar.client_id = ?
        ORDER BY ar.created_at DESC
      `;
      params = [user.userId];
      console.log('[API] Fetching assignments for client ID:', user.userId);
    } else if (user.role === 'management' || user.role === 'admin' || user.role === 'consultant' || user.role === 'researcher') {
      // Management, Admin, Consultants, and Researchers see all assignments
      query = `
        SELECT ar.*, 
               c.full_name as client_name,
               c.email as client_email,
               d.full_name as doctor_name
        FROM assignment_requests ar
        LEFT JOIN users c ON ar.client_id = c.id
        LEFT JOIN users d ON ar.doctor_id = d.id
        ORDER BY ar.created_at DESC
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

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO assignment_requests 
       (client_id, title, description, subject, deadline, attachment_filename, attachment_data, attachment_size, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending_review')`,
      [
        user.userId,
        title,
        description,
        subject || null,
        deadline || null,
        attachment_filename || null,
        attachmentBuffer,
        attachmentSize,
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Assignment request submitted successfully',
      requestId: result.insertId,
    });
  } catch (error: any) {
    console.error('Error creating assignment request:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create assignment request',
        details: error.message,
        code: error.code 
      },
      { status: 500 }
    );
  }
}
