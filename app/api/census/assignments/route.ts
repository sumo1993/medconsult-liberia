import { NextRequest, NextResponse } from 'next/server';
import pool, { IS_POSTGRES } from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';
import { ensureCensusAssignmentsEndDateColumn, ensureNationalScopeColumn } from '@/lib/census-assignments-schema';
import { ensureCensusSurveyAssigneesTable } from '@/lib/census-survey-assignees';
import { ensureCensusSurveyPlaceRulesTable } from '@/lib/census-survey-place-rules';
import {
  ensureCensusAssignmentCountiesTable,
  normalizeCountySelection,
  replaceAssignmentCounties,
  batchListAssignmentCounties,
} from '@/lib/census-assignment-counties';
import { isCensusReportsSurveyRole } from '@/lib/census-reports-access';
import { censusFieldAccessDeniedResponse } from '@/lib/census-field-access';
type AssignmentRow = RowDataPacket & {
  id: number;
  created_by: number;
  creator_name: string;
  title: string;
  description: string | null;
  county: string;
  district: string | null;
  community: string | null;
  survey_type: string;
  due_date: string | null;
  end_date: string | null;
  status: string;
  location_locked: boolean | number;
  national_scope: boolean | number;
  created_at: string;
  updated_at: string;
};

let ensureAssignmentsPromise: Promise<void> | null = null;

