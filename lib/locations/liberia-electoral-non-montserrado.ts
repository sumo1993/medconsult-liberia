/**
 * Non-Montserrado House electoral districts: NEC-aligned labels (Wikipedia extracts),
 * admin-district narrowing where constituency maps cleanly to {@link DISTRICTS_BY_COUNTY} / LISGIS names,
 * and optional community seeds. Where no admin map exists, the UI uses the full merged county list.
 */

import type { ElectoralOption } from '@/lib/locations/liberia-electoral';

export const NON_MONT_ELECTORAL_OPTIONS_BY_COUNTY: Record<string, readonly ElectoralOption[]> = {
  'Bomi': [
    { id: 'BOMI-01', label: "ED 1 \u2013 The district covers Tubmanburg City and Senjeh District (except for the Maher community)." },
    { id: 'BOMI-02', label: "ED 2 \u2013 The district covers the Klay District (except Gonjeh community), as well as the Maher community of Senjeh District \u2026" },
    { id: 'BOMI-03', label: "ED 3 \u2013 The district covers the Seuhn Mecca District, parts of Dewoin District (i.e. the communities of Bonor, Benda, Zohn \u2026" },
  ] as const,
  'Bong': [
    { id: 'BONG-01', label: "ED 1 \u2013 The constituency covers Kpaai District, Boinsen District, Tukpahblee District and Kokoyah District." },
    { id: 'BONG-02', label: "ED 2 \u2013 The constituency covers three wards of Gbanga city (wards 5, 8 and 9), 10 communities of Jorquelleh District (i.e. \u2026" },
    { id: 'BONG-03', label: "ED 3 \u2013 The constituency covers six wards of Gbanga city (wards 1, 2, 3, 4, 6, 7), 7 communities of Jorquelleh District (i.\u2026" },
    { id: 'BONG-04', label: "ED 4 \u2013 The constituency covers Panta District, nine communities of Zota District (Gbansue Sulonmah, Shamkpallai, Belefana,\u2026" },
    { id: 'BONG-05', label: "ED 5 \u2013 The constituency covers Suakoko District and five communities of Yeallequelleh District (i.e. Gbartala, Palala, Fen\u2026" },
    { id: 'BONG-06', label: "ED 6 \u2013 The constituency covers Salala District and four communities of Yeallequelleh District (i.e. Gborkornemah, Zeansue,\u2026" },
    { id: 'BONG-07', label: "ED 7 \u2013 The constituency covers the Fuamah District and the Sanayea District (except the Gou, Laryea and Gbonota communities)." },
  ] as const,
  'Gbarpolu': [
    { id: 'GBAR-01', label: "ED 1 \u2013 The constituency covers Bopolu city, Bopolu District (except Gbelleta community) and two communities of Bokomu Dist\u2026" },
    { id: 'GBAR-02', label: "ED 2 \u2013 The constituency covers Belleh District, Gounwolaila District and six communities of Bokomu District (Mollakwelle, \u2026" },
    { id: 'GBAR-03', label: "ED 3 \u2013 The constituency covers Kongba District, Gbarma District as well as the Gbelleta community of Bopolu District." },
  ] as const,
  'Grand Bassa': [
    { id: 'GBAS-01', label: "ED 1 \u2013 It is located in an eastern portion of Grand Bassa County, bordering Margibi County." },
    { id: 'GBAS-02', label: "ED 2 \u2013 It is located in a central portion of Grand Bassa County, bordering Bong and Margibi counties." },
    { id: 'GBAS-03', label: "ED 3 \u2013 It is located in a central portion of Grand Bassa County, encompassing much of the Buchanan area." },
    { id: 'GBAS-04', label: "ED 4 \u2013 It is located in a north-western portion of Grand Bassa County, bordering Bong, Nimba, and Rivercess counties." },
    { id: 'GBAS-05', label: "ED 5 \u2013 It is located in a south-western portion of Grand Bassa County, bordering Rivercess County." },
  ] as const,
  'Grand Cape Mount': [
    { id: 'GCM-01', label: "ED 1 \u2013 The constituency covers Gola Konneh District (except Jenne Brown community) and Porkpa District (except Dazanbo com\u2026" },
    { id: 'GCM-02', label: "ED 2 \u2013 The constituency covers Robertsport City, Garwula District, the Jenne Brown community of Gola Konneh District and M\u2026" },
    { id: 'GCM-03', label: "ED 3 \u2013 The constituency covers Tewor District, four communities of the Robertsport Commonwealth District (Weima, Tallah Ge\u2026" },
  ] as const,
  'Grand Gedeh': [
    { id: 'GGED-01', label: "ED 1 \u2013 The constituency covers Zwedru city." },
    { id: 'GGED-02', label: "ED 2 \u2013 The constituency covers Glio-Twarbo District, Konobo District, Putu District, Tchien District and the Lower Gorbo c\u2026" },
    { id: 'GGED-03', label: "ED 3 \u2013 The constituency covers B\u2019hai District, Gbao District, Gboe-Ploe District and Cavalla District (except the Lower Go\u2026" },
  ] as const,
  'Grand Kru': [
    { id: 'GKRU-01', label: "ED 1 \u2013 The constituency covers Bleebo District, the Trehn District, the Garraway District, the Grand Cess Wedabo District \u2026" },
    { id: 'GKRU-02', label: "ED 2 \u2013 The constituency covers Barclayville city, Forpoh District, Wlogba District, Dweh District, Fenetow District, Kpi D\u2026" },
  ] as const,
  'Lofa': [
    { id: 'LOFA-01', label: "ED 1 \u2013 The constituency covers the northern parts of Foya District, i.e. the communities of Borliloe, Lepaloe, Ndehuma, Ye\u2026" },
    { id: 'LOFA-02', label: "ED 2 \u2013 The constituency covers Vahun District, three communities of Kolahun District (Kamatahun, Popalahun, Lehun) and fou\u2026" },
    { id: 'LOFA-03', label: "ED 3 \u2013 The constituency covers Kolahun District (except the communities of Kamatahun, Popalahun and Lehun) and parts of Vo\u2026" },
    { id: 'LOFA-04', label: "ED 4 \u2013 The constituency covers Voinjama City, Quardu Gboni District, six communities of Voinjama District (Worbalamai, Kes\u2026" },
    { id: 'LOFA-05', label: "ED 5 \u2013 The constituency covers Salayea District and Zorzor District (except Konia and Barziwen)." },
  ] as const,
  'Margibi': [
    { id: 'MARG-01', label: "ED 1 \u2013 The constituency covers Marshall city as well as eight communities of Mamabah-Kaba District; Loongaye, Karfeah, Gar\u2026" },
    { id: 'MARG-02', label: "ED 2 \u2013 The constituency covers four communities of Mamabah-Kaba District; Cotton Tree, Dolo Town, Unification and Central \u2026" },
    { id: 'MARG-03', label: "ED 3 \u2013 It is located in a central portion of Margibi County, bordering Montserrado and Grand Bassa counties." },
    { id: 'MARG-04', label: "ED 4 \u2013 It is located in a north-western portion of Margibi County, bordering Montserrado and Bong counties." },
    { id: 'MARG-05', label: "ED 5 \u2013 It is located in a north-eastern portion of Margibi County, bordering Grand Bassa and Bong counties." },
  ] as const,
  'Maryland': [
    { id: 'MARY-01', label: "ED 1 \u2013 It is located in a southern portion of Maryland County, encompassing the county's coast, as well as bordering Grand\u2026" },
    { id: 'MARY-02', label: "ED 2 \u2013 It is located in a central portion of Maryland County, bordering Grand Kru County and the Ivory Coast." },
    { id: 'MARY-03', label: "ED 3 \u2013 It is located in a northern portion of Maryland County, bordering River Gee and Grand Kru counties, as well as the \u2026" },
  ] as const,
  'Nimba': [
    { id: 'NIMB-01', label: "ED 1 \u2013 It is located in a north-western portion of Nimba County, bordering Bong County and the Republic of Guinea." },
    { id: 'NIMB-02', label: "ED 2 \u2013 It is located in a northern portion of Nimba County, bordering the Republic of Guinea." },
    { id: 'NIMB-03', label: "ED 3 \u2013 It is located in a northern portion of Nimba County, bordering the Republic of Guinea and the Ivory Coast." },
    { id: 'NIMB-04', label: "ED 4 \u2013 It is located in a north-eastern portion of Nimba County, bordering the Ivory Coast." },
    { id: 'NIMB-05', label: "ED 5 \u2013 It is located in an eastern portion of Nimba County, bordering the Ivory Coast." },
    { id: 'NIMB-06', label: "ED 6 \u2013 It is located in an eastern portion of Nimba County, bordering Grand Gedeh County and the Ivory Coast." },
    { id: 'NIMB-07', label: "ED 7 \u2013 It is located in a central portion of Nimba County." },
    { id: 'NIMB-08', label: "ED 8 \u2013 It is located in a western portion of Nimba County, bordering Bong County." },
    { id: 'NIMB-09', label: "ED 9 \u2013 It is located in a southern portion of Nimba County, bordering Bong, Grand Bassa, Rivercess, and Grand Gedeh counties." },
  ] as const,
  'River Cess': [
    { id: 'RCES-01', label: "ED 1 \u2013 It is located in a northern portion of Rivercess County, bordering Grand Bassa, Nimba and Grand Gedeh counties." },
    { id: 'RCES-02', label: "ED 2 \u2013 It is located in a southern portion of Rivercess County, bordering Grand Bassa, Grand Gedeh, and Sinoe counties." },
  ] as const,
  'River Gee': [
    { id: 'RGEE-01', label: "ED 1 \u2013 It is located in an eastern portion of River Gee County, bordering Grand Gedeh, Sinoe, Rivercess, and Grand Kru cou\u2026" },
    { id: 'RGEE-02', label: "ED 2 \u2013 It is located in a central portion of River Gee County, bordering Grand Gedeh, Grand Kru, and Maryland counties." },
    { id: 'RGEE-03', label: "ED 3 \u2013 It is located in a western portion of River Gee County, bordering Grand Gedeh and Maryland counties as well as the \u2026" },
  ] as const,
  'Sinoe': [
    { id: 'SINO-01', label: "ED 1 \u2013 It is located in a south-western portion of Sinoe County, encompassing part of the coast." },
    { id: 'SINO-02', label: "ED 2 \u2013 It is located in an eastern portion of Sinoe County, bordering Grand Gedeh, River Gee, and Grand Kru counties." },
    { id: 'SINO-03', label: "ED 3 \u2013 It is located in a western portion of Sinoe County, bordering Grand Gedeh and Rivercess counties." },
  ] as const,
};

