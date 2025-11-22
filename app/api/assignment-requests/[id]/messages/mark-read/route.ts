import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAuth } from '@/lib/middleware';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const assignmentId = parseInt(id);

    // Insert or update the last_read_at timestamp
    await pool.execute(
      `INSERT INTO assignment_message_reads (user_id, assignment_request_id, last_read_at)
       VALUES (?, ?, NOW())
       ON DUPLICATE KEY UPDATE last_read_at = NOW()`,
      [user.userId, assignmentId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark messages as read' },
      { status: 500 }
    );
  }
}
