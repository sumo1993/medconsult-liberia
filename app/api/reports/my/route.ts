import { NextRequest, NextResponse } from 'next/server';
import pool, { IS_POSTGRES } from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';
import { censusFieldAccessDeniedResponse } from '@/lib/census-field-access';
import { ensureReportsTable, parseBool, parsePagination, ReportRecord } from '../_lib';

// GET /api/reports/my
// census sees only own reports
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
    const { page, limit, offset } = parsePagination(searchParams);
    const status = String(searchParams.get('status') || '').trim();
    const surveyType = String(searchParams.get('survey_type') || '').trim().toLowerCase();
    const community = String(searchParams.get('community') || '').trim();
    const county = String(searchParams.get('county') || '').trim();
    const dateFrom = String(searchParams.get('date_from') || '').trim();
    const dateTo = String(searchParams.get('date_to') || '').trim();
    const q = String(searchParams.get('q') || '').trim();
    const isUrgent = parseBool(searchParams.get('is_urgent'));

    const hiddenClause = IS_POSTGRES
      ? '(r.hidden_from_submitter IS NOT TRUE)'
      : '(COALESCE(r.hidden_from_submitter, 0) = 0)';
    let where = `WHERE r.user_id = ? AND ${hiddenClause}`;
    const filterParams: unknown[] = [user.userId];
    const push = (clause: string, value: unknown) => {
      where += ` AND ${clause}`;
      filterParams.push(value);
    };

    if (status) push('r.status = ?', status);
    if (surveyType) push('r.survey_type = ?', surveyType);
    if (community) push('r.community = ?', community);
    if (county) push('r.county = ?', county);
    if (dateFrom) push('r.date_of_visit >= ?', dateFrom);
    if (dateTo) push('r.date_of_visit <= ?', dateTo);
    if (isUrgent !== null) push('r.is_urgent = ?', isUrgent);
    if (q) {
      where += ' AND (LOWER(r.community) LIKE LOWER(?) OR LOWER(r.county) LIKE LOWER(?) OR LOWER(COALESCE(r.district, \'\')) LIKE LOWER(?))';
      const like = `%${q}%`;
      filterParams.push(like, like, like);
    }

    const [rows] = await pool.execute<ReportRecord[]>(
      `SELECT
        r.id,
        r.user_id,
        COALESCE(u.full_name, 'Census User') AS collector_name,
        COALESCE(u.email, '') AS collector_email,
        r.date_of_visit,
        r.county, r.district, r.community, r.location_landmark,
        r.households_surveyed,
        r.malaria_cases, r.fever_cases, r.children_under_5, r.pregnant_women,
        r.notes, r.correction_note, r.gps_lat, r.gps_lng, r.is_urgent, r.status, r.survey_type, r.data, r.created_at, r.updated_at
      FROM reports r
      LEFT JOIN users u ON u.id = r.user_id
      ${where}
      ORDER BY r.created_at DESC, r.id DESC
      LIMIT ? OFFSET ?`,
      [...filterParams, limit, offset]
    );

    const [countRows] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS total
       FROM reports r
       ${where}`,
      filterParams
    );

    const total = Number(countRows[0]?.total || 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return NextResponse.json({
      reports: rows,
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
      },
      filters_applied: {
        status: status || null,
        survey_type: surveyType || null,
        community: community || null,
        county: county || null,
        date_from: dateFrom || null,
        date_to: dateTo || null,
        is_urgent: isUrgent,
        q: q || null,
      },
    });
  } catch (error) {
    console.error('Error fetching my reports:', error);
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}
