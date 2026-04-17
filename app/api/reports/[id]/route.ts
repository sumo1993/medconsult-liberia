import { NextRequest, NextResponse } from 'next/server';
import pool, { IS_POSTGRES } from '@/lib/db';
import { verifyAuth } from '@/lib/middleware';
import {
  ensureReportsTable,
  ReportRecord,
  toNonNegativeInt,
  toNullableNumber,
  NON_MALARIA_SURVEY_TYPES,
  SurveyType,
} from '../_lib';
import { getCountyCanonical, isCoordinateInLiberia, isValidDistrictForCounty } from '@/lib/locations/liberia';
import { recordCommunityFromReport } from '@/lib/community-catalog';
import { getCountyIdByName, getDistrictIdByName, findOrCreateCommunity } from '@/lib/locations/location-db';
import { validateCensusAssignmentForReport } from '@/lib/census-assignments-schema';
import { getCensusReportsAccessFlags, isCensusReportsBlockedForRole } from '@/lib/census-reports-access';
import { censusFieldAccessDeniedResponse } from '@/lib/census-field-access';

const URGENT_MALARIA_THRESHOLD = 10;
const MAX_NUMERIC_VALUE = 10000;
const MAX_SURVEY_COUNT_VALUE = 100000;
const WASH_WATER_SOURCE_OPTIONS = ['well', 'river', 'piped', 'borehole', 'rainwater', 'spring', 'vendor'] as const;
const WASH_TOILET_TYPE_OPTIONS = ['pit_latrine', 'flush', 'none', 'vip_latrine', 'composting'] as const;

type JsonObject = Record<string, unknown>;

function normalizeSurveyType(raw: unknown): SurveyType | null {
  const value = String(raw || '').trim().toLowerCase();
  if (!value || value === 'malaria') return 'malaria';
  if (NON_MALARIA_SURVEY_TYPES.includes(value as SurveyType)) return value as SurveyType;
  if (value === 'outbreak') return 'outbreak';
  return null;
}

function asNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function asBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return null;
}

function validateCountField(name: string, value: unknown): string | null {
  const n = asNumber(value);
  if (n === null) return `${name} is required`;
  if (n < 0) return `${name} must be >= 0`;
  if (n > MAX_SURVEY_COUNT_VALUE) return `${name} is too high`;
  return null;
}

function validateNonMalariaData(surveyType: SurveyType, data: unknown): string | null {
  if (surveyType === 'malaria') return null;
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return 'data must be a JSON object for non-malaria surveys';
  }
  const payload = data as JsonObject;

  switch (surveyType) {
    case 'health': {
      const checks = [
        validateCountField('diarrhea_cases', payload.diarrhea_cases),
        validateCountField('respiratory_cases', payload.respiratory_cases),
        validateCountField('fever_cases', payload.fever_cases),
        validateCountField('clinic_visits', payload.clinic_visits),
      ].filter(Boolean);
      if (checks.length > 0) return checks[0] as string;
      return null;
    }
    case 'maternal_child_health': {
      const checks = [
        validateCountField('pregnant_women', payload.pregnant_women),
        validateCountField('antenatal_visits', payload.antenatal_visits),
        validateCountField('facility_births', payload.facility_births),
        validateCountField('home_births', payload.home_births),
      ].filter(Boolean);
      if (checks.length > 0) return checks[0] as string;
      return null;
    }
    case 'wash': {
      const waterSource = String(payload.water_source || '').trim().toLowerCase();
      const toiletType = String(payload.toilet_type || '').trim().toLowerCase();
      const handwashingAvailable = asBoolean(payload.handwashing_available);
      if (!waterSource) return 'wash data requires water_source';
      if (!WASH_WATER_SOURCE_OPTIONS.includes(waterSource as (typeof WASH_WATER_SOURCE_OPTIONS)[number])) {
        return `water_source must be one of: ${WASH_WATER_SOURCE_OPTIONS.join(', ')}`;
      }
      if (!toiletType) return 'wash data requires toilet_type';
      if (!WASH_TOILET_TYPE_OPTIONS.includes(toiletType as (typeof WASH_TOILET_TYPE_OPTIONS)[number])) {
        return `toilet_type must be one of: ${WASH_TOILET_TYPE_OPTIONS.join(', ')}`;
      }
      if (handwashingAvailable === null) return 'wash data requires handwashing_available boolean';
      return null;
    }
    case 'nutrition': {
      const childrenScreened = asNumber(payload.children_screened);
      const malnourishedChildren = asNumber(payload.malnourished_children);
      const householdsWithFoodShortage = asNumber(payload.households_with_food_shortage);
      if (childrenScreened === null || childrenScreened < 0 || childrenScreened > MAX_SURVEY_COUNT_VALUE) {
        return 'nutrition data requires children_screened >= 0';
      }
      if (malnourishedChildren === null || malnourishedChildren < 0 || malnourishedChildren > MAX_SURVEY_COUNT_VALUE) {
        return 'nutrition data requires malnourished_children >= 0';
      }
      if (householdsWithFoodShortage === null || householdsWithFoodShortage < 0 || householdsWithFoodShortage > MAX_SURVEY_COUNT_VALUE) {
        return 'nutrition data requires households_with_food_shortage >= 0';
      }
      if (malnourishedChildren > childrenScreened) return 'nutrition data requires malnourished_children <= children_screened';
      return null;
    }
    case 'outbreak': {
      const suspectedCases = asNumber(payload.suspected_cases);
      const symptoms = String(payload.symptoms || '').trim();
      if (suspectedCases === null || suspectedCases < 0) return 'outbreak data requires suspected_cases >= 0';
      if (!symptoms) return 'outbreak data requires symptoms';
      return null;
    }
    default:
      return 'Unsupported survey_type';
  }
}

