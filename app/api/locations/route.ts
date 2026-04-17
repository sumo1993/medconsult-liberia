import { NextResponse } from 'next/server';
import { flattenDistricts, LIBERIA_COUNTIES, mergeDistrictsByCountyAll } from '@/lib/locations/liberia';

// GET /api/locations
export async function GET() {
  const districtsByCounty = mergeDistrictsByCountyAll();
  return NextResponse.json({
    counties: [...LIBERIA_COUNTIES],
    districtsByCounty,
    districts: flattenDistricts(),
  });
}
