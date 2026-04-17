/**
 * House of Representatives electoral districts (NEC 2023 apportionment — 73 districts total).
 * @see https://en.wikipedia.org/wiki/House_of_Representatives_of_Liberia (seat distribution)
 * @see https://necliberia.org/edistrict_23.php (maps per district)
 *
 * Montserrado: 17 districts with MED-* ids and optional admin-district narrowing.
 * Other counties: NEC district count per county; ids are {PREFIX}-{NN} (e.g. BOMI-01).
 * Where we do not yet map an ED to LISGIS/admin names, the district dropdown uses the full merged county list.
 */

import { mergeDistrictsForCounty } from '@/lib/locations/liberia';
import { LIBERIA_COUNTIES } from '@/lib/locations/liberia';
import {
  NON_MONT_ADMIN_DISTRICTS_BY_ED,
  NON_MONT_ELECTORAL_OPTIONS_BY_COUNTY,
  NON_MONT_SEED_COMMUNITIES_BY_ED,
} from '@/lib/locations/liberia-electoral-non-montserrado';

export type ElectoralOption = { readonly id: string; readonly label: string };

/** NEC 2023 number of House seats per county (must sum to 73). */
export const NEC_HOR_SEAT_COUNT_BY_COUNTY: Readonly<Record<string, number>> = {
  Bomi: 3,
  Bong: 7,
  Gbarpolu: 3,
  'Grand Bassa': 5,
  'Grand Cape Mount': 3,
  'Grand Gedeh': 3,
  'Grand Kru': 2,
  Lofa: 5,
  Margibi: 5,
  Maryland: 3,
  Montserrado: 17,
  Nimba: 9,
  'River Cess': 2,
  'River Gee': 3,
  Sinoe: 3,
};

/** Stable id prefix per county (Montserrado uses MED-* for historical compatibility). */
const ED_ID_PREFIX_BY_COUNTY: Readonly<Record<string, string>> = {
  Bomi: 'BOMI',
  Bong: 'BONG',
  Gbarpolu: 'GBAR',
  'Grand Bassa': 'GBAS',
  'Grand Cape Mount': 'GCM',
  'Grand Gedeh': 'GGED',
  'Grand Kru': 'GKRU',
  Lofa: 'LOFA',
  Margibi: 'MARG',
  Maryland: 'MARY',
  Montserrado: 'MED',
  Nimba: 'NIMB',
  'River Cess': 'RCES',
  'River Gee': 'RGEE',
  Sinoe: 'SINO',
};

/**
 * Montserrado: 17 House districts (MED-01 … MED-17). Labels & geography follow published NEC constituency
 * descriptions (see Wikipedia “Montserrado-1” … “Montserrado-17” and NEC maps). Stable ids for analytics.
 */
export const MONTSERRADO_ELECTORAL_DISTRICTS: readonly ElectoralOption[] = [
  { id: 'MED-01', label: 'ED 1 – Todee & Careysburg districts' },
  { id: 'MED-02', label: 'ED 2 – Johnsonville & Paynesville (Double Bridge, Jacob Town, Zinc Factory)' },
  { id: 'MED-03', label: 'ED 3 – Paynesville (Morris Farm, Wood Camp, Pipe Line, Neezoe)' },
  { id: 'MED-04', label: 'ED 4 – Paynesville (Duport Road, Kemah/Omega, Joe Bar)' },
  { id: 'MED-05', label: 'ED 5 – Paynesville & Congo Town (Red Light, 72nd, Swankamore, Pagos Island)' },
  { id: 'MED-06', label: 'ED 6 – Paynesville (Rehab/Borbor, ELWA, GSA Road Rockville, Kpelle Town)' },
  { id: 'MED-07', label: 'ED 7 – West Point & downtown Monrovia' },
  { id: 'MED-08', label: 'ED 8 – Monrovia (Capitol Hill, Crown Hill, Jallah Town, Plumkor, …)' },
  { id: 'MED-09', label: 'ED 9 – Monrovia (Fiama, Matadi, Lakpazee, Fish Market, …)' },
  { id: 'MED-10', label: 'ED 10 – Congo Town township (excl. Pagos Island & Swankamore)' },
  { id: 'MED-11', label: 'ED 11 – Eastern Caldwell, Dixville, Barnersville & Gardnersville (parts)' },
  { id: 'MED-12', label: 'ED 12 – Gardnersville & Barnersville (Johnsonville Road A)' },
  { id: 'MED-13', label: 'ED 13 – New Georgia, Gardnersville (St. Michael) & Garglohn (Stockton, Jamaica Rd)' },
  { id: 'MED-14', label: 'ED 14 – South Garglohn (Clara Town, Vai Town, Paity Town, …)' },
  { id: 'MED-15', label: 'ED 15 – North Garglohn & west Caldwell' },
  { id: 'MED-16', label: 'ED 16 – Borough of New Kru Town' },
  { id: 'MED-17', label: 'ED 17 – St. Paul River district' },
] as const;

