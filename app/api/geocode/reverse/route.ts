import { NextRequest, NextResponse } from 'next/server';

type LiberiaPlace = {
  city: string;
  county: string;
  lat: number;
  lng: number;
};
const LIBERIA_PLACES: LiberiaPlace[] = [
  { city: 'Monrovia', county: 'Montserrado', lat: 6.3005, lng: -10.7969 },
  { city: 'Paynesville', county: 'Montserrado', lat: 6.2897, lng: -10.7421 },
  { city: 'Bensonville', county: 'Montserrado', lat: 6.4472, lng: -10.6125 },
  { city: 'Buchanan', county: 'Grand Bassa', lat: 5.8808, lng: -10.0467 },
  { city: 'Gbarnga', county: 'Bong', lat: 6.9956, lng: -9.4722 },
  { city: 'Kakata', county: 'Margibi', lat: 6.531, lng: -10.3536 },
  { city: 'Ganta', county: 'Nimba', lat: 7.2261, lng: -8.9844 },
  { city: 'Sanniquellie', county: 'Nimba', lat: 7.3622, lng: -8.7061 },
  { city: 'Voinjama', county: 'Lofa', lat: 8.4219, lng: -9.7478 },
  { city: 'Harper', county: 'Maryland', lat: 4.375, lng: -7.7169 },
  { city: 'Greenville', county: 'Sinoe', lat: 5.0111, lng: -9.0389 },
  { city: 'Zwedru', county: 'Grand Gedeh', lat: 6.0685, lng: -8.1286 },
  { city: 'Tubmanburg', county: 'Bomi', lat: 6.8711, lng: -10.8267 },
  { city: 'Robertsport', county: 'Grand Cape Mount', lat: 6.7533, lng: -11.3686 },
  { city: 'Barclayville', county: 'Grand Kru', lat: 4.6742, lng: -8.2339 },
  { city: 'Cestos City', county: 'River Cess', lat: 5.4569, lng: -9.5856 },
  { city: 'Fish Town', county: 'River Gee', lat: 5.1975, lng: -7.8756 },
  { city: 'Bopolu', county: 'Gbarpolu', lat: 7.0667, lng: -10.4875 },
];

const LIBERIA_BOUNDS = {
  minLat: 4.2,
  maxLat: 8.6,
  minLng: -11.7,
  maxLng: -7.2,
};

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function resolveLiberiaOffline(lat: number, lng: number) {
  const inLiberia =
    lat >= LIBERIA_BOUNDS.minLat &&
    lat <= LIBERIA_BOUNDS.maxLat &&
    lng >= LIBERIA_BOUNDS.minLng &&
    lng <= LIBERIA_BOUNDS.maxLng;

  if (!inLiberia) return null;

  let nearest = LIBERIA_PLACES[0];
  let nearestDistance = haversineKm(lat, lng, nearest.lat, nearest.lng);

  for (const place of LIBERIA_PLACES.slice(1)) {
    const distance = haversineKm(lat, lng, place.lat, place.lng);
    if (distance < nearestDistance) {
      nearest = place;
      nearestDistance = distance;
    }
  }

  return {
    city: nearest.city,
    county: nearest.county,
    country: 'Liberia',
    distanceKm: Number(nearestDistance.toFixed(1)),
    location: `${nearest.city}, ${nearest.county}, Liberia`,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = Number(searchParams.get('lat'));
    const lng = Number(searchParams.get('lng'));

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
    }

    const liberiaOffline = resolveLiberiaOffline(lat, lng);
    if (liberiaOffline) {
      return NextResponse.json({
        location: liberiaOffline.location,
        display_name: `${liberiaOffline.location} (nearest mapped area, ~${liberiaOffline.distanceKm} km)`,
        city: liberiaOffline.city,
        state: liberiaOffline.county,
        country: liberiaOffline.country,
        source: 'liberia_offline',
        raw: {
          city: liberiaOffline.city,
          county: liberiaOffline.county,
          country: liberiaOffline.country,
        },
      });
    }

    // Outside Liberia: do not call foreign geocoders (they return e.g. Beijing while the census form uses Liberia counties).
    return NextResponse.json({
      location: 'Outside Liberia',
      display_name:
        'Not in Liberia — GPS is outside Liberia. Clear coordinates or enter latitude/longitude inside Liberia.',
      city: '',
      state: '',
      country: 'Outside Liberia',
      source: 'bounds_reject',
    });
  } catch (error) {
    console.error('[Reverse Geocode] Error:', error);
    return NextResponse.json({ error: 'Reverse geocoding failed' }, { status: 500 });
  }
}
