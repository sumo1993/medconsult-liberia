import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAuth } from '@/lib/middleware';
import { RowDataPacket } from 'mysql2';

const dbClient = (process.env.DB_CLIENT || '').toLowerCase();
const usePostgres =
  dbClient === 'postgres' ||
  dbClient === 'postgresql' ||
  !!process.env.DATABASE_URL;

async function ensurePresenceTable() {
  if (usePostgres) {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS user_presence (
        user_id INT PRIMARY KEY,
        last_active TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    return;
  }

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS user_presence (
      user_id INT PRIMARY KEY,
      last_active DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

function toIsoOrNull(value: unknown): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export async function POST(request: NextRequest) {
  try {
    await ensurePresenceTable();
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (usePostgres) {
      await pool.execute(
        `INSERT INTO user_presence (user_id, last_active)
         VALUES (?, CURRENT_TIMESTAMP)
         ON CONFLICT (user_id)
         DO UPDATE SET last_active = EXCLUDED.last_active`,
        [user.userId]
      );
    } else {
      await pool.execute(
        `INSERT INTO user_presence (user_id, last_active)
         VALUES (?, NOW())
         ON DUPLICATE KEY UPDATE last_active = VALUES(last_active)`,
        [user.userId]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating presence:', error);
    return NextResponse.json(
      { error: 'Failed to update presence' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await ensurePresenceTable();
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids') || '';
    const ids = Array.from(
      new Set(
        idsParam
          .split(',')
          .map((id) => parseInt(id.trim(), 10))
          .filter((id) => Number.isFinite(id) && id > 0)
      )
    ).slice(0, 200);

    if (ids.length === 0) {
      return NextResponse.json({ presence: {} });
    }

    const placeholders = ids.map(() => '?').join(',');
    const activeExpr = usePostgres
      ? `CASE WHEN up.last_active >= (CURRENT_TIMESTAMP - INTERVAL '90 seconds') THEN TRUE ELSE FALSE END`
      : `CASE WHEN up.last_active >= (NOW() - INTERVAL 90 SECOND) THEN TRUE ELSE FALSE END`;

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT up.user_id, up.last_active, ${activeExpr} AS active
       FROM user_presence up
       WHERE up.user_id IN (${placeholders})`,
      ids
    );

    const presence: Record<number, { active: boolean; last_active: string | null }> = {};
    for (const id of ids) {
      presence[id] = { active: false, last_active: null };
    }

    rows.forEach((row) => {
      const id = Number(row.user_id);
      if (!Number.isFinite(id)) return;
      presence[id] = {
        active: Boolean(row.active),
        last_active: toIsoOrNull(row.last_active),
      };
    });

    return NextResponse.json({ presence });
  } catch (error) {
    console.error('Error fetching presence:', error);
    return NextResponse.json(
      { error: 'Failed to fetch presence' },
      { status: 500 }
    );
  }
}
