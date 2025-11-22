import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';

// POST - Upload profile photo
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const photo = formData.get('photo') as File;

    if (!photo) {
      return NextResponse.json({ error: 'No photo provided' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await photo.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Check if profile exists
    const [profiles] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM user_profiles WHERE user_id = ?',
      [user.userId]
    );

    if (profiles.length === 0) {
      // Create profile if it doesn't exist
      await pool.execute(
        'INSERT INTO user_profiles (user_id, profile_photo, profile_photo_type) VALUES (?, ?, ?)',
        [user.userId, buffer, photo.type]
      );
    } else {
      // Update existing profile
      await pool.execute(
        'UPDATE user_profiles SET profile_photo = ?, profile_photo_type = ? WHERE user_id = ?',
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

// GET - Serve profile photo
export async function GET(request: NextRequest) {
  try {
    // Check for userId query parameter (for public access)
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get('userId');
    
    let targetUserId: number;
    
    if (userIdParam) {
      // Public access with userId parameter
      targetUserId = parseInt(userIdParam);
      console.log(`[Profile Photo] Fetching photo for user ID: ${targetUserId}`);
    } else {
      // Authenticated access for own photo
      const user = await verifyAuth(request);
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      targetUserId = user.userId;
      console.log(`[Profile Photo] Fetching photo for authenticated user ID: ${targetUserId}`);
    }

    // Check users table first
    const [users] = await pool.execute<RowDataPacket[]>(
      'SELECT profile_photo FROM users WHERE id = ?',
      [targetUserId]
    );

    if (users && users.length > 0 && users[0].profile_photo) {
      const photoBuffer = Buffer.from(users[0].profile_photo);
      console.log(`[Profile Photo] Found photo in users table for user ${targetUserId}, size: ${photoBuffer.length} bytes`);
      return new NextResponse(photoBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'image/jpeg',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Content-Length': photoBuffer.length.toString(),
        },
      });
    }

    // Fallback to user_profiles table
    const [profiles] = await pool.execute<RowDataPacket[]>(
      'SELECT profile_photo, profile_photo_type FROM user_profiles WHERE user_id = ?',
      [targetUserId]
    );

    if (!profiles || profiles.length === 0 || !profiles[0].profile_photo) {
      console.log(`[Profile Photo] No photo found for user ${targetUserId}`);
      return NextResponse.json({ error: 'No profile photo' }, { status: 404 });
    }

    const profile = profiles[0];
    const photoBuffer = Buffer.from(profile.profile_photo);
    console.log(`[Profile Photo] Found photo in user_profiles table for user ${targetUserId}, size: ${photoBuffer.length} bytes`);

    return new NextResponse(photoBuffer, {
      status: 200,
      headers: {
        'Content-Type': profile.profile_photo_type || 'image/jpeg',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Content-Length': photoBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error serving profile photo:', error);
    return NextResponse.json(
      { error: 'Failed to serve photo' },
      { status: 500 }
    );
  }
}
