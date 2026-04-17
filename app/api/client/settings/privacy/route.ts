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
      `SELECT profile_visibility, show_email
       FROM client_settings
       WHERE user_id = ?`,
      [user.userId]
    );

    if (!rows.length) {
      return NextResponse.json({
        profileVisibility: 'private',
        showEmail: false,
      });
    }

    return NextResponse.json({
      profileVisibility: rows[0].profile_visibility || 'private',
      showEmail: !!rows[0].show_email,
    });
  } catch (error) {
    console.error('Error loading client privacy settings:', error);
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
    const profileVisibility = (body?.profileVisibility || 'private') === 'public' ? 'public' : 'private';
    const showEmail = !!body?.showEmail;

    await ensureClientSettingsTable();

    const [existing] = await pool.execute<RowDataPacket[]>(
      'SELECT user_id FROM client_settings WHERE user_id = ?',
      [user.userId]
    );

    if (!existing.length) {
      await pool.execute(
        `INSERT INTO client_settings
         (user_id, profile_visibility, show_email)
         VALUES (?, ?, ?)`,
        [user.userId, profileVisibility, showEmail]
      );
    } else {
      await pool.execute(
        `UPDATE client_settings
         SET profile_visibility = ?, show_email = ?, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = ?`,
        [profileVisibility, showEmail, user.userId]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving client privacy settings:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}

