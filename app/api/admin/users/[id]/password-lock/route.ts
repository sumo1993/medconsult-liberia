import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';

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

// PATCH - Lock/Unlock a user's ability to change password
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const hasPasswordLockColumn = await ensurePasswordChangeLockColumn();
    if (!hasPasswordLockColumn) {
      return NextResponse.json(
        { error: 'Password lock feature is temporarily unavailable' },
        { status: 500 }
      );
    }

    const adminUser = await verifyAuth(request);
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const userId = parseInt(id, 10);
    const { locked } = await request.json();

    if (typeof locked !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request. locked must be boolean.' },
        { status: 400 }
      );
    }

    if (Number.isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });
    }

    if (userId === adminUser.userId) {
      return NextResponse.json(
        { error: 'You cannot lock your own password changes' },
        { status: 400 }
      );
    }

    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE users
       SET password_change_locked = ?
       WHERE id = ?`,
      [locked ? 1 : 0, userId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: locked
        ? 'User password changes are now locked'
        : 'User password changes are now unlocked',
    });
  } catch (error) {
    console.error('Error updating password lock status:', error);
    return NextResponse.json(
      { error: 'Failed to update password lock status' },
      { status: 500 }
    );
  }
}
