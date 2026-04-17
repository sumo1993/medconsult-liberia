import { NextResponse } from 'next/server';
import pool, { IS_POSTGRES } from '@/lib/db';
import type { RowDataPacket } from 'mysql2';
import type { AuthUser } from '@/lib/middleware';

let ensurePromise: Promise<void> | null = null;

/** Global kill-switch + per-user blocks for `/dashboard/field` (role census). */
async function ensureCensusFieldAccessTables(): Promise<void> {
  if (ensurePromise) {
    await ensurePromise;
    return;
  }
  ensurePromise = (async () => {
    if (IS_POSTGRES) {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS census_field_access (
          id SMALLINT PRIMARY KEY CHECK (id = 1),
          block_all BOOLEAN NOT NULL DEFAULT FALSE,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await pool.execute(`
        INSERT INTO census_field_access (id, block_all)
        VALUES (1, FALSE)
        ON CONFLICT (id) DO NOTHING
      `);
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS census_field_blocked_users (
          user_id INTEGER PRIMARY KEY,
          blocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } else {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS census_field_access (
          id TINYINT PRIMARY KEY,
          block_all TINYINT(1) NOT NULL DEFAULT 0,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      await pool.execute(`
        INSERT IGNORE INTO census_field_access (id, block_all)
        VALUES (1, 0)
      `);
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS census_field_blocked_users (
          user_id INT PRIMARY KEY,
          blocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
    }
  })();
  return ensurePromise;
}

export async function getCensusFieldBlockAll(): Promise<boolean> {
  await ensureCensusFieldAccessTables();
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT block_all FROM census_field_access WHERE id = 1 LIMIT 1`
  );
  return Boolean(Number(rows[0]?.block_all ?? 0));
}

export async function setCensusFieldBlockAll(block: boolean): Promise<void> {
  await ensureCensusFieldAccessTables();
  await pool.execute(`UPDATE census_field_access SET block_all = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1`, [
    block ? 1 : 0,
  ]);
}

export async function isUserInCensusFieldBlockList(userId: number): Promise<boolean> {
  await ensureCensusFieldAccessTables();
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT 1 FROM census_field_blocked_users WHERE user_id = ? LIMIT 1`,
    [userId]
  );
  return rows.length > 0;
}

export async function setCensusUserFieldBlocked(userId: number, blocked: boolean): Promise<void> {
  await ensureCensusFieldAccessTables();
  if (blocked) {
    if (IS_POSTGRES) {
      await pool.execute(
        `INSERT INTO census_field_blocked_users (user_id) VALUES (?)
         ON CONFLICT (user_id) DO UPDATE SET blocked_at = CURRENT_TIMESTAMP`,
        [userId]
      );
    } else {
      await pool.execute(
        `INSERT INTO census_field_blocked_users (user_id) VALUES (?)
         ON DUPLICATE KEY UPDATE blocked_at = CURRENT_TIMESTAMP`,
        [userId]
      );
    }
  } else {
    await pool.execute(`DELETE FROM census_field_blocked_users WHERE user_id = ?`, [userId]);
  }
}

/** True if this census account cannot use field dashboard APIs. */
export async function isCensusFieldBlocked(userId: number, role: string): Promise<boolean> {
  if (role !== 'census') return false;
  await ensureCensusFieldAccessTables();
  if (await getCensusFieldBlockAll()) return true;
  return isUserInCensusFieldBlockList(userId);
}

export async function censusFieldAccessDeniedResponse(user: AuthUser): Promise<NextResponse | null> {
  if (user.role !== 'census') return null;
  if (await isCensusFieldBlocked(user.userId, user.role)) {
    return NextResponse.json(
      {
        error: 'Your census field dashboard access has been disabled. Contact an administrator.',
        code: 'census_field_blocked',
      },
      { status: 403 }
    );
  }
  return null;
}

export type CensusFieldUserRow = { id: number; full_name: string; email: string; field_blocked: boolean };

export async function listCensusUsersWithBlockFlags(): Promise<CensusFieldUserRow[]> {
  await ensureCensusFieldAccessTables();
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT u.id, u.full_name, u.email,
            CASE WHEN b.user_id IS NULL THEN 0 ELSE 1 END AS field_blocked
     FROM users u
     LEFT JOIN census_field_blocked_users b ON b.user_id = u.id
     WHERE u.role = 'census'
     ORDER BY u.full_name ASC, u.id ASC`
  );
  return rows.map((r) => ({
    id: Number(r.id),
    full_name: String(r.full_name || ''),
    email: String(r.email || ''),
    field_blocked: Boolean(Number(r.field_blocked ?? 0)),
  }));
}
