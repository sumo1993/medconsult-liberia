import { NextRequest, NextResponse } from 'next/server';
import pool, { IS_POSTGRES } from '@/lib/db';
import { verifyAuth } from '@/lib/middleware';
import bcrypt from 'bcryptjs';

async function ensurePasswordColumns(): Promise<boolean> {
  try {
    if (IS_POSTGRES) {
      await pool.execute(
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS password_change_locked BOOLEAN NOT NULL DEFAULT FALSE`
      );
      await pool.execute(
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP NULL`
      );
    } else {
      const [cols1] = await pool.execute<any[]>(`SHOW COLUMNS FROM users LIKE 'password_change_locked'`);
      if ((cols1 as any[]).length === 0) {
        await pool.execute(`ALTER TABLE users ADD COLUMN password_change_locked TINYINT(1) NOT NULL DEFAULT 0`);
      }
      const [cols2] = await pool.execute<any[]>(`SHOW COLUMNS FROM users LIKE 'password_changed_at'`);
      if ((cols2 as any[]).length === 0) {
        await pool.execute(`ALTER TABLE users ADD COLUMN password_changed_at TIMESTAMP NULL`);
      }
    }
    return true;
  } catch (error) {
    console.warn('[Change Password] ensurePasswordColumns warning:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const hasPasswordCols = await ensurePasswordColumns();

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
      return NextResponse.json({ error: 'Current password and new password are required' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters long' }, { status: 400 });
    }

    const [users] = await pool.execute<any[]>(
      `SELECT password_hash, ${hasPasswordCols ? 'password_change_locked' : 'FALSE AS password_change_locked'}
       FROM users WHERE id = ?`,
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

    const isValid = await bcrypt.compare(currentPassword, users[0].password_hash);
    if (!isValid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password and record when it was changed
    if (hasPasswordCols) {
      await pool.execute(
        'UPDATE users SET password_hash = ?, password_changed_at = ? WHERE id = ?',
        [hashedPassword, new Date().toISOString(), user.userId]
      );
    } else {
      await pool.execute(
        'UPDATE users SET password_hash = ? WHERE id = ?',
        [hashedPassword, user.userId]
      );
    }

    return NextResponse.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json({ error: 'Failed to change password' }, { status: 500 });
  }
}
