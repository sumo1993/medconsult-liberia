import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAuth } from '@/lib/middleware';
import { RowDataPacket } from 'mysql2';

// Ensure table exists
async function ensureTable() {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS researcher_notifications (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        type ENUM('success', 'warning', 'info', 'achievement', 'deadline', 'message') DEFAULT 'info',
        title VARCHAR(255) NOT NULL,
        message TEXT,
        action_url VARCHAR(500),
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user (user_id),
        INDEX idx_read (is_read)
      )
    `);
  } catch (error) {
    console.error('Error ensuring notifications table:', error);
  }
}

// Generate smart notifications based on user activity
async function generateSmartNotifications(userId: number) {
  const notifications: any[] = [];
  const now = new Date();

  try {
    // Check for pending submissions
    const [pending] = await pool.execute<RowDataPacket[]>(
      "SELECT COUNT(*) as count FROM research_submissions WHERE researcher_id = ? AND status = 'pending'",
      [userId]
    );
    if (pending[0]?.count > 0) {
      notifications.push({
        type: 'info',
        title: 'Submissions Pending Review',
        message: `You have ${pending[0].count} submission(s) waiting for review.`,
        action_url: '/dashboard/researcher/submissions',
      });
    }

    // Check for approved submissions (last 24 hours)
    const [approved] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM research_submissions 
       WHERE researcher_id = ? AND status = 'approved' 
       AND updated_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
      [userId]
    );
    if (approved[0]?.count > 0) {
      notifications.push({
        type: 'success',
        title: 'Submissions Approved!',
        message: `${approved[0].count} of your submissions have been approved.`,
        action_url: '/dashboard/researcher/submissions',
      });
    }

    // Check streak
    const [streak] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(DISTINCT DATE(created_at)) as days
       FROM research_submissions 
       WHERE researcher_id = ?
       AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`,
      [userId]
    );
    if (streak[0]?.days >= 3) {
      notifications.push({
        type: 'achievement',
        title: '🔥 Streak Achievement!',
        message: `You've been active for ${streak[0].days} days this week. Keep it up!`,
        action_url: '/dashboard/researcher/analytics',
      });
    }

    // Check project deadlines
    const [deadlines] = await pool.execute<RowDataPacket[]>(
      `SELECT title, deadline FROM research_projects 
       WHERE status = 'active' 
       AND deadline BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
       LIMIT 3`
    );
    for (const project of deadlines) {
      const daysLeft = Math.ceil((new Date(project.deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      notifications.push({
        type: 'deadline',
        title: 'Project Deadline Approaching',
        message: `"${project.title}" is due in ${daysLeft} day(s).`,
        action_url: '/dashboard/researcher/projects',
      });
    }

    // Check for new reports
    const [reports] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM research_reports 
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) AND status = 'published'`
    );
    if (reports[0]?.count > 0) {
      notifications.push({
        type: 'info',
        title: 'New Reports Available',
        message: `${reports[0].count} new research report(s) have been published.`,
        action_url: '/dashboard/researcher/reports',
      });
    }

    // Weekly goal reminder
    const [weeklyCount] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM research_submissions 
       WHERE researcher_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`,
      [userId]
    );
    const weeklyTarget = 10;
    const progress = weeklyCount[0]?.count || 0;
    if (progress < weeklyTarget) {
      notifications.push({
        type: 'warning',
        title: 'Weekly Goal Reminder',
        message: `You've submitted ${progress}/${weeklyTarget} this week. ${weeklyTarget - progress} more to reach your goal!`,
        action_url: '/dashboard/researcher/submit-data',
      });
    }

  } catch (e) {
    console.error('Error generating smart notifications:', e);
  }

  return notifications;
}

export async function GET(request: NextRequest) {
  try {
    await ensureTable();
    
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get stored notifications
    const [stored] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM researcher_notifications 
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 50`,
      [user.userId]
    );

    // Generate smart notifications
    const smartNotifications = await generateSmartNotifications(user.userId);
    
    // Add timestamps to smart notifications
    const now = new Date().toISOString();
    const enrichedSmartNotifications = smartNotifications.map((n, i) => ({
      ...n,
      id: -1 - i, // Negative IDs for generated notifications
      is_read: false,
      created_at: now,
    }));

    // Combine and sort
    const allNotifications = [...enrichedSmartNotifications, ...stored];

    return NextResponse.json(allNotifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}


