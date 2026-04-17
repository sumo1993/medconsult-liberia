/**
 * Production-ready location management for Liberia.
 *
 * DB tables:
 *   location_counties   – 15 fixed rows seeded from LIBERIA_COUNTIES
 *   location_districts  – approved/pending rows per county
 *   location_communities – normalized, dedup'd, usage-tracked per district
 *
 * All public helpers await ensureLocationTables() first, which is idempotent.
 */

import pool, { IS_POSTGRES } from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { LIBERIA_COUNTIES, DISTRICTS_BY_COUNTY } from '@/lib/locations/liberia';
import { ADMINISTRATIVE_DISTRICTS_BY_COUNTY } from '@/lib/locations/liberia-lisgis-admin-districts';

// ── types ────────────────────────────────────────────────────────────────────

export type DistrictStatus = 'approved' | 'pending';
export type CommunityStatus = 'approved' | 'unverified';

export interface CountyRow {
  id: number;
  name: string;
}

export interface DistrictRow {
  id: number;
  name: string;
  county_id: number;
  county_name?: string;
  status: DistrictStatus;
}

export interface CommunityRow {
  id: number;
  name: string;
  normalized_name: string;
  district_id: number;
  district_name?: string;
  county_name?: string;
  status: CommunityStatus;
  usage_count: number;
}

// ── normalization ────────────────────────────────────────────────────────────

export function normalizeCommunityName(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/[^a-z0-9\s\-']/g, '');
}

function normDistrict(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ').toLowerCase();
}

// ── table creation ───────────────────────────────────────────────────────────

let ensureTablesPromise: Promise<void> | null = null;

export async function ensureLocationTables(): Promise<void> {
  if (ensureTablesPromise) {
    await ensureTablesPromise;
    return;
  }

  ensureTablesPromise = (async () => {
    if (IS_POSTGRES) {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS location_counties (
          id SERIAL PRIMARY KEY,
          name VARCHAR(120) NOT NULL UNIQUE
        )
      `);
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS location_districts (
          id SERIAL PRIMARY KEY,
          name VARCHAR(160) NOT NULL,
          county_id INTEGER NOT NULL REFERENCES location_counties(id),
          status VARCHAR(20) NOT NULL DEFAULT 'approved',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE (county_id, name)
        )
      `);
      try {
        await pool.execute(`CREATE INDEX IF NOT EXISTS idx_location_districts_county ON location_districts(county_id)`);
        await pool.execute(`CREATE INDEX IF NOT EXISTS idx_location_districts_status ON location_districts(status)`);
      } catch { /* ignore */ }
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS location_communities (
          id SERIAL PRIMARY KEY,
          name VARCHAR(200) NOT NULL,
          normalized_name VARCHAR(200) NOT NULL,
          district_id INTEGER NOT NULL REFERENCES location_districts(id),
          status VARCHAR(20) NOT NULL DEFAULT 'unverified',
          usage_count INTEGER NOT NULL DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE (district_id, normalized_name)
        )
      `);
      try {
        await pool.execute(`CREATE INDEX IF NOT EXISTS idx_location_communities_district ON location_communities(district_id)`);
        await pool.execute(`CREATE INDEX IF NOT EXISTS idx_location_communities_norm ON location_communities(normalized_name)`);
        await pool.execute(`CREATE INDEX IF NOT EXISTS idx_location_communities_usage ON location_communities(usage_count DESC)`);
      } catch { /* ignore */ }
    } else {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS location_counties (
          id INT PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(120) NOT NULL,
          UNIQUE KEY uq_county_name (name)
        )
      `);
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS location_districts (
          id INT PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(160) NOT NULL,
          county_id INT NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'approved',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY uq_district_county (county_id, name),
          INDEX idx_location_districts_county (county_id),
          INDEX idx_location_districts_status (status)
        )
      `);
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS location_communities (
          id INT PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(200) NOT NULL,
          normalized_name VARCHAR(200) NOT NULL,
          district_id INT NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'unverified',
          usage_count INT NOT NULL DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uq_community_district (district_id, normalized_name),
          INDEX idx_location_communities_district (district_id),
          INDEX idx_location_communities_norm (normalized_name),
          INDEX idx_location_communities_usage (usage_count)
        )
      `);
    }
  })();

  try {
    await ensureTablesPromise;
  } catch (e) {
    ensureTablesPromise = null;
    throw e;
  }
}

