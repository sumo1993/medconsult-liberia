import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { ensureCensusSurveyAssigneesTable } from '@/lib/census-survey-assignees';
import {
  ensureCensusSurveyPlaceRulesTable,
  userMatchesAnyPlaceRule,
} from '@/lib/census-survey-place-rules';

/** Profile fields used to match place rules (city = community area). */
export async function getUserLocationForSurveys(userId: number): Promise<{
  county: string;
  district: string;
  community: string;
}> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT county, district, city FROM users WHERE id = ? LIMIT 1`,
    [userId]
  );
  const row = rows[0];
  return {
    county: String(row?.county || '').trim(),
    district: String(row?.district || '').trim(),
    community: String(row?.city || '').trim(),
  };
}

/**
 * Census user can use a survey if:
 * - no assignees AND no place rules → everyone
 * - only assignees → must be listed
 * - only place rules → profile must match a rule
 * - both → listed **or** place match
 */
export async function canCensusUserAccessSurvey(censusAssignmentId: number, userId: number): Promise<boolean> {
  await ensureCensusSurveyAssigneesTable();
  await ensureCensusSurveyPlaceRulesTable();

  const [acRows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS c FROM census_survey_assignees WHERE census_assignment_id = ?`,
    [censusAssignmentId]
  );
  const [pcRows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS c FROM census_survey_place_rules WHERE census_assignment_id = ?`,
    [censusAssignmentId]
  );
  const assigneeCount = Number(acRows[0]?.c || 0);
  const placeCount = Number(pcRows[0]?.c || 0);

  if (assigneeCount === 0 && placeCount === 0) return true;

  const [memberRows] = await pool.execute<RowDataPacket[]>(
    `SELECT 1 FROM census_survey_assignees WHERE census_assignment_id = ? AND user_id = ? LIMIT 1`,
    [censusAssignmentId, userId]
  );
  const isMember = memberRows.length > 0;

  const loc = await getUserLocationForSurveys(userId);
  const placeMatch = await userMatchesAnyPlaceRule(
    censusAssignmentId,
    loc.county,
    loc.district,
    loc.community
  );

  if (assigneeCount > 0 && placeCount === 0) return isMember;
  if (assigneeCount === 0 && placeCount > 0) return placeMatch;
  return isMember || placeMatch;
}
