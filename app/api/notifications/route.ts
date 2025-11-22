import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const counts = {
      messages: 0,
      appointments: 0,
      assignments: 0,
      donationInquiries: 0,
      researchPosts: 0,
      unreadAssignmentMessages: 0,
    };

    // Count unread assignment messages for this user
    try {
      if (user.role === 'client') {
        // For clients: count messages from doctors they haven't read
        const [unreadMessages] = await pool.execute<RowDataPacket[]>(
          `SELECT COUNT(DISTINCT am.assignment_request_id) as count 
           FROM assignment_messages am
           JOIN assignment_requests ar ON am.assignment_request_id = ar.id
           WHERE ar.client_id = ? 
           AND am.sender_id != ?
           AND am.created_at > COALESCE(
             (SELECT last_read_at FROM assignment_message_reads 
              WHERE user_id = ? AND assignment_request_id = am.assignment_request_id),
             '2000-01-01'
           )`,
          [user.userId, user.userId, user.userId]
        );
        counts.unreadAssignmentMessages = unreadMessages[0].count;
      } else if (user.role === 'management' || user.role === 'admin' || user.role === 'consultant' || user.role === 'researcher') {
        // For doctors/consultants/researchers: count messages from clients they haven't read
        const [unreadMessages] = await pool.execute<RowDataPacket[]>(
          `SELECT COUNT(DISTINCT am.assignment_request_id) as count 
           FROM assignment_messages am
           JOIN assignment_requests ar ON am.assignment_request_id = ar.id
           WHERE am.sender_id != ?
           AND am.created_at > COALESCE(
             (SELECT last_read_at FROM assignment_message_reads 
              WHERE user_id = ? AND assignment_request_id = am.assignment_request_id),
             '2000-01-01'
           )`,
          [user.userId, user.userId]
        );
        counts.unreadAssignmentMessages = unreadMessages[0].count;
      }
    } catch (error) {
      console.log('Assignment messages count error:', error);
    }

    // Count all contact messages (general inquiries)
    try {
      const [messages] = await pool.execute<RowDataPacket[]>(
        "SELECT COUNT(*) as count FROM contact_messages"
      );
      counts.messages = messages[0].count;
    } catch (error) {
      console.log('Messages table error:', error);
    }

    // Count pending appointments
    try {
      const [appointments] = await pool.execute<RowDataPacket[]>(
        "SELECT COUNT(*) as count FROM appointments WHERE status = 'pending'"
      );
      counts.appointments = appointments[0].count;
    } catch (error) {
      console.log('Appointments table error:', error);
    }

    // Count pending assignments (for management/admin/consultant/researcher)
    if (user.role === 'admin' || user.role === 'management' || user.role === 'consultant' || user.role === 'researcher') {
      try {
        const [assignments] = await pool.execute<RowDataPacket[]>(
          "SELECT COUNT(*) as count FROM assignments WHERE status = 'pending'"
        );
        counts.assignments = assignments[0].count;
      } catch (error) {
        console.log('Assignments table error:', error);
      }

      // Count pending donation inquiries
      try {
        const [donations] = await pool.execute<RowDataPacket[]>(
          "SELECT COUNT(*) as count FROM donation_inquiries WHERE status = 'pending'"
        );
        counts.donationInquiries = donations[0].count;
      } catch (error) {
        console.log('Donation inquiries table error:', error);
      }

      // Count draft research posts (for researchers, show their own drafts)
      try {
        if (user.role === 'researcher' || user.role === 'consultant') {
          const [research] = await pool.execute<RowDataPacket[]>(
            "SELECT COUNT(*) as count FROM research_posts WHERE status = 'draft' AND author_id = ?",
            [user.userId]
          );
          counts.researchPosts = research[0].count;
        } else {
          // Admin/Management see all draft posts
          const [research] = await pool.execute<RowDataPacket[]>(
            "SELECT COUNT(*) as count FROM research_posts WHERE status = 'draft'"
          );
          counts.researchPosts = research[0].count;
        }
      } catch (error) {
        console.log('Research posts table error:', error);
      }
    }

    return NextResponse.json({ counts });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}