async function ensureAssignmentsTable() {
  if (ensureAssignmentsPromise) {
    await ensureAssignmentsPromise;
    return;
  }

  ensureAssignmentsPromise = (async () => {
    if (IS_POSTGRES) {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS census_assignments (
          id SERIAL PRIMARY KEY,
          created_by INTEGER NOT NULL,
          title VARCHAR(180) NOT NULL,
          description TEXT,
          county VARCHAR(120) NOT NULL,
          district VARCHAR(120),
          community VARCHAR(160) NOT NULL,
          survey_type VARCHAR(32) NOT NULL DEFAULT 'malaria',
          due_date DATE,
          status VARCHAR(20) NOT NULL DEFAULT 'open',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      try { await pool.execute(`CREATE INDEX IF NOT EXISTS idx_census_assignments_status ON census_assignments(status)`); } catch {}
      try { await pool.execute(`CREATE INDEX IF NOT EXISTS idx_census_assignments_created_at ON census_assignments(created_at)`); } catch {}
      try { await pool.execute(`CREATE INDEX IF NOT EXISTS idx_census_assignments_county ON census_assignments(county)`); } catch {}
    } else {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS census_assignments (
          id INT PRIMARY KEY AUTO_INCREMENT,
          created_by INT NOT NULL,
          title VARCHAR(180) NOT NULL,
          description TEXT NULL,
          county VARCHAR(120) NOT NULL,
          district VARCHAR(120) NULL,
          community VARCHAR(160) NOT NULL,
          survey_type VARCHAR(32) NOT NULL DEFAULT 'malaria',
          due_date DATE NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'open',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_census_assignments_status (status),
          INDEX idx_census_assignments_created_at (created_at),
          INDEX idx_census_assignments_county (county)
        )
      `);
    }
  })();

  try {
    await ensureAssignmentsPromise;
  } catch (error) {
    ensureAssignmentsPromise = null;
    throw error;
  }
}

async function ensureLocationLockedColumn() {
  try {
    await pool.execute(`ALTER TABLE census_assignments ADD COLUMN IF NOT EXISTS location_locked BOOLEAN NOT NULL DEFAULT TRUE`);
  } catch {
    try {
      await pool.execute(`ALTER TABLE census_assignments ADD COLUMN location_locked TINYINT(1) NOT NULL DEFAULT 1`);
    } catch {
      /* exists */
    }
  }
}

async function ensureUserDistrictColumn() {
  try {
    await pool.execute(`ALTER TABLE users ADD COLUMN IF NOT EXISTS district VARCHAR(120)`);
  } catch {
    try {
      await pool.execute(`ALTER TABLE users ADD COLUMN district VARCHAR(120) NULL`);
    } catch {
      /* exists */
    }
  }
}

/** Researchers set counties only; district/community are optional on the row — allow NULL for empty. */
async function ensureAssignmentCommunityNullable() {
  try {
    await pool.execute(`ALTER TABLE census_assignments ALTER COLUMN community DROP NOT NULL`);
  } catch {
    try {
      await pool.execute(`ALTER TABLE census_assignments MODIFY COLUMN community VARCHAR(160) NULL`);
    } catch {
      /* already nullable or table missing */
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    await ensureAssignmentsTable();
    await ensureCensusAssignmentsEndDateColumn();
    await ensureLocationLockedColumn();
    await ensureNationalScopeColumn();
    await ensureAssignmentCommunityNullable();
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['researcher', 'census', 'admin', 'management'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (user.role === 'census') {
      const fieldDenied = await censusFieldAccessDeniedResponse(user);
      if (fieldDenied) return fieldDenied;
    }

    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get('id') || 0);
    const status = String(searchParams.get('status') || '').trim().toLowerCase();
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || 20)));

    let where = 'WHERE 1=1';
    const params: unknown[] = [];
    if (id > 0) {
      where += ' AND ca.id = ?';
      params.push(id);
    }
    if (status) {
      where += ' AND LOWER(ca.status) = ?';
      params.push(status);
    } else if (user.role === 'census') {
      where += ` AND LOWER(ca.status) = 'open'`;
      where += ` AND (ca.end_date IS NULL OR ca.end_date >= CURRENT_DATE)`;
      await ensureCensusSurveyAssigneesTable();
      await ensureCensusSurveyPlaceRulesTable();
      await ensureCensusAssignmentCountiesTable();
      await ensureUserDistrictColumn();
      const [pRows] = await pool.execute<RowDataPacket[]>(
        `SELECT county, district, city FROM users WHERE id = ? LIMIT 1`,
        [user.userId]
      );
      const p = pRows[0] || {};
      const uc = String(p.county || '').trim();
      const ud = String(p.district || '').trim();
      const ucomm = String(p.city || '').trim();
      where += ` AND (
        (
          (SELECT COUNT(*) FROM census_survey_assignees WHERE census_assignment_id = ca.id) = 0
          AND (SELECT COUNT(*) FROM census_survey_place_rules WHERE census_assignment_id = ca.id) = 0
        )
        OR EXISTS (SELECT 1 FROM census_survey_assignees WHERE census_assignment_id = ca.id AND user_id = ?)
        OR LOWER(TRIM(ca.county)) = LOWER(TRIM(?))
        OR EXISTS (
          SELECT 1 FROM census_assignment_counties jac
          WHERE jac.census_assignment_id = ca.id
          AND LOWER(TRIM(jac.county)) = LOWER(TRIM(?))
        )
        OR EXISTS (
          SELECT 1 FROM census_survey_place_rules p
          WHERE p.census_assignment_id = ca.id
          AND LOWER(TRIM(p.county)) = LOWER(TRIM(?))
          AND (TRIM(COALESCE(p.district,'')) = '' OR LOWER(TRIM(p.district)) = LOWER(TRIM(?)))
          AND (TRIM(COALESCE(p.community,'')) = '' OR LOWER(TRIM(p.community)) = LOWER(TRIM(?)))
        )
      )`;
      params.push(user.userId, uc, uc, uc, ud, ucomm);
    }
    if (user.role === 'researcher') {
      where += ' AND ca.created_by = ?';
      params.push(user.userId);
    }

    const [rows] = await pool.execute<AssignmentRow[]>(
      `SELECT
        ca.id, ca.created_by, COALESCE(u.full_name, 'Researcher') AS creator_name,
        ca.title, ca.description, ca.county, ca.district, ca.community,
        ca.survey_type, ca.due_date, ca.end_date, ca.status, ca.location_locked, ca.national_scope, ca.created_at, ca.updated_at
       FROM census_assignments ca
       LEFT JOIN users u ON u.id = ca.created_by
       ${where}
       ORDER BY ca.created_at DESC, ca.id DESC
       LIMIT ?`,
      [...params, limit]
    );

    await ensureCensusAssignmentCountiesTable();
    const ids = rows.map((r) => Number(r.id));
    const countiesMap = await batchListAssignmentCounties(ids);
    const assignments = rows.map((r) => {
      const id = Number(r.id);
      const counties = countiesMap.get(id) || [];
      return { ...r, counties };
    });

    return NextResponse.json({ assignments });
  } catch (error) {
    console.error('Error fetching census assignments:', error);
    return NextResponse.json({ error: 'Failed to fetch census assignments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureAssignmentsTable();
    await ensureCensusAssignmentsEndDateColumn();
    await ensureLocationLockedColumn();
    await ensureNationalScopeColumn();
    await ensureAssignmentCommunityNullable();
    await ensureCensusAssignmentCountiesTable();
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isCensusReportsSurveyRole(user.role)) {
      return NextResponse.json({ error: 'Forbidden - researcher, admin, or management role required' }, { status: 403 });
    }

    const body = await request.json();
    const title = String(body?.title || '').trim();
    const description = String(body?.description || '').trim();
    const countyField = String(body?.county || '').trim();
    const district = String(body?.district || '').trim();
    const community = String(body?.community || '').trim();
    const surveyType = String(body?.survey_type || 'malaria').trim().toLowerCase();
    const dueDate = String(body?.due_date || '').trim();
    const endDate = String(body?.end_date || '').trim();
    const nationalScope = Boolean(body?.national_scope);

    const fromMulti = normalizeCountySelection(Array.isArray(body?.counties) ? body.counties : []);
    const fromSingle = countyField ? normalizeCountySelection([countyField]) : [];
    const primaryCounty = fromMulti.length > 0 ? fromMulti[0] : fromSingle[0] || '';

    if (!title || !primaryCounty) {
      return NextResponse.json({ error: 'Title and at least one county are required' }, { status: 400 });
    }
    if (!endDate) {
      return NextResponse.json({ error: 'Survey end date is required' }, { status: 400 });
    }

    const allowedSurveyTypes = ['malaria', 'health', 'maternal_child_health', 'wash', 'nutrition'];
    if (!allowedSurveyTypes.includes(surveyType)) {
      return NextResponse.json({ error: 'Invalid survey_type' }, { status: 400 });
    }

    const countiesToStore = fromMulti.length > 0 ? fromMulti : fromSingle;

    const districtVal = district || null;
    const communityVal = community || null;

    let createdId = 0;
    if (IS_POSTGRES) {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `INSERT INTO census_assignments
         (created_by, title, description, county, district, community, survey_type, due_date, end_date, status, location_locked, national_scope)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', FALSE, ?)
         RETURNING id`,
        [user.userId, title, description || null, primaryCounty, districtVal, communityVal, surveyType, dueDate || null, endDate, nationalScope]
      );
      createdId = Number(rows?.[0]?.id || 0);
    } else {
      const [result] = await pool.execute(
        `INSERT INTO census_assignments
         (created_by, title, description, county, district, community, survey_type, due_date, end_date, status, location_locked, national_scope)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', 0, ?)`,
        [user.userId, title, description || null, primaryCounty, districtVal, communityVal, surveyType, dueDate || null, endDate, nationalScope ? 1 : 0]
      );
      createdId = Number((result as { insertId?: number }).insertId || 0);
    }

    if (createdId && countiesToStore.length > 0) {
      await replaceAssignmentCounties(createdId, countiesToStore);
    }

    return NextResponse.json({ success: true, id: createdId }, { status: 201 });
  } catch (error) {
    console.error('Error creating census assignment:', error);
    return NextResponse.json({ error: 'Failed to create census assignment' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await ensureAssignmentsTable();
    await ensureCensusAssignmentsEndDateColumn();
    await ensureLocationLockedColumn();
    await ensureNationalScopeColumn();
    await ensureAssignmentCommunityNullable();
    await ensureCensusAssignmentCountiesTable();
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isCensusReportsSurveyRole(user.role)) {
      return NextResponse.json({ error: 'Forbidden - researcher, admin, or management role required' }, { status: 403 });
    }

    const body = await request.json();
    const id = Number(body?.id || 0);
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: 'Invalid survey id' }, { status: 400 });
    }

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT id, created_by, location_locked
       FROM census_assignments
       WHERE id = ?
       LIMIT 1`,
      [id]
    );
    if (!rows.length) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }
    if (!['admin', 'management'].includes(user.role) && Number(rows[0].created_by) !== user.userId) {
      return NextResponse.json({ error: 'Forbidden - not your survey' }, { status: 403 });
    }
    const locationLocked = Boolean(Number(rows[0].location_locked ?? 1));

    const allowedSurveyTypes = ['malaria', 'health', 'maternal_child_health', 'wash', 'nutrition'];
    const setClauses: string[] = [];
    const setParams: unknown[] = [];
    let countiesToSync: string[] | null = null;

    if (Object.prototype.hasOwnProperty.call(body, 'title')) {
      const title = String(body.title || '').trim();
      if (!title) return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 });
      setClauses.push('title = ?');
      setParams.push(title);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'description')) {
      setClauses.push('description = ?');
      setParams.push(String(body.description || '').trim() || null);
    }
    if (!locationLocked && Object.prototype.hasOwnProperty.call(body, 'counties')) {
      const sel = normalizeCountySelection(Array.isArray(body.counties) ? body.counties : []);
      if (sel.length === 0) {
        return NextResponse.json({ error: 'Select at least one county' }, { status: 400 });
      }
      countiesToSync = sel;
      setClauses.push('county = ?');
      setParams.push(sel[0]);
    } else if (!locationLocked && Object.prototype.hasOwnProperty.call(body, 'county')) {
      const county = String(body.county || '').trim();
      if (!county) return NextResponse.json({ error: 'County cannot be empty' }, { status: 400 });
      setClauses.push('county = ?');
      setParams.push(county);
      countiesToSync = normalizeCountySelection([county]);
    }
    if (!locationLocked && Object.prototype.hasOwnProperty.call(body, 'district')) {
      setClauses.push('district = ?');
      setParams.push(String(body.district || '').trim() || null);
    }
    if (!locationLocked && Object.prototype.hasOwnProperty.call(body, 'community')) {
      const community = String(body.community || '').trim();
      setClauses.push('community = ?');
      setParams.push(community || null);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'survey_type')) {
      const surveyType = String(body.survey_type || '').trim().toLowerCase();
      if (!allowedSurveyTypes.includes(surveyType)) {
        return NextResponse.json({ error: 'Invalid survey_type' }, { status: 400 });
      }
      setClauses.push('survey_type = ?');
      setParams.push(surveyType);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'due_date')) {
      const rawDue = body.due_date;
      const dueDate = rawDue === null || rawDue === undefined ? '' : String(rawDue).trim();
      setClauses.push('due_date = ?');
      setParams.push(dueDate || null);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'end_date')) {
      const endDate = String(body.end_date || '').trim();
      if (!endDate) return NextResponse.json({ error: 'Survey end date cannot be empty' }, { status: 400 });
      setClauses.push('end_date = ?');
      setParams.push(endDate);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'status')) {
      const status = String(body.status || '').trim().toLowerCase();
      if (!['open', 'locked', 'closed'].includes(status)) {
        return NextResponse.json({ error: 'Invalid status. Use open, locked, or closed.' }, { status: 400 });
      }
      setClauses.push('status = ?');
      setParams.push(status);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'national_scope')) {
      setClauses.push('national_scope = ?');
      setParams.push(IS_POSTGRES ? Boolean(body.national_scope) : Boolean(body.national_scope) ? 1 : 0);
    }

    if (setClauses.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    setClauses.push('updated_at = CURRENT_TIMESTAMP');
    await pool.execute(
      `UPDATE census_assignments SET ${setClauses.join(', ')} WHERE id = ?`,
      [...setParams, id]
    );

    if (countiesToSync && countiesToSync.length > 0) {
      await replaceAssignmentCounties(id, countiesToSync);
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Error updating census survey:', error);
    return NextResponse.json({ error: 'Failed to update census survey' }, { status: 500 });
  }
}
