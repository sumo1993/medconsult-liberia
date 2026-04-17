import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/middleware';
import {
  searchCommunities,
  findOrCreateCommunity,
  findSimilarCommunities,
  backfillFromOldCatalog,
  seedLocationData,
} from '@/lib/locations/location-db';

let backfillDone = false;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const districtId = Number(searchParams.get('district_id') || 0);
    const search = String(searchParams.get('search') || '').trim();
    const limit = Math.min(20, Math.max(1, Number(searchParams.get('limit') || 10)));

    if (!districtId) {
      return NextResponse.json({ error: 'district_id is required' }, { status: 400 });
    }

    await seedLocationData();

    if (!backfillDone) {
      backfillDone = true;
      void backfillFromOldCatalog().catch((e) => console.warn('Location backfill:', e));
    }

    const communities = await searchCommunities(districtId, search, limit);

    let suggestions: typeof communities = [];
    if (search.length >= 2 && communities.length === 0) {
      suggestions = await findSimilarCommunities(districtId, search, 5);
    }

    return NextResponse.json({ communities, suggestions });
  } catch (error) {
    console.error('GET /api/location/communities:', error);
    return NextResponse.json({ error: 'Failed to load communities' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const districtId = Number(body?.district_id || 0);
    const name = String(body?.name || '').trim();

    if (!districtId) {
      return NextResponse.json({ error: 'district_id is required' }, { status: 400 });
    }
    if (!name || name.length < 2) {
      return NextResponse.json({ error: 'Community name must be at least 2 characters' }, { status: 400 });
    }
    if (name.length > 200) {
      return NextResponse.json({ error: 'Community name too long (max 200)' }, { status: 400 });
    }

    const similar = await findSimilarCommunities(districtId, name, 5);
    const { community, created } = await findOrCreateCommunity(districtId, name);

    return NextResponse.json({
      community,
      created,
      similar_existing: created ? similar : [],
    }, { status: created ? 201 : 200 });
  } catch (error) {
    console.error('POST /api/location/communities:', error);
    return NextResponse.json({ error: 'Failed to create community' }, { status: 500 });
  }
}
