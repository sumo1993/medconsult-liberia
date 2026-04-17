import { NextRequest, NextResponse } from 'next/server';
import pool, { IS_POSTGRES } from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';
import { ensureCensusFieldApplicationsTable } from '@/lib/ensure-census-field-applications-table';

type CountRow = RowDataPacket & { count: number };

const STAFF_ROLES = new Set(['admin', 'management', 'consultant', 'researcher']);

async function safeCount(sql: string, params: unknown[] = []): Promise<number> {
  try {
    const [rows] = await pool.execute<CountRow[]>(sql, params);
    return Number(rows[0]?.count ?? 0);
  } catch {
    return 0;
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role, userId } = user;
    const isStaff = STAFF_ROLES.has(role);

    const counts = {
      messages: 0,
      appointments: 0,
      assignments: 0,
      donationInquiries: 0,
      researchPosts: 0,
      unreadAssignmentMessages: 0,
      teamApplications: 0,
      censusFieldApplications: 0,
      directMessagesUnread: 0,
      pendingResearchPapers: 0,
    };

    const promises: Promise<void>[] = [];

    // Staff-only: applications, DMs, research approval queue
    if (role === 'admin' || role === 'management') {
      promises.push(
        safeCount(
          `SELECT COUNT(*) AS count FROM team_applications WHERE status IN ('pending', 'reviewing')`
        ).then((n) => {
          counts.teamApplications = n;
        })
      );
      promises.push(
        (async () => {
          try {
            await ensureCensusFieldApplicationsTable();
            const n = await safeCount(
              `SELECT COUNT(*) AS count FROM census_field_applications WHERE status IN ('pending', 'reviewing')`
            );
            counts.censusFieldApplications = n;
          } catch {
            counts.censusFieldApplications = 0;
          }
        })()
      );
      promises.push(
        safeCount(
          `SELECT COUNT(*) AS count FROM direct_messages WHERE receiver_id = ? AND COALESCE(is_read, FALSE) = FALSE`,
          [userId]
        ).then((n) => {
          counts.directMessagesUnread = n;
        })
      );
      promises.push(
        safeCount(`SELECT COUNT(*) AS count FROM research_posts WHERE status = 'pending'`).then((n) => {
          counts.pendingResearchPapers = n;
        })
      );
    }

    // Unread assignment messages — scoped per role
    if (role === 'client') {
      promises.push(
        safeCount(
          `SELECT COUNT(DISTINCT am.assignment_request_id) AS count
           FROM assignment_messages am
           JOIN assignment_requests ar ON am.assignment_request_id = ar.id
           WHERE ar.client_id = ?
             AND am.sender_id != ?
             AND am.created_at > COALESCE(
               (SELECT last_read_at FROM assignment_message_reads
                WHERE user_id = ? AND assignment_request_id = am.assignment_request_id),
               '2000-01-01'
             )`,
          [userId, userId, userId]
        ).then((n) => { counts.unreadAssignmentMessages = n; })
      );
    } else if (role === 'consultant') {
      promises.push(
        safeCount(
          `SELECT COUNT(DISTINCT am.assignment_request_id) AS count
           FROM assignment_messages am
           JOIN assignment_requests ar ON am.assignment_request_id = ar.id
           WHERE ar.doctor_id = ?
             AND am.sender_id != ?
             AND am.created_at > COALESCE(
               (SELECT last_read_at FROM assignment_message_reads
                WHERE user_id = ? AND assignment_request_id = am.assignment_request_id),
               '2000-01-01'
             )`,
          [userId, userId, userId]
        ).then((n) => { counts.unreadAssignmentMessages = n; })
      );
    } else if (role === 'management' || role === 'admin') {
      promises.push(
        safeCount(
          `SELECT COUNT(DISTINCT am.assignment_request_id) AS count
           FROM assignment_messages am
           WHERE am.sender_id != ?
             AND am.created_at > COALESCE(
               (SELECT last_read_at FROM assignment_message_reads
                WHERE user_id = ? AND assignment_request_id = am.assignment_request_id),
               '2000-01-01'
             )`,
          [userId, userId]
        ).then((n) => { counts.unreadAssignmentMessages = n; })
      );
    }

    // Contact messages — admin and management only (they respond to inquiries)
    if (role === 'admin' || role === 'management') {
      promises.push(
        safeCount(`SELECT COUNT(*) AS count FROM contact_messages`).then((n) => {
          counts.messages = n;
        })
      );
    }

    // Pending appointments — admin, management, consultant
    if (role === 'admin' || role === 'management' || role === 'consultant') {
      promises.push(
        safeCount(
          `SELECT COUNT(*) AS count FROM appointments WHERE status = 'pending'`
        ).then((n) => { counts.appointments = n; })
      );
    }

    // Pending assignment requests — staff only
    if (isStaff) {
      promises.push(
        safeCount(
          `SELECT COUNT(*) AS count FROM assignment_requests WHERE status = 'pending_review'`
        ).then((n) => { counts.assignments = n; })
      );

      // Donation inquiries
      promises.push(
        safeCount(
          `SELECT COUNT(*) AS count FROM donation_inquiries WHERE status = 'pending'`
        ).then((n) => { counts.donationInquiries = n; })
      );
    }

    // Research posts (drafts)
    if (role === 'researcher' || role === 'consultant') {
      promises.push(
        safeCount(
          `SELECT COUNT(*) AS count FROM research_posts WHERE status = 'draft' AND author_id = ?`,
          [userId]
        ).then((n) => { counts.researchPosts = n; })
      );
    } else if (role === 'admin' || role === 'management') {
      promises.push(
        safeCount(
          `SELECT COUNT(*) AS count FROM research_posts WHERE status = 'draft'`
        ).then((n) => { counts.researchPosts = n; })
      );
    }

    await Promise.all(promises);

    return NextResponse.json({ counts });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}
