import pool, { IS_POSTGRES } from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getCountyCanonical, LIBERIA_COUNTIES } from '@/lib/locations/liberia';

let ensurePromise: Promise<void> | null = null;

export async function ensureCensusAssignmentCountiesTable() {
  if (ensurePromise) {
    await ensurePromise;
    return;
  }

  ensurePromise = (async () => {
    if (IS_POSTGRES) {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS census_assignment_counties (
          id SERIAL PRIMARY KEY,
          census_assignment_id INTEGER NOT NULL,
          county VARCHAR(120) NOT NULL,
          sort_order INTEGER NOT NULL DEFAULT 0,
          UNIQUE (census_assignment_id, county)
        )
      `);
      try {
        await pool.execute(
          `CREATE INDEX IF NOT EXISTS idx_census_assignment_counties_survey ON census_assignment_counties(census_assignment_id)`
        );
      } catch {
        /* ignore */
      }
    } else {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS census_assignment_counties (
          id INT PRIMARY KEY AUTO_INCREMENT,
          census_assignment_id INT NOT NULL,
          county VARCHAR(120) NOT NULL,
          sort_order INT NOT NULL DEFAULT 0,
          UNIQUE KEY uq_assignment_county (census_assignment_id, county),
          INDEX idx_census_assignment_counties_survey (census_assignment_id)
        )
      `);
    }
  })();

  try {
    await ensurePromise;
  } catch (error) {
    ensurePromise = null;
    throw error;
  }
}

const MAX_COUNTIES = 15;

/** Normalize and dedupe county list; returns canonical Liberia county names. */
export function normalizeCountySelection(raw: unknown[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    const c = getCountyCanonical(String(item || '').trim());
    if (!c || seen.has(c)) continue;
    seen.add(c);
    out.push(c);
    if (out.length >= MAX_COUNTIES) break;
  }
  return out;
}

export async function replaceAssignmentCounties(censusAssignmentId: number, counties: string[]): Promise<void> {
  await ensureCensusAssignmentCountiesTable();
  await pool.execute(`DELETE FROM census_assignment_counties WHERE census_assignment_id = ?`, [censusAssignmentId]);
  let order = 0;
  for (const county of counties) {
    const c = getCountyCanonical(county);
    if (!c) continue;
    await pool.execute(
      `INSERT INTO census_assignment_counties (census_assignment_id, county, sort_order) VALUES (?, ?, ?)`,
      [censusAssignmentId, c, order++]
    );
  }
}

export async function listAssignmentCounties(censusAssignmentId: number): Promise<string[]> {
  await ensureCensusAssignmentCountiesTable();
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT county FROM census_assignment_counties WHERE census_assignment_id = ? ORDER BY sort_order ASC, id ASC`,
    [censusAssignmentId]
  );
  const list = rows.map((r) => String(r.county || '')).filter(Boolean);
  if (list.length > 0) return list;
  const [caRows] = await pool.execute<RowDataPacket[]>(
    `SELECT county FROM census_assignments WHERE id = ? LIMIT 1`,
    [censusAssignmentId]
  );
  const fallback = getCountyCanonical(String(caRows[0]?.county || ''));
  return fallback ? [fallback] : [];
}

export async function batchListAssignmentCounties(ids: number[]): Promise<Map<number, string[]>> {
  const map = new Map<number, string[]>();
  if (ids.length === 0) return map;
  await ensureCensusAssignmentCountiesTable();
  for (const id of ids) map.set(id, []);
  const placeholders = ids.map(() => '?').join(',');
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT census_assignment_id, county FROM census_assignment_counties WHERE census_assignment_id IN (${placeholders}) ORDER BY census_assignment_id, sort_order ASC, id ASC`,
    ids
  );
  for (const row of rows) {
    const aid = Number(row.census_assignment_id);
    const c = String(row.county || '');
    if (!c) continue;
    const cur = map.get(aid) || [];
    cur.push(c);
    map.set(aid, cur);
  }
  const missing = ids.filter((id) => (map.get(id) || []).length === 0);
  if (missing.length > 0) {
    const ph = missing.map(() => '?').join(',');
    const [caRows] = await pool.execute<RowDataPacket[]>(
      `SELECT id, county FROM census_assignments WHERE id IN (${ph})`,
      missing
    );
    for (const row of caRows) {
      const fallback = getCountyCanonical(String(row.county || ''));
      map.set(Number(row.id), fallback ? [fallback] : []);
    }
  }
  return map;
}

/** Backfill junction from primary county for surveys created before multi-county existed. */
export async function backfillAssignmentCountiesFromPrimary(): Promise<void> {
  await ensureCensusAssignmentCountiesTable();
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT ca.id, ca.county
     FROM census_assignments ca
     WHERE NOT EXISTS (SELECT 1 FROM census_assignment_counties x WHERE x.census_assignment_id = ca.id)
       AND ca.county IS NOT NULL AND TRIM(ca.county) <> ''`
  );
  for (const row of rows) {
    const id = Number(row.id);
    const c = getCountyCanonical(String(row.county || ''));
    if (!id || !c) continue;
    await replaceAssignmentCounties(id, [c]);
  }
}
