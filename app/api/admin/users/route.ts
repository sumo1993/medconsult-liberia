import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';
import { createUser } from '@/lib/auth';

type RoleColumnRow = RowDataPacket & {
  Type?: string;
  type?: string;
  data_type?: string;
  udt_name?: string;
};

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

async function ensureCensusRoleSupported(): Promise<void> {
  try {
    const [roleColumns] = await pool.execute<RoleColumnRow[]>(
      `SHOW COLUMNS FROM users LIKE 'role'`
    );
    const roleType = String(roleColumns[0]?.Type || roleColumns[0]?.type || '').toLowerCase();
    if (roleType.includes('enum(') && !roleType.includes("'census'")) {
      await pool.execute(
        `ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'management', 'client', 'accountant', 'consultant', 'researcher', 'census') NOT NULL DEFAULT 'client'`
      );
      console.log('[Admin Users] Updated MySQL users.role enum to include census');
    }
    return;
  } catch (mysqlPathError) {
    // PostgreSQL or non-MySQL path
    try {
      const [columns] = await pool.execute<RoleColumnRow[]>(
        `SELECT data_type, udt_name
         FROM information_schema.columns
         WHERE table_name = 'users' AND column_name = 'role'
         LIMIT 1`
      );
      const dataType = String(columns[0]?.data_type || '').toLowerCase();
      const udtName = String(columns[0]?.udt_name || '');
      const safeEnumName = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(udtName) ? udtName : '';

      if (dataType === 'user-defined' && safeEnumName) {
        await pool.execute(`ALTER TYPE ${safeEnumName} ADD VALUE IF NOT EXISTS 'census'`);
        console.log('[Admin Users] Updated PostgreSQL enum to include census');
      }
    } catch (pgPathError) {
      console.warn('[Admin Users] Could not auto-update users.role for census:', {
        mysqlPathError,
        pgPathError,
      });
    }
  }
}

async function roleColumnSupportsCensus(): Promise<boolean> {
  try {
    const [roleColumns] = await pool.execute<RoleColumnRow[]>(
      `SHOW COLUMNS FROM users LIKE 'role'`
    );
    const roleType = String(roleColumns[0]?.Type || roleColumns[0]?.type || '').toLowerCase();
    if (!roleType) return true;
    if (roleType.includes('enum(')) {
      return roleType.includes("'census'");
    }
    return true;
  } catch {
    try {
      const [columns] = await pool.execute<RoleColumnRow[]>(
        `SELECT data_type, udt_name
         FROM information_schema.columns
         WHERE table_name = 'users' AND column_name = 'role'
         LIMIT 1`
      );
      const dataType = String(columns[0]?.data_type || '').toLowerCase();
      const udtName = String(columns[0]?.udt_name || '');
      if (dataType !== 'user-defined') return true;
      const [enumRows] = await pool.execute<RowDataPacket[]>(
        `SELECT enumlabel
         FROM pg_enum
         WHERE enumtypid = ?::regtype
         ORDER BY enumsortorder`,
        [udtName]
      );
      return enumRows.some((row) => String((row as RowDataPacket).enumlabel || '') === 'census');
    } catch {
      return true;
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const hasPasswordLockColumn = await ensurePasswordChangeLockColumn();

    // Verify admin access
    const user = await verifyAuth(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all users
    const [users] = await pool.execute<RowDataPacket[]>(
      `SELECT id, email, full_name, role, phone, status, email_verified, created_at, last_login,
              ${hasPasswordLockColumn ? 'password_change_locked' : '0 AS password_change_locked'}
       FROM users
       ORDER BY created_at DESC`
    );

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureCensusRoleSupported();

    // Debug: Check if cookie exists
    const authToken = request.cookies.get('auth-token');
    console.log('Auth token present:', !!authToken);
    console.log('All cookies:', request.cookies.getAll());
    
    // Verify admin access
    const user = await verifyAuth(request);
    console.log('Verified user:', user);
    
    if (!user || user.role !== 'admin') {
      console.log('Authorization failed. User:', user);
      return NextResponse.json(
        { error: 'Unauthorized - Please login as admin' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { email, password, full_name, role, phone } = body;

    // Validate input
    if (!email || !password || !full_name || !role) {
      return NextResponse.json(
        { error: 'Email, password, full name, and role are required' },
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

    const normalizedEmail = String(email).trim().toLowerCase();
    const [existingUsers] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM users WHERE LOWER(email) = ? LIMIT 1',
      [normalizedEmail]
    );
    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: 'Email already exists. Please use a different email.' },
        { status: 400 }
      );
    }

    if (role === 'census') {
      const supported = await roleColumnSupportsCensus();
      if (!supported) {
        return NextResponse.json(
          {
            error: 'Database role column does not include census yet.',
            details:
              "Run: ALTER TABLE users MODIFY COLUMN role ENUM('admin','management','client','accountant','consultant','researcher','census') NOT NULL DEFAULT 'client';",
          },
          { status: 500 }
        );
      }
    }

    // Create user
    const newUser = await createUser(normalizedEmail, password, full_name, role, phone);

    if (!newUser) {
      const [createdRows] = await pool.execute<RowDataPacket[]>(
        'SELECT id, email, full_name, role FROM users WHERE LOWER(email) = ? LIMIT 1',
        [normalizedEmail]
      );
      if (createdRows.length > 0) {
        return NextResponse.json(
          {
            success: true,
            message: 'User created successfully',
            user: createdRows[0],
          },
          { status: 201 }
        );
      }

      if (role === 'census' && !(await roleColumnSupportsCensus())) {
        return NextResponse.json(
          {
            error: 'Database role column does not include census yet.',
            details:
              "Run: ALTER TABLE users MODIFY COLUMN role ENUM('admin','management','client','accountant','consultant','researcher','census') NOT NULL DEFAULT 'client';",
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          error: 'User creation failed due to a database constraint.',
          details: 'Check users table schema and required columns, then retry.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'User created successfully',
        user: newUser,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating user:', error);
    const message =
      error && typeof error === 'object' && 'message' in error
        ? String((error as { message?: unknown }).message || '')
        : 'Unknown error';
    const code =
      error && typeof error === 'object' && 'code' in error
        ? String((error as { code?: unknown }).code || '')
        : '';
    return NextResponse.json(
      {
        error: message || 'Failed to create user',
        ...(code ? { details: `DB_CODE: ${code}` } : {}),
      },
      { status: 500 }
    );
  }
}
