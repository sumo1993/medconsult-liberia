import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';
import { censusFieldAccessDeniedResponse } from '@/lib/census-field-access';
import { ensureReportsTable } from '../_lib';

// GET /api/reports/duplicate?community=&date_of_visit=
// census: check own duplicate by location/date
export async function GET(request: NextRequest) {
  try {
    await ensureReportsTable();
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'census') {
      return NextResponse.json({ error: 'Forbidden - census role required' }, { status: 403 });
    }
    const fieldDenied = await censusFieldAccessDeniedResponse(user);
    if (fieldDenied) return fieldDenied;

    const { searchParams } = new URL(request.url);
    const community = String(searchParams.get('community') || '').trim();
    const dateOfVisit = String(searchParams.get('date_of_visit') || '').trim();
    if (!community || !dateOfVisit) {
      return NextResponse.json({ error: 'community and date_of_visit are required' }, { status: 400 });
    }

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT id, created_at
       FROM reports
       WHERE user_id = ?
         AND LOWER(community) = LOWER(?)
         AND date_of_visit = ?
       ORDER BY created_at DESC, id DESC
       LIMIT 1`,
      [user.userId, community, dateOfVisit]
    );

    return NextResponse.json({
      duplicate_exists: rows.length > 0,
      existing_report: rows.length > 0 ? rows[0] : null,
    });
  } catch (error) {
    console.error('Error checking duplicate report:', error);
    return NextResponse.json({ error: 'Failed to check duplicate report' }, { status: 500 });
  }
}

