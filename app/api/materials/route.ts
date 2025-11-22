import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// GET - Fetch all study materials
export async function GET(request: NextRequest) {
  try {
    const [materials] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        sm.*,
        u.full_name as uploader_name,
        u.email as uploader_email
       FROM study_materials sm
       JOIN users u ON sm.uploaded_by = u.id
       ORDER BY sm.upload_date DESC`
    );

    return NextResponse.json({ materials });
  } catch (error) {
    console.error('Error fetching materials:', error);
    return NextResponse.json(
      { error: 'Failed to fetch materials' },
      { status: 500 }
    );
  }
}

// POST - Upload new study material
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only doctors/admins can upload materials
    if (user.role !== 'management' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only doctors can upload study materials' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const file = formData.get('file') as File;

    if (!title || !file) {
      return NextResponse.json(
        { error: 'Title and file are required' },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'materials');
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (err) {
      // Directory might already exist
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${sanitizedFileName}`;
    const filePath = `/uploads/materials/${fileName}`;
    const fullPath = path.join(uploadsDir, fileName);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(fullPath, buffer);

    // Insert into database
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO study_materials 
       (title, description, file_name, file_path, file_type, file_size, category, uploaded_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description || null,
        file.name,
        filePath,
        file.type,
        file.size,
        category || 'General',
        user.userId,
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Material uploaded successfully',
      id: result.insertId,
    });
  } catch (error: any) {
    console.error('Error uploading material:', error);
    return NextResponse.json(
      { 
        error: 'Failed to upload material',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
