import { NextRequest, NextResponse } from 'next/server';
import pool, { IS_POSTGRES } from '@/lib/db';
import { verifyAuth } from '@/lib/middleware';
import bcrypt from 'bcryptjs';

// PUT - Update user (admin only)
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const userId = parseInt(id);
    const body = await request.json();
    const { full_name, email, role, phone, password } = body;

    if (!full_name || !role) {
      return NextResponse.json({ error: 'Full name and role are required' }, { status: 400 });
    }

    if (!['admin', 'management', 'client', 'accountant', 'consultant', 'researcher', 'census'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Validate and check for email conflicts if email is being changed
    if (email) {
      const normalizedEmail = String(email).trim().toLowerCase();
      const [existing] = await pool.execute<any[]>(
        'SELECT id FROM users WHERE LOWER(email) = ? AND id != ? LIMIT 1',
        [normalizedEmail, userId]
      );
      if (existing.length > 0) {
        return NextResponse.json({ error: 'That email address is already used by another account' }, { status: 400 });
      }
    }

    // Determine which phone column exists
    let phoneColumn = 'phone_number';
    try {
      const [cols] = await pool.execute<any[]>(
        IS_POSTGRES
          ? `SELECT column_name FROM information_schema.columns
             WHERE table_name='users' AND column_name IN ('phone_number','phone') LIMIT 2`
          : `SELECT COLUMN_NAME as column_name FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_NAME='users' AND COLUMN_NAME IN ('phone_number','phone') LIMIT 2`
      );
      const names = (cols as any[]).map((r) => String(r.column_name || '').toLowerCase());
      if (names.includes('phone_number')) phoneColumn = 'phone_number';
      else if (names.includes('phone')) phoneColumn = 'phone';
    } catch {
      phoneColumn = 'phone_number';
    }

    const setClauses: string[] = ['full_name = ?', 'role = ?', `${phoneColumn} = ?`];
    const queryParams: unknown[] = [full_name, role, phone || null];

    if (email) {
      setClauses.push('email = ?');
      queryParams.push(String(email).trim().toLowerCase());
    }

    if (password && password.length >= 6) {
      const hashedPassword = await bcrypt.hash(password, 10);
      setClauses.push('password_hash = ?');
      queryParams.push(hashedPassword);
      // Track when password was changed
      setClauses.push('password_changed_at = ?');
      queryParams.push(new Date().toISOString());
    }

    queryParams.push(userId);
    const updateQuery = `UPDATE users SET ${setClauses.join(', ')} WHERE id = ?`;

    const [, meta] = await pool.execute(updateQuery, queryParams);

    if ((meta as any).affectedRows === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const [updatedUser] = await pool.execute<any[]>(
      `SELECT id, email, full_name, role, COALESCE(phone_number, phone, '') AS phone FROM users WHERE id = ?`,
      [userId]
    );

    return NextResponse.json({
      success: true,
      message: password ? 'User updated and password changed successfully' : 'User updated successfully',
      user: updatedUser[0],
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete user (admin only)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const userId = parseInt(id);

    if (userId === user.userId) {
      return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 });
    }

    const [, meta] = await pool.execute('DELETE FROM users WHERE id = ?', [userId]);

    if ((meta as any).affectedRows === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
