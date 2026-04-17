import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { ensureCensusSurveyAssigneesTable } from './census-survey-assignees';
import { canCensusUserAccessSurvey } from './census-access';
import {
  ensureCensusSurveyPlaceRulesTable,
  reportMatchesAssignmentGeography,
  userMatchesAnyPlaceRule,
} from './census-survey-place-rules';

/** Multi-county geographic rules; when false, place rules must stay in the primary county. */
export async function ensureNationalScopeColumn() {
  try {
    await pool.execute(`ALTER TABLE census_assignments ADD COLUMN IF NOT EXISTS national_scope BOOLEAN NOT NULL DEFAULT FALSE`);
  } catch {
    try {
      await pool.execute(`ALTER TABLE census_assignments ADD COLUMN national_scope TINYINT(1) NOT NULL DEFAULT 0`);
    } catch {
      /* exists */
    }
  }
}

/** Ensures census_assignments.end_date exists (idempotent). */
export async function ensureCensusAssignmentsEndDateColumn() {
  try {
    await pool.execute(`ALTER TABLE census_assignments ADD COLUMN IF NOT EXISTS end_date DATE`);
  } catch {
    try {
      await pool.execute(`ALTER TABLE census_assignments ADD COLUMN end_date DATE NULL`);
    } catch {
      // column exists
    }
  }
}

export async function validateCensusAssignmentForReport(
  assignmentId: number,
  surveyType: string,
  censusUserId?: number,
  reportLocation?: { county: string; district: string; community: string }
): Promise<{ ok: true } | { ok: false; message: string }> {
  await ensureCensusAssignmentsEndDateColumn();
  await ensureCensusSurveyAssigneesTable();
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, survey_type, status, end_date
     FROM census_assignments
     WHERE id = ?
       AND LOWER(status) = 'open'
       AND (end_date IS NULL OR end_date >= CURRENT_DATE)
     LIMIT 1`,
    [assignmentId]
  );
  if (!rows.length) {
    return { ok: false, message: 'Survey is closed, paused, or has ended.' };
  }
  const row = rows[0];
  if (String(row.survey_type || '').toLowerCase() !== surveyType.toLowerCase()) {
    return { ok: false, message: 'Survey type does not match the selected survey.' };
  }
  if (censusUserId !== undefined && censusUserId > 0) {
    const allowed = await canCensusUserAccessSurvey(assignmentId, censusUserId);
    if (!allowed) {
      return {
        ok: false,
        message:
          'You cannot submit for this survey. Ask a researcher to add your account or your county/district/community on your profile.',
      };
    }
  }
  if (reportLocation) {
    let geoOk = false;
    let strictPlacesOnly = false;

    if (censusUserId !== undefined && censusUserId > 0) {
      await ensureCensusSurveyPlaceRulesTable();
      const [pcRows] = await pool.execute<RowDataPacket[]>(
        `SELECT COUNT(*) AS c FROM census_survey_place_rules WHERE census_assignment_id = ?`,
        [assignmentId]
      );
      const placeCount = Number(pcRows[0]?.c || 0);
      const [memberRows] = await pool.execute<RowDataPacket[]>(
        `SELECT 1 FROM census_survey_assignees WHERE census_assignment_id = ? AND user_id = ? LIMIT 1`,
        [assignmentId, censusUserId]
      );
      const isMember = memberRows.length > 0;
      strictPlacesOnly = !isMember && placeCount > 0;

      if (strictPlacesOnly) {
        geoOk = await userMatchesAnyPlaceRule(
          assignmentId,
          reportLocation.county,
          reportLocation.district,
          reportLocation.community
        );
      } else {
        geoOk = await reportMatchesAssignmentGeography(
          assignmentId,
          reportLocation.county,
          reportLocation.district,
          reportLocation.community
        );
      }
    } else {
      geoOk = await reportMatchesAssignmentGeography(
        assignmentId,
        reportLocation.county,
        reportLocation.district,
        reportLocation.community
      );
    }

    if (!geoOk) {
      return {
        ok: false,
        message: strictPlacesOnly
          ? 'Submitted location must match one of the geographic rules for this survey (not only the primary county/community row on the survey).'
          : 'Submitted county, district, or community does not match this survey assignment or its geographic rules.',
      };
    }
  }
  return { ok: true };
}
