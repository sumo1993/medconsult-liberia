import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';

// GET - Get file count for an assignment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get file count
    const [result] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM assignment_files WHERE assignment_id = ?',
      [id]
    );

    return NextResponse.json({ count: result[0].count });
  } catch (error) {
    console.error('Error fetching file count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch file count' },
      { status: 500 }
    );
  }
}
