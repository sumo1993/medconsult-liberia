import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAuth } from '@/lib/middleware';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user || user.role !== 'researcher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const numericId = Number(id);

    if (!Number.isFinite(numericId) || numericId <= 0) {
      // Generated in-memory notification; acknowledge without DB update.
      return NextResponse.json({ success: true, id });
    }

    await pool.execute(
      `UPDATE researcher_notifications
       SET is_read = TRUE
       WHERE id = ? AND user_id = ?`,
      [numericId, user.userId]
    );

    return NextResponse.json({ success: true, id: numericId });
  } catch (error) {
    console.error('Error marking researcher notification as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    );
  }
}