/** Subset of merged admin district names per electoral id (rest → use full county list in UI). */
export const NON_MONT_ADMIN_DISTRICTS_BY_ED: Readonly<Record<string, readonly string[]>> = {
  'BOMI-01': ["Senjeh"],
  'BOMI-02': ["Klay", "Senjeh", "Dewoin"],
  'BOMI-03': ["Mecca", "Dewoin", "Klay"],
  'GBAR-01': ["Bopolu", "Bokomu"],
  'GBAR-02': ["Belle", "Gounwolaila", "Bokomu"],
  'GBAR-03': ["Kongba", "Gbarma", "Bopolu"],
  'GCM-01': ["Gola Konneh", "Porkpa"],
  'GCM-02': ["Commonwealth", "Garwula", "Gola Konneh"],
  'GCM-03': ["Tewor", "Commonwealth", "Porkpa"],
  'GGED-01': ["Zwedru"],
  'GGED-02': ["Konobo", "Tchien", "Webbo", "Gbao", "B\u2019hai"],
  'GGED-03': ["B\u2019hai", "Gbao", "Konobo", "Tchien", "Webbo"],
  'LOFA-01': ["Foya"],
  'LOFA-02': ["Vahun", "Kolahun", "Foya"],
  'LOFA-03': ["Kolahun", "Voinjama"],
  'LOFA-04': ["Voinjama", "Quardu Gboni", "Zorzor"],
  'LOFA-05': ["Salayea", "Zorzor"],
  'MARG-01': ["Lower Margibi", "Mambah-Kaba"],
  'MARG-02': ["Mambah-Kaba"],
};