// ── seeding ──────────────────────────────────────────────────────────────────

let seedDone = false;

export async function seedLocationData(): Promise<void> {
  if (seedDone) return;
  await ensureLocationTables();

  const [existing] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS n FROM location_counties`
  );
  if (Number(existing[0]?.n || 0) >= LIBERIA_COUNTIES.length) {
    seedDone = true;
    return;
  }

  for (const county of LIBERIA_COUNTIES) {
    if (IS_POSTGRES) {
      await pool.execute(
        `INSERT INTO location_counties (name) VALUES (?) ON CONFLICT (name) DO NOTHING`,
        [county]
      );
    } else {
      await pool.execute(
        `INSERT IGNORE INTO location_counties (name) VALUES (?)`,
        [county]
      );
    }
  }

  const allDistricts: Record<string, string[]> = {};
  for (const c of LIBERIA_COUNTIES) {
    const seen = new Set<string>();
    const merged: string[] = [];
    for (const d of [...(DISTRICTS_BY_COUNTY[c] || []), ...(ADMINISTRATIVE_DISTRICTS_BY_COUNTY[c] || [])]) {
      const t = d.trim();
      const low = normDistrict(t);
      if (!t || seen.has(low)) continue;
      seen.add(low);
      merged.push(t);
    }
    allDistricts[c] = merged;
  }

  for (const [county, districts] of Object.entries(allDistricts)) {
    const [cRows] = await pool.execute<RowDataPacket[]>(
      `SELECT id FROM location_counties WHERE name = ? LIMIT 1`,
      [county]
    );
    const countyId = Number(cRows[0]?.id || 0);
    if (!countyId) continue;

    for (const dist of districts) {
      if (IS_POSTGRES) {
        await pool.execute(
          `INSERT INTO location_districts (name, county_id, status)
           VALUES (?, ?, 'approved')
           ON CONFLICT (county_id, name) DO NOTHING`,
          [dist, countyId]
        );
      } else {
        await pool.execute(
          `INSERT IGNORE INTO location_districts (name, county_id, status)
           VALUES (?, ?, 'approved')`,
          [dist, countyId]
        );
      }
    }
  }

  seedDone = true;
}

// ── counties ─────────────────────────────────────────────────────────────────

export async function getAllCounties(): Promise<CountyRow[]> {
  await seedLocationData();
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, name FROM location_counties ORDER BY name ASC`
  );
  return rows.map((r) => ({ id: Number(r.id), name: String(r.name) }));
}

export async function getCountyIdByName(name: string): Promise<number | null> {
  await seedLocationData();
  const target = name.trim().toLowerCase();
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id FROM location_counties WHERE LOWER(TRIM(name)) = ? LIMIT 1`,
    [target]
  );
  return rows.length > 0 ? Number(rows[0].id) : null;
}

// ── districts ────────────────────────────────────────────────────────────────

export async function getDistrictsByCountyId(
  countyId: number,
  includeStatus: DistrictStatus[] = ['approved']
): Promise<DistrictRow[]> {
  await seedLocationData();
  const placeholders = includeStatus.map(() => '?').join(',');
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT d.id, d.name, d.county_id, d.status,
            c.name AS county_name
     FROM location_districts d
     JOIN location_counties c ON c.id = d.county_id
     WHERE d.county_id = ? AND d.status IN (${placeholders})
     ORDER BY d.name ASC`,
    [countyId, ...includeStatus]
  );
  return rows.map((r) => ({
    id: Number(r.id),
    name: String(r.name),
    county_id: Number(r.county_id),
    county_name: String(r.county_name || ''),
    status: String(r.status) as DistrictStatus,
  }));
}

