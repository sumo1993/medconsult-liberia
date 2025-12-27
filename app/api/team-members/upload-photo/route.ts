import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/middleware';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';

// Ensure team_photos table exists
async function ensureTable() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS team_photos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      photo_data LONGBLOB NOT NULL,
      photo_type VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

export async function POST(request: NextRequest) {
  try {
    console.log('[Upload] Starting team photo upload...');
    
    const user = await verifyAuth(request);
    if (!user || user.role !== 'admin') {
      console.log('[Upload] Unauthorized user');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Upload] User authorized:', user.role);

    const formData = await request.formData();
    const file = formData.get('photo') as File;

    if (!file) {
      console.log('[Upload] No file in request');
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    console.log('[Upload] File received:', file.name, file.type, file.size);

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      console.log('[Upload] Invalid file type:', file.type);
      return NextResponse.json({ error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' }, { status: 400 });
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      console.log('[Upload] File too large:', file.size);
      return NextResponse.json({ error: 'File too large. Maximum size is 5MB.' }, { status: 400 });
    }

    await ensureTable();

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    console.log('[Upload] Buffer created, size:', buffer.length);

    // Store photo in database
    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO team_photos (photo_data, photo_type) VALUES (?, ?)',
      [buffer, file.type]
    );

    const photoId = result.insertId;
    const photoUrl = `/api/team-members/photo/${photoId}`;
    
    console.log('[Upload] Photo stored in database with ID:', photoId);

    return NextResponse.json({
      success: true,
      photoUrl,
      message: 'Photo uploaded successfully'
    });
  } catch (error: any) {
    console.error('Error uploading photo:', error);
    return NextResponse.json(
      { error: 'Failed to upload photo', details: error?.message },
      { status: 500 }
    );
  }
}
