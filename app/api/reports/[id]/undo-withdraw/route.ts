import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAuth } from '@/lib/middleware';
import { censusFieldAccessDeniedResponse } from '@/lib/census-field-access';
import { ensureReportsTable, ReportRecord } from '../../_lib';

const UNDO_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await ensureReportsTable();
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'census') {
      return NextResponse.json({ error: 'Forbidden - census role required' }, { status: 403 });
    }
    const fieldDenied = await censusFieldAccessDeniedResponse(user);
    if (fieldDenied) return fieldDenied;

    const { id } = await context.params;
    const reportId = Number(id);
    if (!Number.isFinite(reportId) || reportId <= 0) {
      return NextResponse.json({ error: 'Invalid report id' }, { status: 400 });
    }

    const [rows] = await pool.execute<ReportRecord[]>(
      `SELECT id, user_id, status, updated_at
       FROM reports
       WHERE id = ?
       LIMIT 1`,
      [reportId]
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const report = rows[0];
    if (Number(report.user_id) !== user.userId) {
      return NextResponse.json({ error: 'Forbidden - cannot modify this report' }, { status: 403 });
    }
    if (String(report.status).toLowerCase() !== 'withdrawn') {
      return NextResponse.json({ error: 'Only withdrawn reports can be restored' }, { status: 409 });
    }

    const updatedAt = new Date(String(report.updated_at || ''));
    if (!Number.isFinite(updatedAt.getTime())) {
      return NextResponse.json({ error: 'Cannot validate undo window for this report' }, { status: 409 });
    }

    if (Date.now() - updatedAt.getTime() > UNDO_WINDOW_MS) {
      return NextResponse.json(
        { error: 'Undo window expired. You can only restore within 5 minutes.' },
        { status: 409 }
      );
    }

    await pool.execute(
      `UPDATE reports
       SET status = 'submitted', updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [reportId, user.userId]
    );

    return NextResponse.json({ success: true, restored: true });
  } catch (error) {
    console.error('Error restoring withdrawn report:', error);
    return NextResponse.json({ error: 'Failed to restore report' }, { status: 500 });
  }
}

