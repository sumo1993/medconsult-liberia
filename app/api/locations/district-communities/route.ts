import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/middleware';
import { censusFieldAccessDeniedResponse } from '@/lib/census-field-access';
import {
  backfillCommunityCatalogFromReports,
  ensureLiberiaDistrictCommunitiesTable,
  listCommunitiesForDistrict,
} from '@/lib/community-catalog';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getCountyCanonical } from '@/lib/locations/liberia';

let backfillStarted = false;

// GET /api/locations/district-communities?county=Bong&district=...
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['census', 'researcher', 'admin', 'management'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (user.role === 'census') {
      const fieldDenied = await censusFieldAccessDeniedResponse(user);
      if (fieldDenied) return fieldDenied;
    }

    const { searchParams } = new URL(request.url);
    const countyRaw = String(searchParams.get('county') || '').trim();
    const districtRaw = String(searchParams.get('district') || '').trim();
    const limit = Math.min(80, Math.max(1, Number(searchParams.get('limit') || 40)));

    const county = getCountyCanonical(countyRaw);
    if (!county) {
      return NextResponse.json({ error: 'Invalid or missing county' }, { status: 400 });
    }

    await ensureLiberiaDistrictCommunitiesTable();

    if (!backfillStarted) {
      backfillStarted = true;
      const [cntRows] = await pool.execute<RowDataPacket[]>(`SELECT COUNT(*) AS n FROM liberia_district_communities`);
      const n = Number(cntRows[0]?.n || 0);
      if (n === 0) {
        void backfillCommunityCatalogFromReports().catch((err) => console.warn('Community catalog backfill:', err));
      }
    }

    const communities = await listCommunitiesForDistrict(county, districtRaw || null, limit);
    return NextResponse.json({ county, district: districtRaw || null, communities });
  } catch (error) {
    console.error('district-communities GET:', error);
    return NextResponse.json({ error: 'Failed to load communities' }, { status: 500 });
  }
}
