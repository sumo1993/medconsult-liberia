import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const researcherId = params.id;

    // Fetch published research papers by this researcher
    const [papers] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        id,
        title,
        summary,
        category,
        views,
        likes,
        published_at
      FROM research_posts
      WHERE author_id = ? AND status = 'published'
      ORDER BY published_at DESC`,
      [researcherId]
    );

    return NextResponse.json(papers);
  } catch (error) {
    console.error('Error fetching research papers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch research papers' },
      { status: 500 }
    );
  }
}
