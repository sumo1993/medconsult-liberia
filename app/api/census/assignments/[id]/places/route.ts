import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';
import { ensureNationalScopeColumn } from '@/lib/census-assignments-schema';
import { getCountyCanonical } from '@/lib/locations/liberia';
import { listAssignmentCounties } from '@/lib/census-assignment-counties';
import { ensureCensusSurveyPlaceRulesTable, PlaceRule } from '@/lib/census-survey-place-rules';

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

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(_request);
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
    await ensureCensusSurveyPlaceRulesTable();
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT id, county, district, community FROM census_survey_place_rules WHERE census_assignment_id = ? ORDER BY id ASC`,
      [surveyId]
    );
    return NextResponse.json({
      survey_id: surveyId,
      places: rows.map((r) => ({
        id: Number(r.id),
        county: String(r.county || ''),
        district: r.district ? String(r.district) : null,
        community: r.community ? String(r.community) : null,
      })),
    });
  } catch (error) {
    console.error('Error fetching place rules:', error);
    return NextResponse.json({ error: 'Failed to fetch place rules' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
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
    const places = body?.places;
    if (!Array.isArray(places)) {
      return NextResponse.json({ error: 'places must be an array' }, { status: 400 });
    }
    await ensureNationalScopeColumn();
    await ensureCensusSurveyPlaceRulesTable();

    const [surveyRows] = await pool.execute<RowDataPacket[]>(
      `SELECT county, COALESCE(national_scope, 0) AS national_scope FROM census_assignments WHERE id = ? LIMIT 1`,
      [surveyId]
    );
    const primaryCounty = getCountyCanonical(String(surveyRows[0]?.county || ''));
    const nationalScope = Boolean(Number(surveyRows[0]?.national_scope ?? 0));
    if (!primaryCounty) {
      return NextResponse.json({ error: 'Survey primary county is invalid' }, { status: 400 });
    }
    const surveyCounties = await listAssignmentCounties(surveyId);
    const allowedCounties = new Set(
      surveyCounties.map((c) => getCountyCanonical(c)).filter((c): c is string => Boolean(c))
    );

    await pool.execute(`DELETE FROM census_survey_place_rules WHERE census_assignment_id = ?`, [surveyId]);

    for (const raw of places as PlaceRule[]) {
      const county = String(raw?.county || '').trim();
      if (!county) continue;
      const ruleCounty = getCountyCanonical(county);
      if (!ruleCounty) {
        return NextResponse.json({ error: `Invalid county in geographic rules: ${county}` }, { status: 400 });
      }
      if (!nationalScope && !allowedCounties.has(ruleCounty)) {
        return NextResponse.json(
          {
            error:
              'Geographic access rules must use a county selected for this survey unless "National / multi-county survey" is enabled. Update counties under Recent surveys first.',
          },
          { status: 400 }
        );
      }
      const district = String(raw?.district || '').trim() || null;
      const community = String(raw?.community || '').trim() || null;
      await pool.execute(
        `INSERT INTO census_survey_place_rules (census_assignment_id, county, district, community) VALUES (?, ?, ?, ?)`,
        [surveyId, ruleCounty, district, community]
      );
    }

    return NextResponse.json({ success: true, survey_id: surveyId });
  } catch (error) {
    console.error('Error saving place rules:', error);
    return NextResponse.json({ error: 'Failed to save place rules' }, { status: 500 });
  }
}
