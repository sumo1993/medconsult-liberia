import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const userId = params.id;

    // Fetch profile photo from database
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT profile_photo, profile_photo_filename FROM users WHERE id = ?',
      [userId]
    );

    if (rows.length === 0 || !rows[0].profile_photo) {
      return new NextResponse('Profile photo not found', { status: 404 });
    }

    const photoBuffer = rows[0].profile_photo;
    const filename = rows[0].profile_photo_filename || 'profile.jpg';

    // Determine content type from filename
    const ext = filename.split('.').pop()?.toLowerCase();
    const contentTypeMap: { [key: string]: string } = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
    };
    const contentType = contentTypeMap[ext || 'jpg'] || 'image/jpeg';

    return new NextResponse(photoBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error('Error fetching profile photo:', error);
    return new NextResponse('Error fetching profile photo', { status: 500 });
  }
}
