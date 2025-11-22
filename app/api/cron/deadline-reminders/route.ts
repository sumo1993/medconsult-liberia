import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// This endpoint should be called by a cron job (e.g., every hour)
// You can use services like Vercel Cron, GitHub Actions, or external cron services

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key-here';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Deadline Reminders] Starting deadline check...');

    const now = new Date();
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Find assignments with deadlines in the next 24 hours that haven't been reminded
    const [assignments] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        ar.id,
        ar.title,
        ar.deadline,
        ar.status,
        ar.doctor_id,
        ar.client_id,
        d.email as doctor_email,
        d.full_name as doctor_name,
        c.email as client_email,
        c.full_name as client_name
       FROM assignment_requests ar
       JOIN users d ON ar.doctor_id = d.id
       JOIN users c ON ar.client_id = c.id
       WHERE ar.deadline IS NOT NULL
       AND ar.deadline BETWEEN NOW() AND ?
       AND ar.status IN ('in_progress', 'payment_verified')
       AND (ar.deadline_reminder_sent IS NULL OR ar.deadline_reminder_sent = 0)`,
      [twentyFourHoursFromNow]
    );

    console.log(`[Deadline Reminders] Found ${assignments.length} assignments needing reminders`);

    const reminders = [];

    for (const assignment of assignments) {
      const hoursUntilDeadline = Math.round(
        (new Date(assignment.deadline).getTime() - now.getTime()) / (1000 * 60 * 60)
      );

      // Create in-app notification message
      const message = `⏰ Deadline Reminder: Assignment "${assignment.title}" is due in ${hoursUntilDeadline} hours!`;

      // Insert notification message
      await pool.execute(
        `INSERT INTO assignment_messages (assignment_request_id, sender_id, message, message_type)
         VALUES (?, ?, ?, 'system')`,
        [assignment.id, assignment.doctor_id, message]
      );

      // Mark reminder as sent
      await pool.execute(
        `UPDATE assignment_requests 
         SET deadline_reminder_sent = 1
         WHERE id = ?`,
        [assignment.id]
      );

      reminders.push({
        assignmentId: assignment.id,
        title: assignment.title,
        deadline: assignment.deadline,
        hoursUntilDeadline,
        doctorEmail: assignment.doctor_email,
        clientEmail: assignment.client_email,
      });

      console.log(`[Deadline Reminders] Sent reminder for assignment #${assignment.id}`);
    }

    // Find overdue assignments
    const [overdueAssignments] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        ar.id,
        ar.title,
        ar.deadline,
        ar.status,
        d.email as doctor_email,
        d.full_name as doctor_name
       FROM assignment_requests ar
       JOIN users d ON ar.doctor_id = d.id
       WHERE ar.deadline IS NOT NULL
       AND ar.deadline < NOW()
       AND ar.status IN ('in_progress', 'payment_verified')
       AND (ar.overdue_notification_sent IS NULL OR ar.overdue_notification_sent = 0)`
    );

    console.log(`[Deadline Reminders] Found ${overdueAssignments.length} overdue assignments`);

    const overdueNotifications = [];

    for (const assignment of overdueAssignments) {
      const message = `🚨 OVERDUE: Assignment "${assignment.title}" has passed its deadline. Please submit as soon as possible.`;

      // Insert notification message
      await pool.execute(
        `INSERT INTO assignment_messages (assignment_request_id, sender_id, message, message_type)
         VALUES (?, ?, ?, 'system')`,
        [assignment.id, assignment.doctor_id, message]
      );

      // Mark overdue notification as sent
      await pool.execute(
        `UPDATE assignment_requests 
         SET overdue_notification_sent = 1
         WHERE id = ?`,
        [assignment.id]
      );

      overdueNotifications.push({
        assignmentId: assignment.id,
        title: assignment.title,
        deadline: assignment.deadline,
        doctorEmail: assignment.doctor_email,
      });

      console.log(`[Deadline Reminders] Sent overdue notification for assignment #${assignment.id}`);
    }

    return NextResponse.json({
      success: true,
      reminders: reminders.length,
      overdueNotifications: overdueNotifications.length,
      details: {
        upcomingDeadlines: reminders,
        overdueAssignments: overdueNotifications,
      },
    });

  } catch (error: any) {
    console.error('[Deadline Reminders] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process deadline reminders: ' + error.message },
      { status: 500 }
    );
  }
}
