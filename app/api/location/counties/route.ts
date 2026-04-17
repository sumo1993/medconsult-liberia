import { NextResponse } from 'next/server';
import { getAllCounties } from '@/lib/locations/location-db';

export async function GET() {
  try {
    const counties = await getAllCounties();
    return NextResponse.json({ counties });
  } catch (error) {
    console.error('GET /api/location/counties:', error);
    return NextResponse.json({ error: 'Failed to load counties' }, { status: 500 });
  }
}
