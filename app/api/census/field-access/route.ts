import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/middleware';
import {
  getCensusFieldBlockAll,
  listCensusUsersWithBlockFlags,
  setCensusFieldBlockAll,
  setCensusUserFieldBlocked,
} from '@/lib/census-field-access';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

// GET /api/census/field-access — admin: global flag + census users with block status
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const block_all_field = await getCensusFieldBlockAll();
    const users = await listCensusUsersWithBlockFlags();
    return NextResponse.json({ block_all_field, users });
  } catch (e) {
    console.error('census field-access GET:', e);
    return NextResponse.json({ error: 'Failed to load field access' }, { status: 500 });
  }
}

// PUT /api/census/field-access — admin only
export async function PUT(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    if (typeof body?.block_all_field === 'boolean') {
      await setCensusFieldBlockAll(body.block_all_field);
    }

    const uid = Number(body?.user_id);
    if (body && typeof body.field_blocked === 'boolean' && Number.isFinite(uid) && uid > 0) {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT id FROM users WHERE id = ? AND role = 'census' LIMIT 1`,
        [uid]
      );
      if (!rows.length) {
        return NextResponse.json({ error: 'Not a census user' }, { status: 400 });
      }
      await setCensusUserFieldBlocked(uid, body.field_blocked);
    }

    const block_all_field = await getCensusFieldBlockAll();
    const users = await listCensusUsersWithBlockFlags();
    return NextResponse.json({ success: true, block_all_field, users });
  } catch (e) {
    console.error('census field-access PUT:', e);
    return NextResponse.json({ error: 'Failed to update field access' }, { status: 500 });
  }
}
