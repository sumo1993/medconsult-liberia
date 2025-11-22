import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user || user.role !== 'client') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientId = user.userId;

    // Get all notifications for the client
    const notifications: any[] = [];

    // 1. Assignment status changes
    const [assignments] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        id,
        title,
        status,
        updated_at,
        CASE 
          WHEN status = 'price_proposed' THEN 'Price proposed for your assignment'
          WHEN status = 'accepted' THEN 'Assignment accepted - Upload payment'
          WHEN status = 'in_progress' THEN 'Work in progress on your assignment'
          WHEN status = 'completed' THEN 'Assignment completed - Review available'
          WHEN status = 'rejected' THEN 'Assignment request rejected'
          ELSE 'Assignment status updated'
        END as message
       FROM assignment_requests
       WHERE client_id = ?
       AND updated_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       ORDER BY updated_at DESC
       LIMIT 20`,
      [clientId]
    );

    assignments.forEach(a => {
      notifications.push({
        id: `assignment-${a.id}`,
        type: 'assignment',
        title: a.title,
        message: a.message,
        link: `/dashboard/client/assignments/${a.id}`,
        created_at: a.updated_at,
        is_read: false,
      });
    });

    // 2. New messages
    const [messages] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        m.id,
        m.message,
        m.created_at,
        ar.title as assignment_title,
        ar.id as assignment_id
       FROM messages m
       JOIN assignment_requests ar ON m.assignment_id = ar.id
       WHERE ar.client_id = ?
       AND m.sender_role = 'management'
       AND m.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       ORDER BY m.created_at DESC
       LIMIT 10`,
      [clientId]
    );

    messages.forEach(m => {
      notifications.push({
        id: `message-${m.id}`,
        type: 'message',
        title: `New message about "${m.assignment_title}"`,
        message: m.message.substring(0, 100) + (m.message.length > 100 ? '...' : ''),
        link: `/dashboard/client/assignments/${m.assignment_id}`,
        created_at: m.created_at,
        is_read: false,
      });
    });

    // Sort by date
    notifications.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}
