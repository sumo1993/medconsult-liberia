import pool, { IS_POSTGRES } from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getCountyCanonical } from '@/lib/locations/liberia';

let ensurePromise: Promise<void> | null = null;

function normKey(s: string): string {
  return s
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

export function districtKeyFromInput(district: string | null | undefined): string {
  return normKey(String(district || ''));
}

export async function ensureLiberiaDistrictCommunitiesTable() {
  if (ensurePromise) {
    await ensurePromise;
    return;
  }

  ensurePromise = (async () => {
    if (IS_POSTGRES) {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS liberia_district_communities (
          id SERIAL PRIMARY KEY,
          county VARCHAR(120) NOT NULL,
          district_key VARCHAR(160) NOT NULL DEFAULT '',
          community VARCHAR(200) NOT NULL,
          community_key VARCHAR(200) NOT NULL,
          use_count INTEGER NOT NULL DEFAULT 1,
          last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE (county, district_key, community_key)
        )
      `);
      try {
        await pool.execute(
          `CREATE INDEX IF NOT EXISTS idx_liberia_dc_lookup ON liberia_district_communities(county, district_key)`
        );
      } catch {
        /* ignore */
      }
    } else {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS liberia_district_communities (
          id INT PRIMARY KEY AUTO_INCREMENT,
          county VARCHAR(120) NOT NULL,
          district_key VARCHAR(160) NOT NULL DEFAULT '',
          community VARCHAR(200) NOT NULL,
          community_key VARCHAR(200) NOT NULL,
          use_count INT NOT NULL DEFAULT 1,
          last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uq_liberia_dc (county, district_key, community_key(190)),
          INDEX idx_liberia_dc_lookup (county, district_key(64))
        )
      `);
    }
  })();

  try {
    await ensurePromise;
  } catch (e) {
    ensurePromise = null;
    throw e;
  }
}

const MAX_COMMUNITY_LEN = 200;
const MIN_COMMUNITY_LEN = 2;

/** Upsert a community name seen on a field report (crowdsourced catalog per county + district). */
export async function recordCommunityFromReport(
  countyRaw: string,
  districtRaw: string | null | undefined,
  communityRaw: string
): Promise<void> {
  const county = getCountyCanonical(countyRaw);
  const community = String(communityRaw || '').trim().slice(0, MAX_COMMUNITY_LEN);
  if (!county || community.length < MIN_COMMUNITY_LEN) return;

  const dKey = districtKeyFromInput(districtRaw);
  const cKey = normKey(community);
  if (!cKey) return;

  await ensureLiberiaDistrictCommunitiesTable();

  if (IS_POSTGRES) {
    await pool.execute(
      `INSERT INTO liberia_district_communities (county, district_key, community, community_key, use_count, last_seen_at)
       VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
       ON CONFLICT (county, district_key, community_key)
       DO UPDATE SET
         use_count = liberia_district_communities.use_count + 1,
         community = EXCLUDED.community,
         last_seen_at = CURRENT_TIMESTAMP`,
      [county, dKey, community, cKey]
    );
  } else {
    await pool.execute(
      `INSERT INTO liberia_district_communities (county, district_key, community, community_key, use_count, last_seen_at)
       VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
       ON DUPLICATE KEY UPDATE
         use_count = use_count + 1,
         community = VALUES(community),
         last_seen_at = CURRENT_TIMESTAMP`,
      [county, dKey, community, cKey]
    );
  }
}

export async function listCommunitiesForDistrict(
  countyRaw: string,
  districtRaw: string | null | undefined,
  limit = 40
): Promise<string[]> {
  const county = getCountyCanonical(countyRaw);
  if (!county) return [];
  const dKey = districtKeyFromInput(districtRaw);
  const lim = Math.min(100, Math.max(1, limit));

  await ensureLiberiaDistrictCommunitiesTable();
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT community FROM liberia_district_communities
     WHERE county = ? AND district_key = ?
     ORDER BY use_count DESC, last_seen_at DESC
     LIMIT ?`,
    [county, dKey, lim]
  );
  return rows.map((r) => String(r.community || '').trim()).filter(Boolean);
}

/** One-time backfill from existing reports (best-effort). */
export async function backfillCommunityCatalogFromReports(): Promise<void> {
  await ensureLiberiaDistrictCommunitiesTable();
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT county, district, community FROM reports
     WHERE community IS NOT NULL AND TRIM(community) <> ''
     ORDER BY id DESC
     LIMIT 2000`
  );
  for (const row of rows) {
    await recordCommunityFromReport(String(row.county || ''), row.district as string | null, String(row.community || ''));
  }
}