/**
 * Which administrative district names (from merged Montserrado list) appear in each electoral district.
 * Names must match strings returned by the location DB / merge list (case-insensitive match in UI).
 * Aligned to NEC / Wikipedia “Montserrado-N” constituency summaries (not arbitrary).
 */
export const ADMIN_DISTRICT_NAMES_BY_MONT_ED: Readonly<Record<string, readonly string[]>> = {
  'MED-01': ['Todee', 'Careysburg'],
  'MED-02': ['Johnsonville Township', 'Paynesville Township'],
  'MED-03': ['Paynesville Township'],
  'MED-04': ['Paynesville Township'],
  'MED-05': ['Paynesville Township', 'Congo Town Township'],
  'MED-06': ['Paynesville Township'],
  'MED-07': ['West Point Township', 'Greater Monrovia'],
  'MED-08': ['Greater Monrovia'],
  'MED-09': ['Greater Monrovia'],
  'MED-10': ['Congo Town Township'],
  'MED-11': ['Caldwell Township', 'Barnersville Township', 'Gardnersville Township'],
  'MED-12': ['Gardnersville Township', 'Barnersville Township'],
  'MED-13': ['New Georgia Township', 'Gardnersville Township', 'Garglohn Township'],
  'MED-14': ['Garglohn Township'],
  'MED-15': ['Garglohn Township', 'Caldwell Township'],
  'MED-16': ['Borough of New Kru Town'],
  'MED-17': ['St. Paul River'],
};

/** Well-known communities / places to suggest per Montserrado electoral district (from NEC locality lists). */
export const SEED_COMMUNITIES_BY_MONT_ED: Readonly<Record<string, readonly string[]>> = {
  'MED-01': ['Todee', 'Careysburg'],
  'MED-02': ['Johnsonville', 'Double Bridge', 'Jacob Town', 'Zinc Factory'],
  'MED-03': ['Morris Farm', 'Wood Camp', 'Pipe Line', 'Neezoe'],
  'MED-04': ['Duport Road', 'Kemah Town', 'Omega', 'Paynesville Joe Bar', 'Soul Clinc'],
  'MED-05': ['Red Light', '72nd Community', 'Police Academy', 'Bassa Town', 'Swankamore', 'Pagos Island'],
  'MED-06': ['Rehab', 'Borbor Town', 'S. D. Cooper', 'King Gray-ELWA', 'GSA Road Rockville', 'Kpelle Town'],
  'MED-07': ['West Point', 'Mamba Point', 'Snapper Hill', 'Waterside', 'Randall Street'],
  'MED-08': ['Capitol Hill', 'Crown Hill', 'Jallah Town', 'Plumkor', 'Saye Town Slipway'],
  'MED-09': ['Fiama', 'Fiama East', 'Old Matadi', 'New Matadi', 'Fish Market', 'Central Lakpazee'],
  'MED-10': ['Congo Town', 'PHP community', 'Airfield'],
  'MED-11': ['Caldwell Market', 'Upper Caldwell', 'Dixville', 'Cassava Hill', 'Samukai Town'],
  'MED-12': ['Chicken Soup Factory', 'Stephen Tolbert Estate', 'J.J.Y. Snow Hill', 'Johnsonville Road A'],
  'MED-13': ['New Georgia', 'St. Michael', 'Stockton Creek', 'Jamaica Road'],
  'MED-14': ['Central Clara Town', 'Vai Town', 'Clara Town', 'Paity Town', 'Peugeot Garage'],
  'MED-15': ['Blamo Town', 'Zinc Camp', 'Central Caldwell', 'Lower Caldwell A', 'Zondo Town'],
  'MED-16': ['Bushrod Island', 'New Kru Town central'],
  'MED-17': ['St. Paul River', 'Marshall', 'Cocoa Colony'],
};

