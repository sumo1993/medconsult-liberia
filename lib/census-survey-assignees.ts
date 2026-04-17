import pool, { IS_POSTGRES } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

let ensureAssigneesPromise: Promise<void> | null = null;

export async function ensureCensusSurveyAssigneesTable() {
  if (ensureAssigneesPromise) {
    await ensureAssigneesPromise;
    return;
  }

  ensureAssigneesPromise = (async () => {
    if (IS_POSTGRES) {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS census_survey_assignees (
          census_assignment_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (census_assignment_id, user_id)
        )
      `);
      try {
        await pool.execute(`CREATE INDEX IF NOT EXISTS idx_census_survey_assignees_user ON census_survey_assignees(user_id)`);
      } catch {
        /* ignore */
      }
    } else {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS census_survey_assignees (
          census_assignment_id INT NOT NULL,
          user_id INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (census_assignment_id, user_id),
          INDEX idx_census_survey_assignees_user (user_id)
        )
      `);
    }
  })();

  try {
    await ensureAssigneesPromise;
  } catch (error) {
    ensureAssigneesPromise = null;
    throw error;
  }
}

/** If the survey has any assignees, userId must be one of them. If none, all census users may participate. */
export async function isUserAssignedToSurvey(censusAssignmentId: number, userId: number): Promise<boolean> {
  await ensureCensusSurveyAssigneesTable();
  const [countRows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS c FROM census_survey_assignees WHERE census_assignment_id = ?`,
    [censusAssignmentId]
  );
  const total = Number(countRows[0]?.c || 0);
  if (total === 0) return true;
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT 1 FROM census_survey_assignees WHERE census_assignment_id = ? AND user_id = ? LIMIT 1`,
    [censusAssignmentId, userId]
  );
  return rows.length > 0;
}
