import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAuth } from '@/lib/middleware';
import { ensureReportsTable } from '../_lib';
import { getCensusReportsAccessFlags, isCensusReportsBlockedForRole } from '@/lib/census-reports-access';

const ALLOWED_TARGET_STATUS = ['reviewed', 'needs_correction'] as const;
type TargetStatus = (typeof ALLOWED_TARGET_STATUS)[number];

export async function POST(request: NextRequest) {
  try {
    await ensureReportsTable();
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['researcher', 'admin', 'management'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const accessFlags = await getCensusReportsAccessFlags();
    if (isCensusReportsBlockedForRole(user.role, accessFlags)) {
      return NextResponse.json({ error: 'Access to census reports is temporarily disabled for your role.' }, { status: 403 });
    }

    const body = await request.json();
    const ids = Array.isArray(body?.ids)
      ? body.ids.map((id: unknown) => Number(id)).filter((id: number) => Number.isFinite(id) && id > 0)
      : [];
    const status = String(body?.status || '').trim().toLowerCase() as TargetStatus;
    const correctionNote = typeof body?.correction_note === 'string' ? body.correction_note.trim() : '';

    if (ids.length === 0) {
      return NextResponse.json({ error: 'ids is required' }, { status: 400 });
    }
    if (!ALLOWED_TARGET_STATUS.includes(status)) {
      return NextResponse.json({ error: 'Invalid status target' }, { status: 400 });
    }
    if (status === 'needs_correction' && !correctionNote) {
      return NextResponse.json({ error: 'Please include what to correct.' }, { status: 400 });
    }

    const uniqueIds = [...new Set(ids)];
    const placeholders = uniqueIds.map(() => '?').join(', ');

    await pool.execute(
      `UPDATE reports
       SET status = ?, correction_note = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id IN (${placeholders})
         AND LOWER(status) <> 'withdrawn'`,
      [status, status === 'needs_correction' ? correctionNote : null, ...uniqueIds]
    );

    return NextResponse.json({ success: true, updated_count: uniqueIds.length, status });
  } catch (error) {
    console.error('Error bulk updating report status:', error);
    return NextResponse.json({ error: 'Failed to bulk update report status' }, { status: 500 });
  }
}
