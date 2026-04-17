import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/middleware';
import {
  getDistrictsByCountyId,
  createDistrict,
  getCountyIdByName,
  type DistrictStatus,
} from '@/lib/locations/location-db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const countyIdRaw = searchParams.get('county_id');
    const countyNameRaw = searchParams.get('county');

    let countyId = Number(countyIdRaw || 0);
    if (!countyId && countyNameRaw) {
      countyId = (await getCountyIdByName(countyNameRaw)) || 0;
    }
    if (!countyId) {
      return NextResponse.json({ error: 'county_id or county name required' }, { status: 400 });
    }

    const statuses: DistrictStatus[] = ['approved', 'pending'];
    const districts = await getDistrictsByCountyId(countyId, statuses);
    return NextResponse.json({ districts });
  } catch (error) {
    console.error('GET /api/location/districts:', error);
    return NextResponse.json({ error: 'Failed to load districts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const countyId = Number(body?.county_id || 0);
    const name = String(body?.name || '').trim();

    if (!countyId || !name) {
      return NextResponse.json({ error: 'county_id and name are required' }, { status: 400 });
    }
    if (name.length < 2 || name.length > 160) {
      return NextResponse.json({ error: 'District name must be 2–160 characters' }, { status: 400 });
    }

    const status: DistrictStatus =
      ['admin', 'researcher'].includes(user.role) ? 'approved' : 'pending';

    const district = await createDistrict(countyId, name, status);
    return NextResponse.json({ district, created: true }, { status: 201 });
  } catch (error) {
    console.error('POST /api/location/districts:', error);
    return NextResponse.json({ error: 'Failed to create district' }, { status: 500 });
  }
}
