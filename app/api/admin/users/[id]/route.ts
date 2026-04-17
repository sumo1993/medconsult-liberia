import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';
import bcrypt from 'bcryptjs';

type RoleColumnRow = {
  Type?: string;
  type?: string;
  data_type?: string;
  udt_name?: string;
};

async function ensureCensusRoleSupported(): Promise<void> {
  try {
    const [roleColumns] = await pool.execute<RoleColumnRow[]>(
      `SHOW COLUMNS FROM users LIKE 'role'`
    );
    const roleType = String(roleColumns?.[0]?.Type || roleColumns?.[0]?.type || '').toLowerCase();
    if (roleType.includes('enum(') && !roleType.includes("'census'")) {
      await pool.execute(
        `ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'management', 'client', 'accountant', 'consultant', 'researcher', 'census') NOT NULL DEFAULT 'client'`
      );
      console.log('[Admin Users Update] Updated MySQL users.role enum to include census');
    }
    return;
  } catch (mysqlPathError) {
    try {
      const [columns] = await pool.execute<RoleColumnRow[]>(
        `SELECT data_type, udt_name
         FROM information_schema.columns
         WHERE table_name = 'users' AND column_name = 'role'
         LIMIT 1`
      );
      const row = (columns[0] || {}) as RoleColumnRow;
      const dataType = String(row.data_type || '').toLowerCase();
      const udtName = String(row.udt_name || '');
      const safeEnumName = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(udtName) ? udtName : '';
      if (dataType === 'user-defined' && safeEnumName) {
        await pool.execute(`ALTER TYPE ${safeEnumName} ADD VALUE IF NOT EXISTS 'census'`);
        console.log('[Admin Users Update] Updated PostgreSQL enum to include census');
      }
    } catch (pgPathError) {
      console.warn('[Admin Users Update] Could not auto-update users.role for census:', {
        mysqlPathError,
        pgPathError,
      });
    }
  }
}

// PUT - Update user
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await ensureCensusRoleSupported();

    const user = await verifyAuth(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const userId = parseInt(id);
    
    const body = await request.json();
    const { full_name, role, password } = body;
    console.log('[API] Updating user ID:', userId);
    console.log('[API] Request body:', JSON.stringify(body));
    console.log('[API] Extracted data:', { full_name, role, hasPassword: !!password });

    // Validate required fields
    if (!full_name || !role) {
      return NextResponse.json(
        { error: 'Full name and role are required' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['admin', 'management', 'client', 'accountant', 'consultant', 'researcher', 'census'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Build update query
    let updateQuery = 'UPDATE users SET full_name = ?, role = ?';
    const queryParams: unknown[] = [full_name, role];

    // If password is provided, hash and include it
    if (password && password.length >= 8) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateQuery += ', password_hash = ?';
      queryParams.push(hashedPassword);
    }

    updateQuery += ' WHERE id = ?';
    queryParams.push(userId);

    // Update user
    console.log('[API] Update query:', updateQuery);
    console.log('[API] Query params:', queryParams.map((p, i) => i === queryParams.length - 1 ? `userId: ${p}` : p));
    
    const [result] = await pool.execute<ResultSetHeader>(updateQuery, queryParams);
    console.log('[API] Update result:', { affectedRows: result.affectedRows, changedRows: result.changedRows });

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify the update worked
    const [updatedUser] = await pool.execute<RowDataPacket[]>('SELECT id, full_name, role FROM users WHERE id = ?', [userId]);
    console.log('[API] User after update:', updatedUser[0]);

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser[0],
    });
  } catch (error) {
    console.error('Error updating user:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', errorMessage);
    return NextResponse.json(
      { 
        error: 'Failed to update user',
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete user
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

    // Prevent admin from deleting their own account
    if (userId === user.userId) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 400 }
      );
    }

    // Delete user
    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM users WHERE id = ?',
      [userId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
