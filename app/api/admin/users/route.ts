import { NextRequest, NextResponse } from 'next/server';
import pool, { IS_POSTGRES } from '@/lib/db';
import { verifyAuth } from '@/lib/middleware';
import { createUser } from '@/lib/auth';

/** Add password_change_locked + password_changed_at columns if they don't exist. */
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
        await pool.execute(
          `ALTER TABLE users ADD COLUMN password_change_locked TINYINT(1) NOT NULL DEFAULT 0`
        );
      }
      const [cols2] = await pool.execute<any[]>(`SHOW COLUMNS FROM users LIKE 'password_changed_at'`);
      if ((cols2 as any[]).length === 0) {
        await pool.execute(`ALTER TABLE users ADD COLUMN password_changed_at TIMESTAMP NULL`);
      }
    }
    return true;
  } catch (error) {
    console.warn('[Admin Users] ensurePasswordColumns warning:', error);
    return false;
  }
}

async function ensureCensusRoleSupported(): Promise<void> {
  try {
    if (IS_POSTGRES) {
      // For Postgres with VARCHAR role column, nothing to do — any string is accepted.
      // If it's an enum, try to add the value.
      try {
        const [columns] = await pool.execute<any[]>(
          `SELECT data_type, udt_name FROM information_schema.columns
           WHERE table_name = 'users' AND column_name = 'role' LIMIT 1`
        );
        const row = columns[0] || {};
        const dataType = String(row.data_type || '').toLowerCase();
        const udtName = String(row.udt_name || '');
        const safeEnumName = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(udtName) ? udtName : '';
        if (dataType === 'user-defined' && safeEnumName) {
          await pool.execute(`ALTER TYPE ${safeEnumName} ADD VALUE IF NOT EXISTS 'census'`);
        }
      } catch {
        // ignore
      }
      return;
    }
    // MySQL path
    const [roleColumns] = await pool.execute<any[]>(`SHOW COLUMNS FROM users LIKE 'role'`);
    const roleType = String(roleColumns[0]?.Type || roleColumns[0]?.type || '').toLowerCase();
    if (roleType.includes('enum(') && !roleType.includes("'census'")) {
      await pool.execute(
        `ALTER TABLE users MODIFY COLUMN role ENUM('admin','management','client','accountant','consultant','researcher','census') NOT NULL DEFAULT 'client'`
      );
    }
  } catch (e) {
    console.warn('[Admin Users] ensureCensusRoleSupported warning:', e);
  }
}

export async function GET(request: NextRequest) {
  try {
    const hasPasswordCols = await ensurePasswordColumns();

    const user = await verifyAuth(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [users] = await pool.execute<any[]>(
      `SELECT id, email, full_name, role,
              COALESCE(phone_number, phone, '') AS phone,
              status, created_at, last_login,
              ${hasPasswordCols ? 'password_change_locked' : 'FALSE AS password_change_locked'},
              ${hasPasswordCols ? 'password_changed_at' : 'NULL AS password_changed_at'}
       FROM users
       ORDER BY created_at DESC`
    );

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureCensusRoleSupported();

    const user = await verifyAuth(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Please login as admin' }, { status: 401 });
    }

    const body = await request.json();
    const { email, password, full_name, role, phone } = body;

    if (!email || !password || !full_name || !role) {
      return NextResponse.json(
        { error: 'Email, password, full name, and role are required' },
        { status: 400 }
      );
    }

    if (!['admin', 'management', 'client', 'accountant', 'consultant', 'researcher', 'census'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const [existingUsers] = await pool.execute<any[]>(
      'SELECT id FROM users WHERE LOWER(email) = ? LIMIT 1',
      [normalizedEmail]
    );
    if (existingUsers.length > 0) {
      return NextResponse.json({ error: 'Email already exists. Please use a different email.' }, { status: 400 });
    }

    const newUser = await createUser(normalizedEmail, password, full_name, role, phone);

    if (!newUser) {
      const [createdRows] = await pool.execute<any[]>(
        'SELECT id, email, full_name, role FROM users WHERE LOWER(email) = ? LIMIT 1',
        [normalizedEmail]
      );
      if (createdRows.length > 0) {
        return NextResponse.json({ success: true, message: 'User created successfully', user: createdRows[0] }, { status: 201 });
      }
      return NextResponse.json({ error: 'User creation failed due to a database constraint.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'User created successfully', user: newUser }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message || 'Failed to create user' }, { status: 500 });
  }
}
