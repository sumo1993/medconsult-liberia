import pool, { IS_POSTGRES } from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getCountyCanonical } from '@/lib/locations/liberia';
import { listAssignmentCounties } from '@/lib/census-assignment-counties';

export type PlaceRule = {
  id?: number;
  county: string;
  district: string | null;
  community: string | null;
};

let ensurePlacesPromise: Promise<void> | null = null;

export async function ensureCensusSurveyPlaceRulesTable() {
  if (ensurePlacesPromise) {
    await ensurePlacesPromise;
    return;
  }

  ensurePlacesPromise = (async () => {
    if (IS_POSTGRES) {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS census_survey_place_rules (
          id SERIAL PRIMARY KEY,
          census_assignment_id INTEGER NOT NULL,
          county VARCHAR(120) NOT NULL,
          district VARCHAR(120),
          community VARCHAR(160),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      try {
        await pool.execute(
          `CREATE INDEX IF NOT EXISTS idx_census_place_rules_survey ON census_survey_place_rules(census_assignment_id)`
        );
      } catch {
        /* ignore */
      }
    } else {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS census_survey_place_rules (
          id INT PRIMARY KEY AUTO_INCREMENT,
          census_assignment_id INT NOT NULL,
          county VARCHAR(120) NOT NULL,
          district VARCHAR(120) NULL,
          community VARCHAR(160) NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_census_place_rules_survey (census_assignment_id)
        )
      `);
    }
  })();

  try {
    await ensurePlacesPromise;
  } catch (error) {
    ensurePlacesPromise = null;
    throw error;
  }
}

function norm(s: string | null | undefined): string {
  return String(s || '')
    .trim()
    .toLowerCase();
}

/** Match user home location to a rule (empty district/community on rule = wildcard at that level). */
export function placeRuleMatchesUser(
  rule: { county: string; district: string | null; community: string | null },
  userCounty: string,
  userDistrict: string,
  userCommunity: string
): boolean {
  if (norm(rule.county) !== norm(userCounty)) return false;
  const rd = norm(rule.district);
  if (rd) {
    if (rd !== norm(userDistrict)) return false;
  }
  const rc = norm(rule.community);
  if (rc) {
    if (rc !== norm(userCommunity)) return false;
  }
  return true;
}

export async function countPlaceRulesForSurvey(censusAssignmentId: number): Promise<number> {
  await ensureCensusSurveyPlaceRulesTable();
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS c FROM census_survey_place_rules WHERE census_assignment_id = ?`,
    [censusAssignmentId]
  );
  return Number(rows[0]?.c || 0);
}

export async function userMatchesAnyPlaceRule(
  censusAssignmentId: number,
  userCounty: string,
  userDistrict: string,
  userCommunity: string
): Promise<boolean> {
  await ensureCensusSurveyPlaceRulesTable();
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT county, district, community FROM census_survey_place_rules WHERE census_assignment_id = ?`,
    [censusAssignmentId]
  );
  for (const row of rows) {
    if (
      placeRuleMatchesUser(
        {
          county: String(row.county || ''),
          district: row.district ? String(row.district) : null,
          community: row.community ? String(row.community) : null,
        },
        userCounty,
        userDistrict,
        userCommunity
      )
    ) {
      return true;
    }
  }
  return false;
}

/**
 * True if the submitted report location matches the survey primary row
 * (census_assignments) or any supplemental geographic rule for that survey.
 */
export async function reportMatchesAssignmentGeography(
  censusAssignmentId: number,
  reportCounty: string,
  reportDistrict: string,
  reportCommunity: string
): Promise<boolean> {
  await ensureCensusSurveyPlaceRulesTable();
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT county, district, community FROM census_assignments WHERE id = ? LIMIT 1`,
    [censusAssignmentId]
  );
  if (!rows.length) return false;
  const ca = rows[0];
  const primaryRule = {
    county: String(ca.county || ''),
    district: ca.district ? String(ca.district) : null,
    community: ca.community ? String(ca.community) : null,
  };

  const countyList = await listAssignmentCounties(censusAssignmentId);
  const reportC = getCountyCanonical(reportCounty);
  if (reportC && countyList.some((c) => norm(c) === norm(reportC))) {
    const template = {
      county: reportCounty,
      district: primaryRule.district,
      community: primaryRule.community,
    };
    if (placeRuleMatchesUser(template, reportCounty, reportDistrict, reportCommunity)) {
      return true;
    }
  }

  if (placeRuleMatchesUser(primaryRule, reportCounty, reportDistrict, reportCommunity)) {
    return true;
  }
  return userMatchesAnyPlaceRule(censusAssignmentId, reportCounty, reportDistrict, reportCommunity);
}
