import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';

// POST - Upload About photo (admin only)
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin can upload photos for About section
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admin can upload About photos' },
        { status: 403 }
      );
    }

    const { userId, photo_data, photo_type } = await request.json();

    if (!userId || !photo_data) {
      return NextResponse.json(
        { error: 'User ID and photo data are required' },
        { status: 400 }
      );
    }

    // Extract base64 data (remove data URL prefix if present)
    const base64Data = photo_data.includes(',') 
      ? photo_data.split(',')[1] 
      : photo_data;

    // Convert to Buffer
    const photoBuffer = Buffer.from(base64Data, 'base64');

    // Check if record exists
    const [existing] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM doctor_about_me WHERE user_id = ?',
      [userId]
    );

    if (existing.length === 0) {
      // Create new record with photo
      await pool.execute(
        'INSERT INTO doctor_about_me (user_id, photo, photo_type, about_text) VALUES (?, ?, ?, ?)',
        [userId, photoBuffer, photo_type || 'image/jpeg', '']
      );
    } else {
      // Update existing record with photo
      await pool.execute(
        'UPDATE doctor_about_me SET photo = ?, photo_type = ? WHERE user_id = ?',
        [photoBuffer, photo_type || 'image/jpeg', userId]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Photo uploaded successfully',
    });
  } catch (error) {
    console.error('Error uploading About photo:', error);
    return NextResponse.json(
      { error: 'Failed to upload photo' },
      { status: 500 }
    );
  }
}

// DELETE - Delete About photo (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin can delete photos
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admin can delete About photos' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    await pool.execute(
      'UPDATE doctor_about_me SET photo = NULL, photo_type = NULL WHERE user_id = ?',
      [userId]
    );

    return NextResponse.json({
      success: true,
      message: 'Photo deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting About photo:', error);
    return NextResponse.json(
      { error: 'Failed to delete photo' },
      { status: 500 }
    );
  }
}


