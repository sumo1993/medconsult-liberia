import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';

type CensusUserRow = RowDataPacket & {
  id: number;
  full_name: string;
  email: string;
};

/** List census-role accounts so researchers can assign surveys to specific dashboards. */
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['researcher', 'admin', 'management'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const q = String(searchParams.get('q') || '').trim().toLowerCase();
    const limit = Math.min(200, Math.max(1, Number(searchParams.get('limit') || 100)));

    let sql = `SELECT id, full_name, email FROM users WHERE role = 'census'`;
    const params: unknown[] = [];
    if (q) {
      sql += ` AND (LOWER(COALESCE(full_name, '')) LIKE ? OR LOWER(COALESCE(email, '')) LIKE ?)`;
      const like = `%${q}%`;
      params.push(like, like);
    }
    sql += ` ORDER BY full_name ASC, id ASC LIMIT ?`;
    params.push(limit);

    const [rows] = await pool.execute<CensusUserRow[]>(sql, params);
    return NextResponse.json({ users: rows });
  } catch (error) {
    console.error('Error listing census users:', error);
    return NextResponse.json({ error: 'Failed to list census users' }, { status: 500 });
  }
}
