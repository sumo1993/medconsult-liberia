import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';

async function ensureClientSettingsTable() {
  await pool.execute(
    `CREATE TABLE IF NOT EXISTS client_settings (
      user_id INT PRIMARY KEY,
      email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
      assignment_notifications BOOLEAN NOT NULL DEFAULT TRUE,
      message_notifications BOOLEAN NOT NULL DEFAULT TRUE,
      feedback_notifications BOOLEAN NOT NULL DEFAULT TRUE,
      profile_visibility VARCHAR(20) NOT NULL DEFAULT 'private',
      show_email BOOLEAN NOT NULL DEFAULT FALSE,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`
  );
}

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user || user.role !== 'client') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensureClientSettingsTable();

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT email_notifications, assignment_notifications, message_notifications, feedback_notifications
       FROM client_settings
       WHERE user_id = ?`,
      [user.userId]
    );

    if (!rows.length) {
      return NextResponse.json({
        emailNotifications: true,
        assignmentNotifications: true,
        messageNotifications: true,
        feedbackNotifications: true,
      });
    }

    return NextResponse.json({
      emailNotifications: !!rows[0].email_notifications,
      assignmentNotifications: !!rows[0].assignment_notifications,
      messageNotifications: !!rows[0].message_notifications,
      feedbackNotifications: !!rows[0].feedback_notifications,
    });
  } catch (error) {
    console.error('Error loading client notification settings:', error);
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user || user.role !== 'client') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const emailNotifications = !!body?.emailNotifications;
    const assignmentNotifications = !!body?.assignmentNotifications;
    const messageNotifications = !!body?.messageNotifications;
    const feedbackNotifications = !!body?.feedbackNotifications;

    await ensureClientSettingsTable();

    const [existing] = await pool.execute<RowDataPacket[]>(
      'SELECT user_id FROM client_settings WHERE user_id = ?',
      [user.userId]
    );

    if (!existing.length) {
      await pool.execute(
        `INSERT INTO client_settings
         (user_id, email_notifications, assignment_notifications, message_notifications, feedback_notifications)
         VALUES (?, ?, ?, ?, ?)`,
        [
          user.userId,
          emailNotifications,
          assignmentNotifications,
          messageNotifications,
          feedbackNotifications,
        ]
      );
    } else {
      await pool.execute(
        `UPDATE client_settings
         SET email_notifications = ?, assignment_notifications = ?, message_notifications = ?, feedback_notifications = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = ?`,
        [
          emailNotifications,
          assignmentNotifications,
          messageNotifications,
          feedbackNotifications,
          user.userId,
        ]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving client notification settings:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}

