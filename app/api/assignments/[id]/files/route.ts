import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';

// GET - Fetch all files for an assignment
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

    // Get all files for this assignment
    const [files] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        af.*,
        u.full_name as uploader_name,
        u.email as uploader_email
       FROM assignment_files af
       JOIN users u ON af.uploaded_by = u.id
       WHERE af.assignment_id = ?
       ORDER BY af.created_at DESC`,
      [id]
    );

    return NextResponse.json({ files });
  } catch (error) {
    console.error('Error fetching assignment files:', error);
    return NextResponse.json(
      { error: 'Failed to fetch files' },
      { status: 500 }
    );
  }
}

// POST - Upload a new file
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
    const body = await request.json();
    const { file_name, file_type, file_size, file_data, description } = body;

    if (!file_name) {
      return NextResponse.json(
        { error: 'File name is required' },
        { status: 400 }
      );
    }

    // Determine uploader role
    const uploaderRole = user.role === 'client' ? 'client' : 'management';

    // Convert base64 to Buffer if file_data is provided
    let fileBuffer = null;
    if (file_data) {
      // Remove data URL prefix if present (e.g., "data:application/pdf;base64,")
      const base64Data = file_data.includes(',') ? file_data.split(',')[1] : file_data;
      fileBuffer = Buffer.from(base64Data, 'base64');
    }

    // Insert file record with BLOB data
    const [result] = await pool.execute(
      `INSERT INTO assignment_files 
       (assignment_id, uploaded_by, uploader_role, file_name, file_type, file_size, file_url, file_data, description) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, user.userId, uploaderRole, file_name, file_type, file_size, null, fileBuffer, description || null]
    );

    return NextResponse.json(
      {
        success: true,
        message: 'File uploaded successfully',
        id: (result as any).insertId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
