import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';

// GET - Fetch pending research papers
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user || (user.role !== 'admin' && user.role !== 'management')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [papers] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        rp.id,
        rp.title,
        rp.summary,
        rp.content,
        rp.category,
        rp.author_id,
        rp.status,
        rp.created_at,
        rp.pdf_filename,
        u.full_name as author_name
      FROM research_posts rp
      JOIN users u ON rp.author_id = u.id
      WHERE rp.status = 'pending'
      ORDER BY rp.created_at ASC`
    );

    return NextResponse.json(papers);
  } catch (error) {
    console.error('Error fetching pending papers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending papers' },
      { status: 500 }
    );
  }
}
