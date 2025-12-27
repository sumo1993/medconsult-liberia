import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAuth } from '@/lib/middleware';

export async function POST(request: NextRequest) {
  try {
    console.log('[Photo Upload] Starting photo upload...');
    
    const user = await verifyAuth(request);
    if (!user) {
      console.log('[Photo Upload] Unauthorized - no user');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('[Photo Upload] User authenticated:', user.userId);

    const body = await request.json();
    const { profile_photo_data, filename } = body;
    console.log('[Photo Upload] Received data - filename:', filename, 'data length:', profile_photo_data?.length || 0);

    if (!profile_photo_data) {
      console.log('[Photo Upload] No photo data provided');
      return NextResponse.json({ error: 'No photo data provided' }, { status: 400 });
    }

    // Convert base64 to Buffer
    const base64Data = profile_photo_data.includes(',') 
      ? profile_photo_data.split(',')[1] 
      : profile_photo_data;
    const photoBuffer = Buffer.from(base64Data, 'base64');
    const photoSize = photoBuffer.length;
    console.log('[Photo Upload] Converted to buffer, size:', photoSize, 'bytes');

    // Update users table with profile photo
    const [result]: any = await pool.execute(
      `UPDATE users 
       SET profile_photo = ?, profile_photo_filename = ?, profile_photo_size = ?
       WHERE id = ?`,
      [photoBuffer, filename || 'profile.jpg', photoSize, user.userId]
    );
    console.log('[Photo Upload] Database updated, affected rows:', result.affectedRows);

    return NextResponse.json({
      success: true,
      message: 'Profile photo updated successfully',
    });
  } catch (error: any) {
    console.error('[Photo Upload] Error:', error);
    console.error('[Photo Upload] Error details:', {
      message: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage
    });
    return NextResponse.json(
      { 
        error: 'Failed to update profile photo',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
