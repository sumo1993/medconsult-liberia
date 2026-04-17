import { NextRequest, NextResponse } from 'next/server';
import pool, { IS_POSTGRES } from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';
import { censusFieldAccessDeniedResponse } from '@/lib/census-field-access';
import { ensureReportsTable, NON_MALARIA_SURVEY_TYPES, SurveyType, toNonNegativeInt, toNullableNumber } from './_lib';
import { validateCensusAssignmentForReport } from '@/lib/census-assignments-schema';
import { getCountyCanonical, isCoordinateInLiberia, isValidDistrictForCounty } from '@/lib/locations/liberia';
import { recordCommunityFromReport } from '@/lib/community-catalog';
import { getCountyIdByName, getDistrictIdByName, findOrCreateCommunity } from '@/lib/locations/location-db';

const URGENT_MALARIA_THRESHOLD = 10;
const MAX_NUMERIC_VALUE = 10000;
const MAX_SURVEY_COUNT_VALUE = 100000;
const WASH_WATER_SOURCE_OPTIONS = ['well', 'river', 'piped', 'borehole', 'rainwater', 'spring', 'vendor'] as const;
const WASH_TOILET_TYPE_OPTIONS = ['pit_latrine', 'flush', 'none', 'vip_latrine', 'composting'] as const;
const LOCKABLE_SURVEY_TYPES = ['malaria', 'health', 'maternal_child_health', 'wash', 'nutrition'] as const;

type JsonObject = Record<string, unknown>;
let ensureSurveyLocksPromise: Promise<void> | null = null;