function normalizeNonMalariaData(surveyType: SurveyType, data: JsonObject): JsonObject {
  if (surveyType === 'health') {
    return {
      diarrhea_cases: Number(data.diarrhea_cases) || 0,
      respiratory_cases: Number(data.respiratory_cases) || 0,
      fever_cases: Number(data.fever_cases) || 0,
      clinic_visits: Number(data.clinic_visits) || 0,
    };
  }
  if (surveyType === 'maternal_child_health') {
    return {
      pregnant_women: Number(data.pregnant_women) || 0,
      antenatal_visits: Number(data.antenatal_visits) || 0,
      facility_births: Number(data.facility_births) || 0,
      home_births: Number(data.home_births) || 0,
    };
  }
  if (surveyType === 'wash') {
    return {
      water_source: String(data.water_source || '').trim().toLowerCase(),
      toilet_type: String(data.toilet_type || '').trim().toLowerCase(),
      handwashing_available: data.handwashing_available === true,
    };
  }
  if (surveyType === 'nutrition') {
    return {
      children_screened: Number(data.children_screened) || 0,
      malnourished_children: Number(data.malnourished_children) || 0,
      households_with_food_shortage: Number(data.households_with_food_shortage) || 0,
    };
  }
  return data;
}

// GET /api/reports/:id
// census can only view own report; researcher can view any report
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await ensureReportsTable();
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['census', 'researcher', 'admin', 'management'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (['researcher', 'admin', 'management'].includes(user.role)) {
      const flags = await getCensusReportsAccessFlags();
      if (isCensusReportsBlockedForRole(user.role, flags)) {
        return NextResponse.json({ error: 'Access to census reports is temporarily disabled for your role.' }, { status: 403 });
      }
    } else {
      const fieldDenied = await censusFieldAccessDeniedResponse(user);
      if (fieldDenied) return fieldDenied;
    }

    const { id } = await context.params;
    const reportId = Number(id);
    if (!Number.isFinite(reportId) || reportId <= 0) {
      return NextResponse.json({ error: 'Invalid report id' }, { status: 400 });
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
        r.notes, r.correction_note, r.gps_lat, r.gps_lng, r.is_urgent, r.status, r.survey_type, r.data, r.census_assignment_id, r.created_at, r.updated_at
      FROM reports r
      LEFT JOIN users u ON u.id = r.user_id
      WHERE r.id = ?
      LIMIT 1`,
      [reportId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const report = rows[0];
    if (user.role === 'census' && Number(report.user_id) !== user.userId) {
      return NextResponse.json({ error: 'Forbidden - cannot access this report' }, { status: 403 });
    }

    return NextResponse.json({ report });
  } catch (error) {
    console.error('Error fetching report by id:', error);
    return NextResponse.json({ error: 'Failed to fetch report' }, { status: 500 });
  }
}

// PUT /api/reports/:id
// census can update own reports (submitted only)
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await ensureReportsTable();
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['census', 'researcher', 'admin', 'management'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden - census or researcher role required' }, { status: 403 });
    }

    if (['researcher', 'admin', 'management'].includes(user.role)) {
      const flags = await getCensusReportsAccessFlags();
      if (isCensusReportsBlockedForRole(user.role, flags)) {
        return NextResponse.json({ error: 'Access to census reports is temporarily disabled for your role.' }, { status: 403 });
      }
    } else {
      const fieldDenied = await censusFieldAccessDeniedResponse(user);
      if (fieldDenied) return fieldDenied;
    }

    const { id } = await context.params;
    const reportId = Number(id);
    if (!Number.isFinite(reportId) || reportId <= 0) {
      return NextResponse.json({ error: 'Invalid report id' }, { status: 400 });
    }

    const [existingRows] = await pool.execute<ReportRecord[]>(
      `SELECT id, user_id, date_of_visit, county, district, community, electoral_district, location_landmark, households_surveyed,
              malaria_cases, fever_cases, children_under_5, pregnant_women, notes,
              correction_note, gps_lat, gps_lng, is_urgent, status, survey_type, data, census_assignment_id
       FROM reports
       WHERE id = ?
       LIMIT 1`,
      [reportId]
    );

    if (existingRows.length === 0) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const existing = existingRows[0];
    if (user.role === 'census' && Number(existing.user_id) !== user.userId) {
      return NextResponse.json({ error: 'Forbidden - cannot edit this report' }, { status: 403 });
    }
    if (user.role === 'census' && !['submitted', 'needs_correction'].includes(String(existing.status).toLowerCase())) {
      return NextResponse.json({ error: 'Only submitted or needs-correction reports can be edited' }, { status: 409 });
    }

    const body = await request.json();
    const statusOnlyPatch =
      ['researcher', 'admin', 'management'].includes(user.role) &&
      body &&
      typeof body === 'object' &&
      Object.keys(body).every((key) => key === 'status' || key === 'correction_note');

    if (statusOnlyPatch) {
      const statusValueRaw = String(body?.status || '').trim().toLowerCase();
      const allowedStatuses = ['submitted', 'reviewed', 'needs_correction', 'withdrawn'];
      const statusValue = allowedStatuses.includes(statusValueRaw) ? statusValueRaw : null;
      if (!statusValue) {
        return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
      }
      const correctionNoteRaw = typeof body?.correction_note === 'string' ? body.correction_note.trim() : '';
      if (statusValue === 'needs_correction' && !correctionNoteRaw) {
        return NextResponse.json({ error: 'Please include what to correct.' }, { status: 400 });
      }
      const nextCorrectionNote = statusValue === 'needs_correction' ? correctionNoteRaw : null;

      await pool.execute(
        `UPDATE reports
         SET status = ?, correction_note = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [statusValue, nextCorrectionNote, reportId]
      );
      return NextResponse.json({ success: true });
    }

    const lockedAssignmentId = Number(existing.census_assignment_id || 0);
    const censusSurveyFieldLock = user.role === 'census' && lockedAssignmentId > 0;

    const dateOfVisit = String(body?.date_of_visit || existing.date_of_visit || '').trim();
    const locationLandmark =
      typeof body?.location_landmark === 'string'
        ? body.location_landmark.trim().slice(0, 500)
        : String(existing.location_landmark || '').trim();
    const notes = typeof body?.notes === 'string' ? body.notes.trim() : String(existing.notes || '').trim();
    const surveyType = censusSurveyFieldLock
      ? normalizeSurveyType(existing.survey_type || 'malaria')
      : normalizeSurveyType(body?.survey_type || existing.survey_type || 'malaria');
    if (!surveyType) {
      return NextResponse.json({ error: 'Invalid survey_type' }, { status: 400 });
    }

    const countyRaw = censusSurveyFieldLock
      ? String(existing.county || '')
      : String(body?.county || existing.county || '').trim();
    const county = getCountyCanonical(countyRaw);
    if (!county) {
      return NextResponse.json({ error: 'Invalid county selected' }, { status: 400 });
    }

    const district = censusSurveyFieldLock
      ? String(existing.district || '').trim()
      : body?.district !== undefined
        ? String(body?.district || '').trim()
        : String(existing.district || '').trim();

    const community = censusSurveyFieldLock
      ? String(existing.community || '').trim()
      : String(body?.community || existing.community || '').trim();

    const electoralDistrict = censusSurveyFieldLock
      ? String(existing.electoral_district ?? '').trim()
      : body?.electoral_district !== undefined
        ? String(body?.electoral_district || '').trim().slice(0, 120) || null
        : String(existing.electoral_district ?? '').trim() || null;

    if (!isValidDistrictForCounty(county, district)) {
      return NextResponse.json({ error: 'District does not belong to selected county' }, { status: 400 });
    }

    if (!dateOfVisit || !community) {
      return NextResponse.json({ error: 'Date of visit and community are required' }, { status: 400 });
    }

    const censusAssignmentId = lockedAssignmentId;
    if (censusAssignmentId > 0) {
      const censusUserIdForValidation = user.role === 'census' ? user.userId : undefined;
      const check = await validateCensusAssignmentForReport(censusAssignmentId, surveyType, censusUserIdForValidation, {
        county,
        district,
        community,
      });
      if (!check.ok) {
        return NextResponse.json({ error: check.message }, { status: 400 });
      }
    }

    const householdsSurveyed = toNonNegativeInt(
      body?.households_surveyed !== undefined ? body.households_surveyed : existing.households_surveyed
    );
    const malariaCases = toNonNegativeInt(
      body?.malaria_cases !== undefined ? body.malaria_cases : existing.malaria_cases
    );
    const feverCases = toNonNegativeInt(
      body?.fever_cases !== undefined ? body.fever_cases : existing.fever_cases
    );
    const childrenUnder5 = toNonNegativeInt(
      body?.children_under_5 !== undefined ? body.children_under_5 : existing.children_under_5
    );
    const pregnantWomen = toNonNegativeInt(
      body?.pregnant_women !== undefined ? body.pregnant_women : existing.pregnant_women
    );
    const nonMalariaData = body?.data as JsonObject | undefined;

    const numericValues = [householdsSurveyed, malariaCases, feverCases, childrenUnder5, pregnantWomen];
    if (numericValues.some((v) => v < 0 || v > MAX_NUMERIC_VALUE)) {
      return NextResponse.json({ error: `Numeric fields must be between 0 and ${MAX_NUMERIC_VALUE}` }, { status: 400 });
    }
    if (surveyType === 'malaria' && householdsSurveyed <= 0) {
      return NextResponse.json({ error: 'Households surveyed must be greater than 0' }, { status: 400 });
    }
    if (surveyType === 'malaria') {
      const hasIndicator = malariaCases > 0 || feverCases > 0 || childrenUnder5 > 0 || pregnantWomen > 0;
      if (!hasIndicator && !notes && !locationLandmark) {
        return NextResponse.json(
          { error: 'Provide at least one indicator value, notes, or a village/landmark description' },
          { status: 400 }
        );
      }
    } else {
      const nonMalariaError = validateNonMalariaData(surveyType, nonMalariaData);
      if (nonMalariaError) {
        return NextResponse.json({ error: nonMalariaError }, { status: 400 });
      }
    }

    const gpsLat =
      body?.gps_lat !== undefined ? toNullableNumber(body.gps_lat) : toNullableNumber(existing.gps_lat);
    const gpsLng =
      body?.gps_lng !== undefined ? toNullableNumber(body.gps_lng) : toNullableNumber(existing.gps_lng);
    if (gpsLat !== null && gpsLng !== null && !isCoordinateInLiberia(gpsLat, gpsLng)) {
      return NextResponse.json(
        {
          error:
            'GPS coordinates are outside Liberia. Clear GPS or enter coordinates from within Liberia, or leave GPS empty.',
        },
        { status: 400 }
      );
    }
    const isUrgent = Boolean(body?.is_urgent) || malariaCases > URGENT_MALARIA_THRESHOLD;
    const statusValueRaw =
      body?.status !== undefined ? String(body.status).trim().toLowerCase() : String(existing.status || 'submitted').trim().toLowerCase();
    const allowedStatuses = ['submitted', 'reviewed', 'needs_correction', 'withdrawn'];
    const statusValue = allowedStatuses.includes(statusValueRaw) ? statusValueRaw : 'submitted';
    const correctionNoteRaw =
      typeof body?.correction_note === 'string'
        ? body.correction_note.trim()
        : String(existing.correction_note || '').trim();
    if (statusValue === 'needs_correction' && !correctionNoteRaw) {
      return NextResponse.json({ error: 'Please include what to correct.' }, { status: 400 });
    }
    const correctionNote = statusValue === 'needs_correction' ? correctionNoteRaw : null;
    const serializedData =
      surveyType === 'malaria'
        ? null
        : normalizeNonMalariaData(
            surveyType,
            (nonMalariaData || ((existing.data as unknown as JsonObject) ?? {})) as JsonObject
          );

    const sharedValues = [
      dateOfVisit,
      county,
      district || null,
      community,
      electoralDistrict,
      locationLandmark || null,
      householdsSurveyed,
      malariaCases,
      feverCases,
      childrenUnder5,
      pregnantWomen,
      notes || null,
      correctionNote,
      gpsLat,
      gpsLng,
      isUrgent,
      surveyType,
      serializedData ? JSON.stringify(serializedData) : null,
      statusValue,
    ];

    const dataColumnSql = IS_POSTGRES ? 'data = ?::jsonb' : 'data = ?';
    const baseUpdateSql = `UPDATE reports
           SET date_of_visit = ?, county = ?, district = ?, community = ?, electoral_district = ?, location_landmark = ?, households_surveyed = ?,
               malaria_cases = ?, fever_cases = ?, children_under_5 = ?, pregnant_women = ?,
               notes = ?, correction_note = ?, gps_lat = ?, gps_lng = ?, is_urgent = ?, survey_type = ?,
               ${dataColumnSql}, status = ?, updated_at = CURRENT_TIMESTAMP`;
    if (['researcher', 'admin', 'management'].includes(user.role)) {
      await pool.execute(
        `${baseUpdateSql}
           WHERE id = ?`,
        [...sharedValues, reportId]
      );
    } else {
      await pool.execute(
        `${baseUpdateSql}
           WHERE id = ? AND user_id = ?`,
        [...sharedValues, reportId, user.userId]
      );
    }

    void recordCommunityFromReport(county, district, community).catch(() => {});

    void (async () => {
      try {
        const cId = await getCountyIdByName(county);
        if (!cId) return;
        let dId: number | null = null;
        if (district) dId = await getDistrictIdByName(cId, district);
        if (dId && community) await findOrCreateCommunity(dId, community);
      } catch { /* best-effort */ }
    })();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating report:', error);
    return NextResponse.json({ error: 'Failed to update report' }, { status: 500 });
  }
}

