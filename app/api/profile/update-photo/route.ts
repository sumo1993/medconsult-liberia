import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAuth } from '@/lib/middleware';

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { profile_photo_data, filename } = await request.json();

    if (!profile_photo_data) {
      return NextResponse.json({ error: 'No photo data provided' }, { status: 400 });
    }

    // Convert base64 to Buffer
    const base64Data = profile_photo_data.includes(',') 
      ? profile_photo_data.split(',')[1] 
      : profile_photo_data;
    const photoBuffer = Buffer.from(base64Data, 'base64');
    const photoSize = photoBuffer.length;

    // Update users table with profile photo
    await pool.execute(
      `UPDATE users 
       SET profile_photo = ?, profile_photo_filename = ?, profile_photo_size = ?
       WHERE id = ?`,
      [photoBuffer, filename || 'profile.jpg', photoSize, user.userId]
    );

    return NextResponse.json({
      success: true,
      message: 'Profile photo updated successfully',
    });
  } catch (error) {
    console.error('Error updating profile photo:', error);
    return NextResponse.json(
      { error: 'Failed to update profile photo' },
      { status: 500 }
    );
  }
}