export const NON_MONT_SEED_COMMUNITIES_BY_ED: Readonly<Record<string, readonly string[]>> = {
  'BOMI-01': ["Tubmanburg", "Senjeh"],
  'BOMI-02': ["Klay", "Maher", "Beh", "Gbaigbon"],
  'BOMI-03': ["Mecca", "Gonjeh", "Bonor"],
  'GBAR-01': ["Bopolu", "Nyeamah", "Gbarngay"],
  'GBAR-02': ["Belleh", "Gounwolaila", "Mollakwelle"],
  'GBAR-03': ["Kongba", "Gbarma", "Gbelleta"],
  'GCM-01': ["Gola Konneh", "Porkpa"],
  'GCM-02': ["Robertsport", "Garwula", "Jenne Brown"],
  'GCM-03': ["Tewor", "Weima", "Dazanbo"],
  'GGED-01': ["Zwedru"],
  'GGED-02': ["Tchien", "Konobo", "Putu"],
  'GGED-03': ["B\u2019hai", "Gbao", "Gboe-Ploe"],
  'LOFA-01': ["Foya", "Borliloe", "Lepaloe"],
  'LOFA-02': ["Vahun", "Kamatahun", "Popalahun"],
  'LOFA-03': ["Kolahun", "Voinjama"],
  'LOFA-04': ["Voinjama", "Quardu Gboni", "Worbalamai"],
  'LOFA-05': ["Salayea", "Zorzor"],
  'MARG-01': ["Marshall", "Loongaye", "Karfeah"],
  'MARG-02': ["Cotton Tree", "Dolo Town", "Unification"],
};
