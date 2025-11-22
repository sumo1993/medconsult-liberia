import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET() {
  try {
    // Fetch all active consultants (researchers)
    const [researchers] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        u.id,
        u.full_name,
        u.email,
        u.specialization,
        u.years_of_experience,
        u.bio,
        u.average_rating,
        u.total_ratings,
        u.profile_photo_filename,
        COUNT(DISTINCT rp.id) as research_count,
        COALESCE(SUM(rp.views), 0) as total_views,
        COALESCE(SUM(rp.likes), 0) as total_likes
      FROM users u
      LEFT JOIN research_posts rp ON u.id = rp.author_id AND rp.status = 'published'
      WHERE u.role = 'consultant' AND u.status = 'active'
      GROUP BY u.id
      ORDER BY u.average_rating DESC, u.years_of_experience DESC`
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
