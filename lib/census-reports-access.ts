import pool, { IS_POSTGRES } from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

export type CensusReportsAccessFlags = {
  block_researchers: boolean;
  block_management: boolean;
};

let ensureTablePromise: Promise<void> | null = null;

async function ensureCensusReportsAccessTable(): Promise<void> {
  if (ensureTablePromise) {
    await ensureTablePromise;
    return;
  }
  ensureTablePromise = (async () => {
    if (IS_POSTGRES) {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS census_reports_access (
          id SMALLINT PRIMARY KEY CHECK (id = 1),
          block_researchers BOOLEAN NOT NULL DEFAULT FALSE,
          block_management BOOLEAN NOT NULL DEFAULT FALSE,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await pool.execute(`
        INSERT INTO census_reports_access (id, block_researchers, block_management)
        VALUES (1, FALSE, FALSE)
        ON CONFLICT (id) DO NOTHING
      `);
    } else {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS census_reports_access (
          id TINYINT PRIMARY KEY,
          block_researchers TINYINT(1) NOT NULL DEFAULT 0,
          block_management TINYINT(1) NOT NULL DEFAULT 0,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      await pool.execute(`
        INSERT IGNORE INTO census_reports_access (id, block_researchers, block_management)
        VALUES (1, 0, 0)
      `);
    }
  })();
  return ensureTablePromise;
}

export async function getCensusReportsAccessFlags(): Promise<CensusReportsAccessFlags> {
  await ensureCensusReportsAccessTable();
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT block_researchers, block_management FROM census_reports_access WHERE id = 1 LIMIT 1`
  );
  const r = rows[0];
  return {
    block_researchers: Boolean(Number(r?.block_researchers ?? 0)),
    block_management: Boolean(Number(r?.block_management ?? 0)),
  };
}

/** Admin: full control. Management (CEO): may only toggle researcher block. */
export async function setCensusReportsAccessFlags(
  patch: Partial<Pick<CensusReportsAccessFlags, 'block_researchers' | 'block_management'>>,
  actor: 'admin' | 'management'
): Promise<void> {
  await ensureCensusReportsAccessTable();
  const current = await getCensusReportsAccessFlags();
  const next: CensusReportsAccessFlags = {
    block_researchers:
      typeof patch.block_researchers === 'boolean' ? patch.block_researchers : current.block_researchers,
    block_management:
      actor === 'management'
        ? current.block_management
        : typeof patch.block_management === 'boolean'
          ? patch.block_management
          : current.block_management,
  };
  await pool.execute(
    `UPDATE census_reports_access SET block_researchers = ?, block_management = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1`,
    [next.block_researchers ? 1 : 0, next.block_management ? 1 : 0]
  );
}

/** Whether the census-reports page/API should deny this role. Admin is never blocked. */
export function isCensusReportsBlockedForRole(role: string, flags: CensusReportsAccessFlags): boolean {
  if (role === 'admin') return false;
  if (role === 'researcher') return flags.block_researchers;
  if (role === 'management') return flags.block_management;
  return true;
}

export const CENSUS_REPORTS_SURVEY_ROLES = ['researcher', 'admin', 'management'] as const;
export type CensusReportsSurveyRole = (typeof CENSUS_REPORTS_SURVEY_ROLES)[number];

export function isCensusReportsSurveyRole(role: string): role is CensusReportsSurveyRole {
  return (CENSUS_REPORTS_SURVEY_ROLES as readonly string[]).includes(role);
}