export async function createDistrict(
  countyId: number,
  name: string,
  status: DistrictStatus = 'pending'
): Promise<DistrictRow> {
  await seedLocationData();
  const trimmed = name.trim();
  if (!trimmed || trimmed.length < 2) throw new Error('District name too short');
  if (trimmed.length > 160) throw new Error('District name too long');

  const [exists] = await pool.execute<RowDataPacket[]>(
    `SELECT id, name, status FROM location_districts
     WHERE county_id = ? AND LOWER(TRIM(name)) = ?
     LIMIT 1`,
    [countyId, normDistrict(trimmed)]
  );
  if (exists.length > 0) {
    return {
      id: Number(exists[0].id),
      name: String(exists[0].name),
      county_id: countyId,
      status: String(exists[0].status) as DistrictStatus,
    };
  }

  let id = 0;
  if (IS_POSTGRES) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `INSERT INTO location_districts (name, county_id, status)
       VALUES (?, ?, ?)
       RETURNING id`,
      [trimmed, countyId, status]
    );
    id = Number(rows[0]?.id || 0);
  } else {
    const [result] = await pool.execute(
      `INSERT INTO location_districts (name, county_id, status)
       VALUES (?, ?, ?)`,
      [trimmed, countyId, status]
    );
    id = Number((result as { insertId?: number }).insertId || 0);
  }

  return { id, name: trimmed, county_id: countyId, status };
}

export async function getDistrictIdByName(countyId: number, name: string): Promise<number | null> {
  await seedLocationData();
  const target = normDistrict(name);
  if (!target) return null;
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id FROM location_districts WHERE county_id = ? AND LOWER(TRIM(name)) = ? LIMIT 1`,
    [countyId, target]
  );
  return rows.length > 0 ? Number(rows[0].id) : null;
}

// ── communities ──────────────────────────────────────────────────────────────

export async function searchCommunities(
  districtId: number,
  search: string,
  limit = 10
): Promise<CommunityRow[]> {
  await ensureLocationTables();
  const norm = normalizeCommunityName(search);
  const lim = Math.min(50, Math.max(1, limit));

  if (!norm) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT cm.id, cm.name, cm.normalized_name, cm.district_id, cm.status, cm.usage_count,
              d.name AS district_name, c.name AS county_name
       FROM location_communities cm
       JOIN location_districts d ON d.id = cm.district_id
       JOIN location_counties c ON c.id = d.county_id
       WHERE cm.district_id = ?
       ORDER BY cm.usage_count DESC, cm.name ASC
       LIMIT ?`,
      [districtId, lim]
    );
    return mapCommunityRows(rows);
  }

  const pattern = `%${norm}%`;
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT cm.id, cm.name, cm.normalized_name, cm.district_id, cm.status, cm.usage_count,
            d.name AS district_name, c.name AS county_name
     FROM location_communities cm
     JOIN location_districts d ON d.id = cm.district_id
     JOIN location_counties c ON c.id = d.county_id
     WHERE cm.district_id = ? AND cm.normalized_name LIKE ?
     ORDER BY cm.usage_count DESC, cm.name ASC
     LIMIT ?`,
    [districtId, pattern, lim]
  );
  return mapCommunityRows(rows);
}

/**
 * Find or create a community. Normalizes the name, checks for duplicates,
 * increments usage_count if it already exists.
 */
export async function findOrCreateCommunity(
  districtId: number,
  rawName: string
): Promise<{ community: CommunityRow; created: boolean }> {
  await ensureLocationTables();
  const name = rawName.trim().slice(0, 200);
  const norm = normalizeCommunityName(name);
  if (!norm || norm.length < 2) throw new Error('Community name too short');

  const [existing] = await pool.execute<RowDataPacket[]>(
    `SELECT id, name, normalized_name, district_id, status, usage_count
     FROM location_communities
     WHERE district_id = ? AND normalized_name = ?
     LIMIT 1`,
    [districtId, norm]
  );

  if (existing.length > 0) {
    if (IS_POSTGRES) {
      await pool.execute(
        `UPDATE location_communities SET usage_count = usage_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [existing[0].id]
      );
    } else {
      await pool.execute(
        `UPDATE location_communities SET usage_count = usage_count + 1 WHERE id = ?`,
        [existing[0].id]
      );
    }
    return {
      community: {
        id: Number(existing[0].id),
        name: String(existing[0].name),
        normalized_name: norm,
        district_id: districtId,
        status: String(existing[0].status) as CommunityStatus,
        usage_count: Number(existing[0].usage_count) + 1,
      },
      created: false,
    };
  }

  let id = 0;
  if (IS_POSTGRES) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `INSERT INTO location_communities (name, normalized_name, district_id, status, usage_count)
       VALUES (?, ?, ?, 'unverified', 1)
       RETURNING id`,
      [name, norm, districtId]
    );
    id = Number(rows[0]?.id || 0);
  } else {
    const [result] = await pool.execute(
      `INSERT INTO location_communities (name, normalized_name, district_id, status, usage_count)
       VALUES (?, ?, ?, 'unverified', 1)`,
      [name, norm, districtId]
    );
    id = Number((result as { insertId?: number }).insertId || 0);
  }

  return {
    community: { id, name, normalized_name: norm, district_id: districtId, status: 'unverified', usage_count: 1 },
    created: true,
  };
}

