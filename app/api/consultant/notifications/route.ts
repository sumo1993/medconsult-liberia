import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';

type NotificationItem = {
  id: number;
  type: 'assignment' | 'message' | 'appointment';
  title: string;
  message: string;
  link: string;
  created_at: string;
  is_read: boolean;
};

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user || (user.role !== 'consultant' && user.role !== 'management')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const consultantId = user.userId;
    const now = new Date().toISOString();
    const notifications: NotificationItem[] = [];

    // 1) Unread assignment messages (highest priority)
    const [unreadMessages] = await pool.execute<RowDataPacket[]>(
      `SELECT 
         COUNT(DISTINCT am.assignment_request_id) as unread_count
       FROM assignment_messages am
       INNER JOIN assignment_requests ar ON am.assignment_request_id = ar.id
       WHERE COALESCE(ar.consultant_id, ar.doctor_id) = ?
       AND am.sender_id != ?
       AND am.created_at > COALESCE(
         (SELECT last_read_at
          FROM assignment_message_reads
          WHERE user_id = ? AND assignment_request_id = am.assignment_request_id),
         '2000-01-01'
       )`,
      [consultantId, consultantId, consultantId]
    );
    const unreadCount = Number(unreadMessages[0]?.unread_count || 0);
    if (unreadCount > 0) {
      notifications.push({
        id: 1,
        type: 'message',
        title: 'Unread Assignment Messages',
        message: `You have ${unreadCount} assignment conversation${unreadCount > 1 ? 's' : ''} with unread messages.`,
        link: '/dashboard/consultant/messages',
        created_at: now,
        is_read: false
      });
    }

    // 2) Pending-review assignments (same source used by bell counters)
    const [pendingAssignments] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as pending_count
       FROM assignment_requests
       WHERE status = 'pending_review'`
    );
    const pendingCount = Number(pendingAssignments[0]?.pending_count || 0);
    if (pendingCount > 0) {
      notifications.push({
        id: 2,
        type: 'assignment',
        title: 'Assignments Need Attention',
        message: `${pendingCount} assignment${pendingCount > 1 ? 's are' : ' is'} waiting in pending review.`,
        link: '/dashboard/consultant/assignments',
        created_at: now,
        is_read: false
      });
    }

    // 3) Pending appointments
    const [pendingAppointments] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as pending_count
       FROM appointments
       WHERE status = 'pending'`
    );
    const appointmentCount = Number(pendingAppointments[0]?.pending_count || 0);
    if (appointmentCount > 0) {
      notifications.push({
        id: 3,
        type: 'appointment',
        title: 'Pending Appointments',
        message: `${appointmentCount} appointment request${appointmentCount > 1 ? 's' : ''} pending confirmation.`,
        link: '/dashboard/consultant/appointments',
        created_at: now,
        is_read: false
      });
    }

    // 4) General contact messages
    const [contactMessages] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as message_count FROM contact_messages`
    );
    const messageCount = Number(contactMessages[0]?.message_count || 0);
    if (messageCount > 0) {
      notifications.push({
        id: 4,
        type: 'message',
        title: 'General Messages',
        message: `${messageCount} general message${messageCount > 1 ? 's' : ''} available.`,
        link: '/dashboard/consultant/messages',
        created_at: now,
        is_read: false
      });
    }

    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Error fetching consultant notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

