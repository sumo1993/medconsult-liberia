import { compare, hash } from 'bcryptjs';
import pool from './db';
import { RowDataPacket } from 'mysql2';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'admin' | 'management' | 'client' | 'accountant' | 'consultant' | 'researcher' | 'census';
  phone?: string;
  status: 'active' | 'inactive' | 'suspended';
  email_verified: boolean;
  created_at: Date;
  last_login?: Date;
}

export async function hashPassword(password: string): Promise<string> {
  return await hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await compare(password, hashedPassword);
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    let rows: RowDataPacket[] = [];
    try {
      const [richRows] = await pool.execute<RowDataPacket[]>(
        'SELECT id, email, full_name, role, phone, status, email_verified, created_at, last_login FROM users WHERE email = ?',
        [email]
      );
      rows = richRows;
    } catch {
      try {
        // Older schema fallback without status/email_verified columns
        const [basicRows] = await pool.execute<RowDataPacket[]>(
          'SELECT id, email, full_name, role, phone, created_at, last_login FROM users WHERE email = ?',
          [email]
        );
        rows = basicRows.map((r) => ({
          ...r,
          status: 'active',
          email_verified: true,
        })) as RowDataPacket[];
      } catch {
        try {
          const [phoneNumberRows] = await pool.execute<RowDataPacket[]>(
            'SELECT id, email, full_name, role, phone_number as phone, created_at, last_login FROM users WHERE email = ?',
            [email]
          );
          rows = phoneNumberRows.map((r) => ({
            ...r,
            status: 'active',
            email_verified: true,
          })) as RowDataPacket[];
        } catch {
          const [minimalRows] = await pool.execute<RowDataPacket[]>(
            'SELECT id, email, full_name, role, created_at, last_login FROM users WHERE email = ?',
            [email]
          );
          rows = minimalRows.map((r) => ({
            ...r,
            phone: '',
            status: 'active',
            email_verified: true,
          })) as RowDataPacket[];
        }
      }
    }

    if (rows.length === 0) return null;
    const user = rows[0] as User;
    return {
      ...user,
      status: (user.status as User['status']) || 'active',
      email_verified: typeof user.email_verified === 'boolean' ? user.email_verified : true,
    };
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

export async function getUserById(id: number): Promise<User | null> {
  try {
    let rows: RowDataPacket[] = [];
    try {
      const [richRows] = await pool.execute<RowDataPacket[]>(
        'SELECT id, email, full_name, role, phone, status, email_verified, created_at, last_login FROM users WHERE id = ?',
        [id]
      );
      rows = richRows;
    } catch {
      try {
        // Older schema fallback without status/email_verified columns
        const [basicRows] = await pool.execute<RowDataPacket[]>(
          'SELECT id, email, full_name, role, phone, created_at, last_login FROM users WHERE id = ?',
          [id]
        );
        rows = basicRows.map((r) => ({
          ...r,
          status: 'active',
          email_verified: true,
        })) as RowDataPacket[];
      } catch {
        try {
          const [phoneNumberRows] = await pool.execute<RowDataPacket[]>(
            'SELECT id, email, full_name, role, phone_number as phone, created_at, last_login FROM users WHERE id = ?',
            [id]
          );
          rows = phoneNumberRows.map((r) => ({
            ...r,
            status: 'active',
            email_verified: true,
          })) as RowDataPacket[];
        } catch {
          const [minimalRows] = await pool.execute<RowDataPacket[]>(
            'SELECT id, email, full_name, role, created_at, last_login FROM users WHERE id = ?',
            [id]
          );
          rows = minimalRows.map((r) => ({
            ...r,
            phone: '',
            status: 'active',
            email_verified: true,
          })) as RowDataPacket[];
        }
      }
    }

    if (rows.length === 0) return null;
    const user = rows[0] as User;
    return {
      ...user,
      status: (user.status as User['status']) || 'active',
      email_verified: typeof user.email_verified === 'boolean' ? user.email_verified : true,
    };
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

export type AuthFailureReason =
  | 'invalid_credentials'
  | 'suspended'
  | 'inactive';

export type AuthenticateResult =
  | { ok: true; user: User }
  | { ok: false; reason: AuthFailureReason };

/**
 * Single DB round-trip for the user row, then password verify.
 * Used by /api/auth/login only — avoids duplicate SELECTs and preserves status-specific errors.
 */
export async function authenticateUser(email: string, password: string): Promise<AuthenticateResult> {
  try {
    const normalizedEmail = email.trim().replace(/\s+/g, '').toLowerCase();
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM users WHERE email = ?',
      [normalizedEmail]
    );

    if (rows.length === 0) {
      return { ok: false, reason: 'invalid_credentials' };
    }

    const user = rows[0];

    if (user.status === 'suspended') {
      return { ok: false, reason: 'suspended' };
    }
    if (user.status === 'inactive') {
      return { ok: false, reason: 'inactive' };
    }
    if (user.status && user.status !== 'active') {
      return { ok: false, reason: 'invalid_credentials' };
    }

    const storedPassword = typeof user.password_hash === 'string' ? user.password_hash : '';
    const legacyPassword = typeof (user as { password?: unknown }).password === 'string'
      ? ((user as { password?: string }).password || '')
      : '';
    const passwordCandidates = [storedPassword, legacyPassword].filter((p) => !!p);

    let isValid = false;
    for (const candidate of passwordCandidates) {
      if (candidate.startsWith('$2a$') || candidate.startsWith('$2b$') || candidate.startsWith('$2y$')) {
        if (await verifyPassword(password, candidate)) {
          isValid = true;
          break;
        }
      }
    }

    if (!isValid) {
      return { ok: false, reason: 'invalid_credentials' };
    }

    void pool
      .execute('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id])
      .catch((err) => console.error('[auth] last_login update failed:', err));

    const userWithoutPassword = { ...user } as Record<string, unknown>;
    delete userWithoutPassword.password_hash;
    return { ok: true, user: userWithoutPassword as User };
  } catch (error: unknown) {
    console.error('Error authenticating user:', error);
    throw error;
  }
}

export async function createUser(
  email: string,
  password: string,
  full_name: string,
  role: 'admin' | 'management' | 'client' | 'accountant' | 'consultant' | 'researcher' | 'census' = 'client',
  phone?: string
): Promise<User | null> {
  try {
    const passwordHash = await hashPassword(password);

    let result: { insertId?: unknown; rowCount?: unknown } | null = null;
    try {
      const [primaryInsert, header] = await pool.execute(
        `INSERT INTO users
         (email, password_hash, full_name, role, phone, average_rating, total_ratings, password_change_locked)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [email, passwordHash, full_name, role, phone || null, 0, 0, false]
      );
      result = (primaryInsert as { insertId?: unknown }) || (header as { insertId?: unknown; rowCount?: unknown });
    } catch (phoneColumnError) {
      const message = String((phoneColumnError as { message?: unknown })?.message || '').toLowerCase();
      const code = String((phoneColumnError as { code?: unknown })?.code || '');
      const isPhoneColumnIssue =
        message.includes("unknown column 'phone'") ||
        message.includes('column "phone"') ||
        code === '42703';

      if (!isPhoneColumnIssue) {
        throw phoneColumnError;
      }

      try {
        const [phoneNumberInsert, header] = await pool.execute(
          `INSERT INTO users
           (email, password_hash, full_name, role, phone_number, average_rating, total_ratings, password_change_locked)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [email, passwordHash, full_name, role, phone || null, 0, 0, false]
        );
        result = (phoneNumberInsert as { insertId?: unknown }) || (header as { insertId?: unknown; rowCount?: unknown });
      } catch (phoneNumberColumnError) {
        const secondMessage = String((phoneNumberColumnError as { message?: unknown })?.message || '').toLowerCase();
        const secondCode = String((phoneNumberColumnError as { code?: unknown })?.code || '');
        const isPhoneNumberColumnIssue =
          secondMessage.includes("unknown column 'phone_number'") ||
          secondMessage.includes('column "phone_number"') ||
          secondCode === '42703';

        if (!isPhoneNumberColumnIssue) {
          throw phoneNumberColumnError;
        }

        const [minimalInsert, header] = await pool.execute(
          `INSERT INTO users
           (email, password_hash, full_name, role, average_rating, total_ratings, password_change_locked)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [email, passwordHash, full_name, role, 0, 0, false]
        );
        result = (minimalInsert as { insertId?: unknown }) || (header as { insertId?: unknown; rowCount?: unknown });
      }
    }

    const userId = Number((result as { insertId?: unknown } | null)?.insertId || 0);
    if (Number.isFinite(userId) && userId > 0) {
      return await getUserById(userId);
    }

    // PostgreSQL path may not expose insertId; recover by email.
    return await getUserByEmail(email);
  } catch (error: unknown) {
    if ((error as { code?: string })?.code === 'ER_DUP_ENTRY') {
      console.error('User already exists');
      return null;
    }
    if ((error as { code?: string })?.code === '23505') {
      // PostgreSQL unique_violation
      console.error('User already exists');
      return null;
    }
    const message = (error as { message?: string })?.message || '';
    if (message.toLowerCase().includes('duplicate key value')) {
      console.error('User already exists');
      return null;
    }
    console.error('Error creating user:', error);
    throw error;
  }
}

export async function logActivity(
  userId: number | null,
  action: string,
  entityType?: string,
  entityId?: number,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    await pool.execute(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, action, entityType || null, entityId || null, ipAddress || null, userAgent || null]
    );
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}
