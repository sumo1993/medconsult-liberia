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

    const allowedTypes = new Set([
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/heic',
      'image/heif',
    ]);
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    const allowedExt = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif']);
    const typeOk = file.type ? allowedTypes.has(file.type) : allowedExt.has(ext);
    if (!typeOk) {
      console.log('[Upload] Invalid file type:', file.type, ext);
      return NextResponse.json(
        { error: 'Invalid file type. Use JPEG, PNG, WebP, GIF, or HEIC from your device.' },
        { status: 400 }
      );
    }

    const storedMime =
      file.type && file.type !== '' ? file.type : ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : ext === 'gif' ? 'image/gif' : ext === 'heif' ? 'image/heif' : 'image/jpeg';

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
      [buffer, storedMime]
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
