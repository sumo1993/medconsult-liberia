import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const [photos] = await pool.execute<RowDataPacket[]>(
      'SELECT photo_data, photo_type FROM team_photos WHERE id = ?',
      [id]
    );
    
    if (photos.length === 0) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }
    
    const photo = photos[0];
    
    return new NextResponse(photo.photo_data, {
      headers: {
        'Content-Type': photo.photo_type,
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error('Error fetching team photo:', error);
    return NextResponse.json({ error: 'Failed to fetch photo' }, { status: 500 });
  }
}


