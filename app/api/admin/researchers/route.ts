import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';

// GET - Fetch all researchers (admin only)
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user || (user.role !== 'admin' && user.role !== 'management')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [researchers] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        id,
        full_name,
        email,
        specialization,
        years_of_experience,
        bio,
        average_rating,
        total_ratings,
        status,
        created_at,
        profile_photo_filename
      FROM users
      WHERE role = 'consultant'
      ORDER BY created_at DESC`
    );

    return NextResponse.json(researchers);
  } catch (error) {
    console.error('Error fetching researchers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch researchers' },
      { status: 500 }
    );
  }
}
