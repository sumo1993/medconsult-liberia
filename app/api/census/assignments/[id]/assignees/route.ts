import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';
import { ensureCensusSurveyAssigneesTable } from '@/lib/census-survey-assignees';

async function assertOwnsSurvey(researcherId: number, surveyId: number): Promise<boolean> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id FROM census_assignments WHERE id = ? AND created_by = ? LIMIT 1`,
    [surveyId, researcherId]
  );
  return rows.length > 0;
}

async function assertCanManageSurvey(
  user: { role: string; userId: number },
  surveyId: number
): Promise<boolean> {
  if (['admin', 'management'].includes(user.role)) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT id FROM census_assignments WHERE id = ? LIMIT 1`,
      [surveyId]
    );
    return rows.length > 0;
  }
  return assertOwnsSurvey(user.userId, surveyId);
}

/** GET assignees for a survey. PUT replaces the full assignee list (user ids). Empty list = all census dashboards may use the survey. */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['researcher', 'admin', 'management'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: rawId } = await context.params;
    const surveyId = Number(rawId);
    if (!Number.isFinite(surveyId) || surveyId <= 0) {
      return NextResponse.json({ error: 'Invalid survey id' }, { status: 400 });
    }
    if (!(await assertCanManageSurvey(user, surveyId))) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    await ensureCensusSurveyAssigneesTable();
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT a.user_id, u.full_name, u.email
       FROM census_survey_assignees a
       JOIN users u ON u.id = a.user_id
       WHERE a.census_assignment_id = ?
       ORDER BY u.full_name ASC`,
      [surveyId]
    );
    return NextResponse.json({
      survey_id: surveyId,
      assignees: rows.map((r) => ({
        user_id: Number(r.user_id),
        full_name: String(r.full_name || ''),
        email: String(r.email || ''),
      })),
    });
  } catch (error) {
    console.error('Error fetching assignees:', error);
    return NextResponse.json({ error: 'Failed to fetch assignees' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['researcher', 'admin', 'management'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: rawId } = await context.params;
    const surveyId = Number(rawId);
    if (!Number.isFinite(surveyId) || surveyId <= 0) {
      return NextResponse.json({ error: 'Invalid survey id' }, { status: 400 });
    }
    if (!(await assertCanManageSurvey(user, surveyId))) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    const body = await request.json();
    const rawIds = body?.user_ids;
    if (!Array.isArray(rawIds)) {
      return NextResponse.json({ error: 'user_ids must be an array' }, { status: 400 });
    }
    const userIds = [...new Set(rawIds.map((x) => Math.floor(Number(x))).filter((n) => Number.isFinite(n) && n > 0))];

    await ensureCensusSurveyAssigneesTable();

    if (userIds.length > 0) {
      const [censusRows] = await pool.execute<RowDataPacket[]>(
        `SELECT id FROM users WHERE id IN (${userIds.map(() => '?').join(',')}) AND role = 'census'`,
        userIds
      );
      const valid = new Set(censusRows.map((r) => Number(r.id)));
      const invalid = userIds.filter((id) => !valid.has(id));
      if (invalid.length) {
        return NextResponse.json({ error: `Invalid or non-census user ids: ${invalid.join(', ')}` }, { status: 400 });
      }
    }

    await pool.execute(`DELETE FROM census_survey_assignees WHERE census_assignment_id = ?`, [surveyId]);

    for (const uid of userIds) {
      await pool.execute(
        `INSERT INTO census_survey_assignees (census_assignment_id, user_id) VALUES (?, ?)`,
        [surveyId, uid]
      );
    }

    return NextResponse.json({ success: true, survey_id: surveyId, count: userIds.length });
  } catch (error) {
    console.error('Error saving assignees:', error);
    return NextResponse.json({ error: 'Failed to save assignees' }, { status: 500 });
  }
}
