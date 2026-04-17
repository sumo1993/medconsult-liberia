import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';
import bcrypt from 'bcryptjs';

async function ensurePasswordChangeLockColumn(): Promise<boolean> {
  try {
    const [columns] = await pool.execute<RowDataPacket[]>(
      `SHOW COLUMNS FROM users LIKE 'password_change_locked'`
    );
    if (columns.length > 0) {
      return true;
    }

    await pool.execute(
      `ALTER TABLE users ADD COLUMN password_change_locked TINYINT(1) NOT NULL DEFAULT 0`
    );
    return true;
  } catch (error) {
    console.error('Error ensuring password_change_locked column:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const hasPasswordLockColumn = await ensurePasswordChangeLockColumn();

    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role === 'census') {
      return NextResponse.json(
        { error: 'Census accounts cannot change passwords here. Contact your administrator.' },
        { status: 403 }
      );
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Get current password hash
    const [users] = await pool.execute<RowDataPacket[]>(
      `SELECT password_hash, ${hasPasswordLockColumn ? 'password_change_locked' : '0 AS password_change_locked'}
       FROM users
       WHERE id = ?`,
      [user.userId]
    );

    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (users[0].password_change_locked) {
      return NextResponse.json(
        { error: 'Password change is disabled by admin for this account' },
        { status: 403 }
      );
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, users[0].password_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await pool.execute(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [hashedPassword, user.userId]
    );

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json(
      { error: 'Failed to change password' },
      { status: 500 }
    );
  }
}
