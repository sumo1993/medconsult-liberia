import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAuth } from '@/lib/middleware';

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user || user.role !== 'researcher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await pool.execute(
      `UPDATE researcher_notifications
       SET is_read = TRUE
       WHERE user_id = ?`,
      [user.userId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking all researcher notifications as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notifications as read' },
      { status: 500 }
    );
  }
}