async function ensureSurveyLocksTable() {
  if (ensureSurveyLocksPromise) {
    await ensureSurveyLocksPromise;
    return;
  }

  ensureSurveyLocksPromise = (async () => {
    if (IS_POSTGRES) {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS census_survey_locks (
          survey_type VARCHAR(32) PRIMARY KEY,
          is_locked BOOLEAN NOT NULL DEFAULT FALSE,
          updated_by INTEGER,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      for (const surveyType of LOCKABLE_SURVEY_TYPES) {
        await pool.execute(
          `INSERT INTO census_survey_locks (survey_type, is_locked)
           VALUES (?, FALSE)
           ON CONFLICT (survey_type) DO NOTHING`,
          [surveyType]
        );
      }
    } else {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS census_survey_locks (
          survey_type VARCHAR(32) PRIMARY KEY,
          is_locked BOOLEAN NOT NULL DEFAULT FALSE,
          updated_by INT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      for (const surveyType of LOCKABLE_SURVEY_TYPES) {
        await pool.execute(
          `INSERT IGNORE INTO census_survey_locks (survey_type, is_locked)
           VALUES (?, FALSE)`,
          [surveyType]
        );
      }
    }
  })();

  try {
    await ensureSurveyLocksPromise;
  } catch (error) {
    ensureSurveyLocksPromise = null;
    throw error;
  }
}

async function isSurveyTypeLocked(surveyType: string): Promise<boolean> {
  await ensureSurveyLocksTable();
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT is_locked
     FROM census_survey_locks
     WHERE survey_type = ?
     LIMIT 1`,
    [surveyType]
  );
  if (!rows.length) return false;
  return Boolean(Number(rows[0].is_locked));
}

function normalizeSurveyType(raw: unknown): SurveyType | null {
  const value = String(raw || '').trim().toLowerCase();
  if (!value || value === 'malaria') return 'malaria';
  if (NON_MALARIA_SURVEY_TYPES.includes(value as SurveyType)) return value as SurveyType;
  if (value === 'outbreak') return 'outbreak'; // keep legacy compatibility
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

// POST /api/reports
// census can submit reports
export async function POST(request: NextRequest) {
  try {
    await ensureReportsTable();
    await ensureSurveyLocksTable();
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'census') {
      return NextResponse.json({ error: 'Forbidden - census role required' }, { status: 403 });
    }
    const fieldDenied = await censusFieldAccessDeniedResponse(user);
    if (fieldDenied) return fieldDenied;

    const body = await request.json();
    const dateOfVisit = String(body?.date_of_visit || '').trim();
    const rawCounty = String(body?.county || '').trim();
    const district = String(body?.district || '').trim();
    const community = String(body?.community || '').trim();
    const electoralDistrict = String(body?.electoral_district || '').trim().slice(0, 120) || null;
    const notes = String(body?.notes || '').trim();
    const locationLandmark = String(body?.location_landmark || '').trim().slice(0, 500);
    const surveyType = normalizeSurveyType(body?.survey_type);

    if (!dateOfVisit || !rawCounty || !community) {
      return NextResponse.json({ error: 'Date of visit, county and community are required' }, { status: 400 });
    }
    if (!surveyType) {
      return NextResponse.json({ error: 'Invalid survey_type' }, { status: 400 });
    }
    if (LOCKABLE_SURVEY_TYPES.includes(surveyType as (typeof LOCKABLE_SURVEY_TYPES)[number])) {
      const locked = await isSurveyTypeLocked(surveyType);
      if (locked) {
        return NextResponse.json({ error: `${surveyType} survey is currently locked by researcher.` }, { status: 423 });
      }
    }
    const county = getCountyCanonical(rawCounty);
    if (!county) {
      return NextResponse.json({ error: 'Invalid county selected' }, { status: 400 });
    }
    if (!isValidDistrictForCounty(county, district)) {
      return NextResponse.json({ error: 'District does not belong to selected county' }, { status: 400 });
    }

    const householdsSurveyed = toNonNegativeInt(body?.households_surveyed);
    const malariaCases = toNonNegativeInt(body?.malaria_cases);
    const feverCases = toNonNegativeInt(body?.fever_cases);
    const childrenUnder5 = toNonNegativeInt(body?.children_under_5);
    const pregnantWomen = toNonNegativeInt(body?.pregnant_women);
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

    const gpsLat = toNullableNumber(body?.gps_lat);
    const gpsLng = toNullableNumber(body?.gps_lng);
    if (gpsLat !== null && gpsLng !== null && !isCoordinateInLiberia(gpsLat, gpsLng)) {
      return NextResponse.json(
        {
          error:
            'GPS coordinates are outside Liberia. Clear GPS or enter coordinates from within Liberia, or leave GPS empty.',
        },
        { status: 400 }
      );
    }
    const forcedDuplicate = Boolean(body?.force_duplicate);
    const isUrgent = Boolean(body?.is_urgent) || malariaCases > URGENT_MALARIA_THRESHOLD;
    const rawAssignmentId = asNumber(body?.assignment_id);
    const censusAssignmentId =
      rawAssignmentId !== null && Number.isFinite(rawAssignmentId) && rawAssignmentId > 0 ? Math.floor(rawAssignmentId) : null;
    if (censusAssignmentId) {
      const check = await validateCensusAssignmentForReport(censusAssignmentId, surveyType, user.userId, {
        county,
        district,
        community,
      });
      if (!check.ok) {
        return NextResponse.json({ error: check.message }, { status: 400 });
      }
    }

    const [duplicateRows] = await pool.execute<RowDataPacket[]>(
      `SELECT id
       FROM reports
       WHERE user_id = ?
         AND LOWER(community) = LOWER(?)
         AND date_of_visit = ?
       LIMIT 1`,
      [user.userId, community, dateOfVisit]
    );
    if (!forcedDuplicate && duplicateRows.length > 0) {
      return NextResponse.json(
        { error: 'Duplicate report detected', duplicate_exists: true, existing_id: Number(duplicateRows[0]?.id || 0) },
        { status: 409 }
      );
    }

    const insertParams = [
      user.userId,
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
      null,
      gpsLat,
      gpsLng,
      isUrgent,
      surveyType,
    ];
    const serializedData =
      surveyType === 'malaria'
        ? null
        : normalizeNonMalariaData(surveyType, (nonMalariaData || {}) as JsonObject);

    let createdId = 0;
    if (IS_POSTGRES) {
      const [pgRows] = await pool.execute<RowDataPacket[]>(
        `INSERT INTO reports
         (user_id, date_of_visit, county, district, community, electoral_district, location_landmark, households_surveyed, malaria_cases, fever_cases, children_under_5, pregnant_women, notes, correction_note, gps_lat, gps_lng, is_urgent, survey_type, data, census_assignment_id, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?::jsonb, ?, 'submitted')
         RETURNING id`,
        [...insertParams, serializedData ? JSON.stringify(serializedData) : null, censusAssignmentId]
      );
      createdId = Number((pgRows?.[0] as RowDataPacket | undefined)?.id || 0);
    } else {
      const [result] = await pool.execute(
        `INSERT INTO reports
         (user_id, date_of_visit, county, district, community, electoral_district, location_landmark, households_surveyed, malaria_cases, fever_cases, children_under_5, pregnant_women, notes, correction_note, gps_lat, gps_lng, is_urgent, survey_type, data, census_assignment_id, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted')`,
        [...insertParams, serializedData ? JSON.stringify(serializedData) : null, censusAssignmentId]
      );
      createdId = Number((result as { insertId?: number }).insertId || 0);
    }

    if (!createdId) {
      const [latestRows] = await pool.execute<RowDataPacket[]>(
        `SELECT id
         FROM reports
         WHERE user_id = ?
         ORDER BY created_at DESC, id DESC
         LIMIT 1`,
        [user.userId]
      );
      createdId = Number(latestRows[0]?.id || 0);
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

    return NextResponse.json(
      {
        success: true,
        id: createdId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error submitting report:', error);
    return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 });
  }
}