// DELETE /api/reports/:id
// census hides report from their list (hidden_from_submitter); researcher hard-deletes
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await ensureReportsTable();
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['census', 'researcher', 'admin', 'management'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden - census or researcher role required' }, { status: 403 });
    }

    if (['researcher', 'admin', 'management'].includes(user.role)) {
      const flags = await getCensusReportsAccessFlags();
      if (isCensusReportsBlockedForRole(user.role, flags)) {
        return NextResponse.json({ error: 'Access to census reports is temporarily disabled for your role.' }, { status: 403 });
      }
    } else {
      const fieldDenied = await censusFieldAccessDeniedResponse(user);
      if (fieldDenied) return fieldDenied;
    }

    const { id } = await context.params;
    const reportId = Number(id);
    if (!Number.isFinite(reportId) || reportId <= 0) {
      return NextResponse.json({ error: 'Invalid report id' }, { status: 400 });
    }

    const [rows] = await pool.execute<ReportRecord[]>(
      `SELECT id, user_id, status
       FROM reports
       WHERE id = ?
       LIMIT 1`,
      [reportId]
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }
    if (user.role === 'census' && Number(rows[0].user_id) !== user.userId) {
      return NextResponse.json({ error: 'Forbidden - cannot delete this report' }, { status: 403 });
    }
    if (['researcher', 'admin', 'management'].includes(user.role)) {
      await pool.execute(
        `DELETE FROM reports
         WHERE id = ?`,
        [reportId]
      );
      return NextResponse.json({ success: true, deleted: true });
    }

    if (!['submitted', 'needs_correction'].includes(String(rows[0].status).toLowerCase())) {
      return NextResponse.json({ error: 'Only submitted reports can be removed from your device' }, { status: 409 });
    }

    await pool.execute(
      `UPDATE reports
       SET hidden_from_submitter = 1, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [reportId, user.userId]
    );

    return NextResponse.json({ success: true, hidden_from_device: true });
  } catch (error) {
    console.error('Error deleting report:', error);
    return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 });
  }
}
