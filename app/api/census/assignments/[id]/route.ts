import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';
import { ensureCensusSurveyAssigneesTable } from '@/lib/census-survey-assignees';
import { ensureCensusSurveyPlaceRulesTable } from '@/lib/census-survey-place-rules';
import { ensureCensusAssignmentCountiesTable } from '@/lib/census-assignment-counties';
import { ensureReportsTable } from '@/app/api/reports/_lib';
import { isCensusReportsSurveyRole } from '@/lib/census-reports-access';

/** Permanently remove a census survey (assignment). Researchers may delete own; admin/management may delete any. */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isCensusReportsSurveyRole(user.role)) {
      return NextResponse.json({ error: 'Forbidden - researcher, admin, or management role required' }, { status: 403 });
    }

    const { id: rawId } = await context.params;
    const surveyId = Number(rawId);
    if (!Number.isFinite(surveyId) || surveyId <= 0) {
      return NextResponse.json({ error: 'Invalid survey id' }, { status: 400 });
    }

    const [rows] = await pool.execute<RowDataPacket[]>(
      ['admin', 'management'].includes(user.role)
        ? `SELECT id FROM census_assignments WHERE id = ? LIMIT 1`
        : `SELECT id FROM census_assignments WHERE id = ? AND created_by = ? LIMIT 1`,
      ['admin', 'management'].includes(user.role) ? [surveyId] : [surveyId, user.userId]
    );
    if (!rows.length) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    await ensureCensusSurveyAssigneesTable();
    await ensureCensusSurveyPlaceRulesTable();
    await ensureCensusAssignmentCountiesTable();
    await ensureReportsTable();

    await pool.execute(`DELETE FROM census_survey_assignees WHERE census_assignment_id = ?`, [surveyId]);
    await pool.execute(`DELETE FROM census_survey_place_rules WHERE census_assignment_id = ?`, [surveyId]);
    await pool.execute(`DELETE FROM census_assignment_counties WHERE census_assignment_id = ?`, [surveyId]);
    await pool.execute(`UPDATE reports SET census_assignment_id = NULL WHERE census_assignment_id = ?`, [surveyId]);
    if (['admin', 'management'].includes(user.role)) {
      await pool.execute(`DELETE FROM census_assignments WHERE id = ?`, [surveyId]);
    } else {
      await pool.execute(`DELETE FROM census_assignments WHERE id = ? AND created_by = ?`, [surveyId, user.userId]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting census survey:', error);
    return NextResponse.json({ error: 'Failed to delete survey' }, { status: 500 });
  }
}