/** Fuzzy "did you mean" check across all communities in a district. */
export async function findSimilarCommunities(
  districtId: number,
  rawName: string,
  limit = 5
): Promise<CommunityRow[]> {
  await ensureLocationTables();
  const norm = normalizeCommunityName(rawName);
  if (!norm || norm.length < 2) return [];

  const prefix = norm.slice(0, 3);
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT cm.id, cm.name, cm.normalized_name, cm.district_id, cm.status, cm.usage_count,
            d.name AS district_name, c.name AS county_name
     FROM location_communities cm
     JOIN location_districts d ON d.id = cm.district_id
     JOIN location_counties c ON c.id = d.county_id
     WHERE cm.district_id = ? AND cm.normalized_name LIKE ?
     ORDER BY cm.usage_count DESC
     LIMIT ?`,
    [districtId, `${prefix}%`, Math.min(20, limit)]
  );
  return mapCommunityRows(rows);
}

/** Increment usage_count for an existing community. */
export async function incrementCommunityUsage(communityId: number): Promise<void> {
  await ensureLocationTables();
  if (IS_POSTGRES) {
    await pool.execute(
      `UPDATE location_communities SET usage_count = usage_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [communityId]
    );
  } else {
    await pool.execute(
      `UPDATE location_communities SET usage_count = usage_count + 1 WHERE id = ?`,
      [communityId]
    );
  }
}

// ── backfill from old community catalog ──────────────────────────────────────

export async function backfillFromOldCatalog(): Promise<number> {
  await seedLocationData();
  let count = 0;
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT county, district_key, community, use_count FROM liberia_district_communities
       ORDER BY use_count DESC
       LIMIT 5000`
    );
    for (const row of rows) {
      const countyName = String(row.county || '').trim();
      const districtName = String(row.district_key || '').trim();
      const communityName = String(row.community || '').trim();
      if (!countyName || !communityName) continue;

      const countyId = await getCountyIdByName(countyName);
      if (!countyId) continue;

      let districtId: number | null = null;
      if (districtName) {
        districtId = await getDistrictIdByName(countyId, districtName);
      }
      if (!districtId) {
        const districts = await getDistrictsByCountyId(countyId, ['approved', 'pending']);
        districtId = districts[0]?.id || null;
      }
      if (!districtId) continue;

      try {
        await findOrCreateCommunity(districtId, communityName);
        count++;
      } catch { /* skip duplicates and errors */ }
    }
  } catch { /* table might not exist */ }
  return count;
}

// ── helpers ──────────────────────────────────────────────────────────────────

function mapCommunityRows(rows: RowDataPacket[]): CommunityRow[] {
  return rows.map((r) => ({
    id: Number(r.id),
    name: String(r.name),
    normalized_name: String(r.normalized_name),
    district_id: Number(r.district_id),
    district_name: r.district_name ? String(r.district_name) : undefined,
    county_name: r.county_name ? String(r.county_name) : undefined,
    status: String(r.status) as CommunityStatus,
    usage_count: Number(r.usage_count),
  }));
}
