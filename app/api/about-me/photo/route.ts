import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';

// POST - Upload About Me photo
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only doctors can upload
    if (user.role !== 'management' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only doctors can upload photos' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const photo = formData.get('photo') as File;

    if (!photo) {
      return NextResponse.json({ error: 'No photo provided' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await photo.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Check if record exists
    const [existing] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM doctor_about_me WHERE user_id = ?',
      [user.userId]
    );

    if (existing.length === 0) {
      // Insert new record with photo
      await pool.execute(
        'INSERT INTO doctor_about_me (user_id, about_text, photo, photo_type) VALUES (?, ?, ?, ?)',
        [user.userId, '', buffer, photo.type]
      );
    } else {
      // Update existing record with photo
      await pool.execute(
        'UPDATE doctor_about_me SET photo = ?, photo_type = ? WHERE user_id = ?',
        [buffer, photo.type, user.userId]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Photo uploaded successfully',
    });
  } catch (error) {
    console.error('Error uploading photo:', error);
    return NextResponse.json(
      { error: 'Failed to upload photo' },
      { status: 500 }
    );
  }
}

// GET - Serve About Me photo
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get('userId');
    
    if (!userIdParam) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const userId = parseInt(userIdParam);

    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT photo, photo_type FROM doctor_about_me WHERE user_id = ?',
      [userId]
    );

    if (!rows || rows.length === 0 || !rows[0].photo) {
      return NextResponse.json({ error: 'No photo found' }, { status: 404 });
    }

    const photoBuffer = Buffer.from(rows[0].photo);

    return new NextResponse(photoBuffer, {
      status: 200,
      headers: {
        'Content-Type': rows[0].photo_type || 'image/jpeg',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error serving photo:', error);
    return NextResponse.json(
      { error: 'Failed to serve photo' },
      { status: 500 }
    );
  }
}
