import { ADMINISTRATIVE_DISTRICTS_BY_COUNTY } from '@/lib/locations/liberia-lisgis-admin-districts';

export const LIBERIA_COUNTIES = [
  'Bomi',
  'Bong',
  'Gbarpolu',
  'Grand Bassa',
  'Grand Cape Mount',
  'Grand Gedeh',
  'Grand Kru',
  'Lofa',
  'Margibi',
  'Maryland',
  'Montserrado',
  'Nimba',
  'River Cess',
  'River Gee',
  'Sinoe',
] as const;

export const DISTRICTS_BY_COUNTY: Record<string, string[]> = {
  Bomi: ['Dewoin', 'Klay', 'Mecca', 'Senjeh'],
  Bong: ['Boinsen', 'Fuamah', 'Jorquelleh', 'Kokoyah', 'Panta', 'Salala', 'Suakoko', 'Yeallequelleh', 'Zota'],
  Gbarpolu: ['Bopolu', 'Bokomu', 'Gbarma', 'Kongba', 'Belle', 'Gounwolaila', 'Mombo'],
  'Grand Bassa': ['Commonwealth', 'District 1', 'District 2', 'District 3', 'District 4', 'Owensgrove', 'St. John River', 'Buchanan'],
  'Grand Cape Mount': ['Commonwealth', 'Garwula', 'Gola Konneh', 'Porkpa', 'Tewor'],
  'Grand Gedeh': ['B’hai', 'Gbao', 'Konobo', 'Tchien', 'Toboe', 'Webbo', 'Zwedru'],
  'Grand Kru': ['Barclayville', 'Buah', 'Dorbor', 'Forpoh', 'Jloh', 'Klao', 'Krao', 'Sasstown'],
  Lofa: ['Foya', 'Kolahun', 'Salayea', 'Vahun', 'Voinjama', 'Wanhassa', 'Quardu Gboni', 'Zorzor'],
  Margibi: ['Firestone', 'Gibi', 'Kakata', 'Mambah-Kaba', 'Lower Margibi'],
  Maryland: ['Barrobo', 'Harper', 'Karluway', 'Pleebo/Sodoken', 'West Ferry'],
  Montserrado: ['Careysburg', 'Greater Monrovia', 'St. Paul River', 'Todee'],
  Nimba: ['Boe & Quilla', 'Garr-Bain', 'Gbehlay-Geh', 'Gbi & Doru', 'Kparblee', 'Saclepea-Mah', 'Sanniquellie-Mah', 'Tappita-Mahn', 'Yarmein', 'Zoe-Geh'],
  'River Cess': ['Bearwro', 'Central River Cess', 'Doedain', 'Fen River', 'Jo River', 'Norwein'],
  'River Gee': ['Chedepo', 'Gbeapo', 'Glaro', 'Karforh', 'Nyenawliken', 'Sarbo'],
  Sinoe: ['Bokon', 'Bodae', 'Butaw', 'Dugbe River', 'Jaedae', 'Kpayan', 'Pynes', 'Sanquin', 'Wedjah'],
};

export type LiberiaCounty = (typeof LIBERIA_COUNTIES)[number];

function normalize(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function getCountyCanonical(value: string): string | null {
  const target = normalize(value);
  return LIBERIA_COUNTIES.find((county) => normalize(county) === target) || null;
}

export function isValidCounty(value: string): boolean {
  return getCountyCanonical(value) !== null;
}

/** Legacy app districts + LISGIS/admin names from {@link ADMINISTRATIVE_DISTRICTS_BY_COUNTY} (extend per county). */
export function mergeDistrictsForCounty(county: string): string[] {
  const canonical = getCountyCanonical(county);
  if (!canonical) return [];
  const base = DISTRICTS_BY_COUNTY[canonical] || [];
  const extra = ADMINISTRATIVE_DISTRICTS_BY_COUNTY[canonical] || [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const d of [...base, ...extra]) {
    const t = d.trim();
    if (!t) continue;
    const low = normalize(t);
    if (seen.has(low)) continue;
    seen.add(low);
    out.push(t);
  }
  return out;
}

export function mergeDistrictsByCountyAll(): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const c of LIBERIA_COUNTIES) {
    out[c] = mergeDistrictsForCounty(c);
  }
  return out;
}

export function isValidDistrictForCounty(county: string, district: string): boolean {
  if (!district.trim()) return true; // optional field
  const canonicalCounty = getCountyCanonical(county);
  if (!canonicalCounty) return false;
  const districts = mergeDistrictsForCounty(canonicalCounty);
  const districtTarget = normalize(district);
  return districts.some((name) => normalize(name) === districtTarget);
}

export function flattenDistricts() {
  return Object.entries(mergeDistrictsByCountyAll()).flatMap(([county, districts]) =>
    districts.map((name) => ({ name, county }))
  );
}

/** Aligned with census reverse-geocode bounds (see api/geocode/reverse). */
const LIBERIA_COORD_BOUNDS = { minLat: 4.2, maxLat: 8.6, minLng: -11.7, maxLng: -7.2 };

/** True if latitude/longitude fall inside Liberia (approximate bounding box). */
export function isCoordinateInLiberia(lat: number, lng: number): boolean {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  return (
    lat >= LIBERIA_COORD_BOUNDS.minLat &&
    lat <= LIBERIA_COORD_BOUNDS.maxLat &&
    lng >= LIBERIA_COORD_BOUNDS.minLng &&
    lng <= LIBERIA_COORD_BOUNDS.maxLng
  );
}
