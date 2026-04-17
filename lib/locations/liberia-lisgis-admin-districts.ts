/**
 * Additional administrative / sub-county district names (LISGIS 2022 LPHC–aligned where cited).
 * Merged with {@link DISTRICTS_BY_COUNTY} so validation and dropdowns accept both legacy app names
 * and official subdivisions. Extend per county from Liberia Institute of Statistics and Geo-Information
 * Services (LISGIS) or https://new.liberiadata.com county profiles.
 *
 * Montserrado: 15 administrative districts (LISGIS / Liberia Data).
 */
export const ADMINISTRATIVE_DISTRICTS_BY_COUNTY: Partial<Record<string, string[]>> = {
  Montserrado: [
    'Careysburg',
    'West Point Township',
    'St. Paul River',
    'Todee',
    'Borough of New Kru Town',
    'Gardnersville Township',
    'Barnersville Township',
    'Lousana Township',
    'Paynesville Township',
    'Congo Town Township',
    'New Georgia Township',
    'Caldwell Township',
    'Greater Monrovia',
    'Garglohn Township',
    'Johnsonville Township',
  ],
};