function buildGenericCountyElectoralOptions(countyCanonical: string): ElectoralOption[] {
  const n = NEC_HOR_SEAT_COUNT_BY_COUNTY[countyCanonical];
  const prefix = ED_ID_PREFIX_BY_COUNTY[countyCanonical];
  if (!n || n < 1 || !prefix) return [];
  const out: ElectoralOption[] = [];
  for (let i = 1; i <= n; i += 1) {
    const id = `${prefix}-${String(i).padStart(2, '0')}`;
    out.push({
      id,
      label: `${countyCanonical} – Electoral district ${i} (NEC)`,
    });
  }
  return out;
}

/** Suggested places when we do not have per-ED NEC mapping (county-level hints). */
const SEED_COMMUNITIES_BY_COUNTY: Readonly<Record<string, readonly string[]>> = {
  Bomi: ['Tubmanburg', 'Dewoin', 'Klay'],
  Bong: ['Gbarnga', 'Suakoko', 'Salala'],
  Gbarpolu: ['Bopolu', 'Gbarma'],
  'Grand Bassa': ['Buchanan', 'Commonwealth'],
  'Grand Cape Mount': ['Robertsport', 'Garwula', 'Sinje'],
  'Grand Gedeh': ['Zwedru', 'Tchien'],
  'Grand Kru': ['Barclayville', 'Sasstown'],
  Lofa: ['Voinjama', 'Zorzor', 'Kolahun'],
  Margibi: ['Kakata', 'Firestone'],
  Maryland: ['Harper', 'Pleebo'],
  Nimba: ['Sanniquellie', 'Ganta', 'Saclepea'],
  'River Cess': ['Cestos City', 'River Cess'],
  'River Gee': ['Fish Town', 'Karforh'],
  Sinoe: ['Greenville', 'Sinoe'],
};

export const ELECTORAL_DISTRICTS_BY_COUNTY: Readonly<Record<string, readonly ElectoralOption[]>> = (() => {
  const out: Record<string, readonly ElectoralOption[]> = {};
  for (const c of LIBERIA_COUNTIES) {
    if (c === 'Montserrado') {
      out[c] = MONTSERRADO_ELECTORAL_DISTRICTS;
    } else {
      const explicit = NON_MONT_ELECTORAL_OPTIONS_BY_COUNTY[c];
      out[c] = explicit ?? buildGenericCountyElectoralOptions(c);
    }
  }
  return out;
})();

export function getElectoralOptionsForCounty(countyCanonical: string): ElectoralOption[] {
  const list = ELECTORAL_DISTRICTS_BY_COUNTY[countyCanonical];
  return list ? [...list] : [];
}

/**
 * Admin district names allowed for this county + electoral district (narrows district dropdown).
 * Montserrado MED-* and a subset of non-Montserrado House districts use static maps; elsewhere the full merged
 * county list is shown until per-ED maps are added from NEC boundary data.
 */
export function getAdminDistrictNamesForElectoral(
  countyCanonical: string,
  electoralId: string | null | undefined
): string[] {
  if (!electoralId || !countyCanonical) return [];
  if (electoralId.startsWith('MED-')) {
    const list = ADMIN_DISTRICT_NAMES_BY_MONT_ED[electoralId];
    return list ? [...list] : [];
  }
  const nonMont = NON_MONT_ADMIN_DISTRICTS_BY_ED[electoralId];
  if (nonMont?.length) return [...nonMont];
  return mergeDistrictsForCounty(countyCanonical);
}

export function getSeedCommunitiesForElectoral(
  countyCanonical: string,
  electoralId: string | null | undefined
): string[] {
  if (!electoralId) return [];
  if (electoralId.startsWith('MED-')) {
    const list = SEED_COMMUNITIES_BY_MONT_ED[electoralId];
    return list ? [...list] : [];
  }
  const nonMontSeeds = NON_MONT_SEED_COMMUNITIES_BY_ED[electoralId];
  if (nonMontSeeds?.length) return [...nonMontSeeds];
  const county = SEED_COMMUNITIES_BY_COUNTY[countyCanonical];
  return county ? [...county] : [];
}

/** @deprecated Use {@link getAdminDistrictNamesForElectoral}('Montserrado', edId) */
export function adminDistrictNamesForMontElectoral(edId: string | null | undefined): string[] {
  return getAdminDistrictNamesForElectoral('Montserrado', edId);
}

/** @deprecated Use {@link getSeedCommunitiesForElectoral}('Montserrado', edId) */
export function seedCommunitiesForMontElectoral(edId: string | null | undefined): string[] {
  return getSeedCommunitiesForElectoral('Montserrado', edId);
}
