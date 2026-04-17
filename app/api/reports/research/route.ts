import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';
import { ensureReportsTable, parseBool, parsePagination, ReportRecord } from '../_lib';
import { getCensusReportsAccessFlags, isCensusReportsBlockedForRole } from '@/lib/census-reports-access';

type ResearchFilters = {
  county: string;
  district: string;
  electoralDistrict: string;
  community: string;
  surveyType: string;
  dateFrom: string;
  dateTo: string;
  status: string;
  isUrgent: boolean | null;
  sortBy: 'date_of_visit' | 'created_at' | 'malaria_cases' | 'households_surveyed' | 'community' | 'county' | 'status';
  sortDir: 'asc' | 'desc';
  page: number;
  limit: number;
  offset: number;
  defaultDateWindow: boolean;
  includeAggregates: boolean;
};

function extractFilters(request: NextRequest): ResearchFilters {
  const { searchParams } = new URL(request.url);
  const rawSortBy = String(searchParams.get('sort_by') || '').trim().toLowerCase();
  const rawSortDir = String(searchParams.get('sort_dir') || '').trim().toLowerCase();
  const sortByMap: Record<string, ResearchFilters['sortBy']> = {
    date_of_visit: 'date_of_visit',
    created_at: 'created_at',
    malaria_cases: 'malaria_cases',
    households_surveyed: 'households_surveyed',
    community: 'community',
    county: 'county',
    status: 'status',
  };
  const sortBy = sortByMap[rawSortBy] || 'date_of_visit';
  const sortDir: ResearchFilters['sortDir'] = rawSortDir === 'asc' ? 'asc' : 'desc';

  let dateFrom = String(searchParams.get('date_from') || '').trim();
  let dateTo = String(searchParams.get('date_to') || '').trim();
  const allTime = searchParams.get('all_time') === '1' || searchParams.get('all_time') === 'true';
  let defaultDateWindow = false;
  if (!dateFrom && !dateTo && !allTime) {
    const today = new Date();
    const to = today.toISOString().slice(0, 10);
    const from = new Date(today);
    from.setDate(from.getDate() - 90);
    dateFrom = from.toISOString().slice(0, 10);
    dateTo = to;
    defaultDateWindow = true;
  }

  const aggregatesParam = searchParams.get('aggregates');
  const includeAggregates =
    aggregatesParam !== '0' && aggregatesParam !== 'false' && searchParams.get('light') !== '1';

  return {
    county: String(searchParams.get('county') || '').trim(),
    district: String(searchParams.get('district') || '').trim(),
    electoralDistrict: String(searchParams.get('electoral_district') || '').trim(),
    community: String(searchParams.get('community') || '').trim(),
    surveyType: String(searchParams.get('survey_type') || '').trim().toLowerCase(),
    dateFrom,
    dateTo,
    status: String(searchParams.get('status') || '').trim(),
    isUrgent: parseBool(searchParams.get('is_urgent')),
    sortBy,
    sortDir,
    ...parsePagination(searchParams),
    defaultDateWindow,
    includeAggregates,
  };
}

function buildWhere(filters: ResearchFilters) {
  let where = 'WHERE 1=1';
  const params: unknown[] = [];
  const push = (clause: string, value: unknown) => {
    where += ` AND ${clause}`;
    params.push(value);
  };

  if (filters.county) push('LOWER(r.county) LIKE LOWER(?)', `%${filters.county}%`);
  if (filters.district) push('LOWER(COALESCE(r.district, \'\')) LIKE LOWER(?)', `%${filters.district}%`);
  if (filters.electoralDistrict) {
    push('LOWER(COALESCE(r.electoral_district, \'\')) LIKE LOWER(?)', `%${filters.electoralDistrict}%`);
  }
  if (filters.community) push('LOWER(r.community) LIKE LOWER(?)', `%${filters.community}%`);
  if (filters.surveyType) push('LOWER(r.survey_type) = LOWER(?)', filters.surveyType);
  if (filters.dateFrom) push('r.date_of_visit >= ?', filters.dateFrom);
  if (filters.dateTo) push('r.date_of_visit <= ?', filters.dateTo);
  if (filters.status) {
    push('LOWER(r.status) = LOWER(?)', filters.status);
  } else {
    where += ` AND LOWER(r.status) <> 'withdrawn'`;
  }
  if (filters.isUrgent !== null) push('r.is_urgent = ?', filters.isUrgent);

  return { where, params };
}

async function runResearchQuery(filters: ResearchFilters, usePgWeek = false) {
  const { where, params } = buildWhere(filters);
  const sortColumnMap: Record<ResearchFilters['sortBy'], string> = {
    date_of_visit: 'r.date_of_visit',
    created_at: 'r.created_at',
    malaria_cases: 'r.malaria_cases',
    households_surveyed: 'r.households_surveyed',
    community: 'r.community',
    county: 'r.county',
    status: 'r.status',
  };
  const primarySort = `${sortColumnMap[filters.sortBy]} ${filters.sortDir.toUpperCase()}`;
  const tieSort = `r.created_at DESC, r.id DESC`;

  const weeklySql = usePgWeek
    ? `SELECT
         TO_CHAR(r.date_of_visit, 'IYYY-IW') AS week,
         COUNT(*) AS reports_count,
         COALESCE(SUM(r.malaria_cases), 0) AS malaria_cases
       FROM reports r
       ${where}
       GROUP BY TO_CHAR(r.date_of_visit, 'IYYY-IW')
       ORDER BY week DESC
       LIMIT 104`
    : `SELECT
         DATE_FORMAT(r.date_of_visit, '%x-%v') AS week,
         COUNT(*) AS reports_count,
         COALESCE(SUM(r.malaria_cases), 0) AS malaria_cases
       FROM reports r
       ${where}
       GROUP BY DATE_FORMAT(r.date_of_visit, '%x-%v')
       ORDER BY week DESC
       LIMIT 104`;

  const listQuery = pool.execute<ReportRecord[]>(
    `SELECT
      r.id,
      r.user_id,
      COALESCE(u.full_name, 'Census User') AS collector_name,
      COALESCE(u.email, '') AS collector_email,
      r.date_of_visit,
      r.county, r.district, r.electoral_district, r.community, r.location_landmark,
      r.households_surveyed,
      r.malaria_cases, r.fever_cases, r.children_under_5, r.pregnant_women,
      r.notes, r.correction_note, r.gps_lat, r.gps_lng, r.is_urgent, r.status, r.survey_type, r.data, r.created_at, r.updated_at
    FROM reports r
    LEFT JOIN users u ON u.id = r.user_id
    ${where}
    ORDER BY ${primarySort}, ${tieSort}
    LIMIT ? OFFSET ?`,
    [...params, filters.limit, filters.offset]
  );

  const totalsQuery = pool.execute<RowDataPacket[]>(
    `SELECT
      COUNT(*) AS total_reports,
      COALESCE(SUM(r.malaria_cases), 0) AS total_malaria_cases,
      COALESCE(SUM(CASE WHEN r.is_urgent THEN 1 ELSE 0 END), 0) AS urgent_reports_count
     FROM reports r
     ${where}`,
    params
  );

  const agg = filters.includeAggregates;

  const [listResult, totalsResult, dailyResult, weeklyResult, locationResult, mapResult] = await Promise.all([
    listQuery,
    totalsQuery,
    agg
      ? pool.execute<RowDataPacket[]>(
          `SELECT
            r.date_of_visit AS day,
            COUNT(*) AS reports_count,
            COALESCE(SUM(r.malaria_cases), 0) AS malaria_cases
           FROM reports r
           ${where}
           GROUP BY r.date_of_visit
           ORDER BY r.date_of_visit DESC
           LIMIT 180`,
          params
        )
      : Promise.resolve([[] as RowDataPacket[], []]),
    agg ? pool.execute<RowDataPacket[]>(weeklySql, params) : Promise.resolve([[] as RowDataPacket[], []]),
    agg
      ? pool.execute<RowDataPacket[]>(
          `SELECT
            r.county,
            COALESCE(r.district, '') AS district,
            COUNT(*) AS reports_count,
            COALESCE(SUM(r.malaria_cases), 0) AS malaria_cases
           FROM reports r
           ${where}
           GROUP BY r.county, r.district
           ORDER BY reports_count DESC, r.county ASC, r.district ASC`,
          params
        )
      : Promise.resolve([[] as RowDataPacket[], []]),
    agg
      ? pool.execute<RowDataPacket[]>(
          `SELECT
            r.id, r.date_of_visit,
            r.county, r.district, r.community,
            r.gps_lat, r.gps_lng,
            r.is_urgent, r.created_at
           FROM reports r
           ${where}
           AND r.gps_lat IS NOT NULL
           AND r.gps_lng IS NOT NULL
           ORDER BY r.date_of_visit DESC, r.created_at DESC
           LIMIT 1000`,
          params
        )
      : Promise.resolve([[] as RowDataPacket[], []]),
  ]);

  const [reports] = listResult;
  const [totals] = totalsResult;
  const dailyRows = dailyResult[0] as RowDataPacket[];
  const weeklyRows = weeklyResult[0] as RowDataPacket[];
  const locationRows = locationResult[0] as RowDataPacket[];
  const mapRows = mapResult[0] as RowDataPacket[];

  const total = Number(totals[0]?.total_reports || 0);
  const totalPages = Math.max(1, Math.ceil(total / filters.limit));

  const parsedReports = reports.map((report) => {
    const data = (report as { data?: unknown }).data;
    if (!data || typeof data === 'object') return report;
    try {
      return {
        ...report,
        data: JSON.parse(String(data)),
      } as ReportRecord;
    } catch {
      return report;
    }
  });

  const surveyTypeSummary = parsedReports.reduce<Record<string, Record<string, number>>>((acc, report) => {
    const type = String((report as { survey_type?: unknown }).survey_type || 'malaria');
    if (!acc[type]) acc[type] = { reports_count: 0 };
    acc[type].reports_count += 1;

    const payload = (report as { data?: unknown }).data;
    if (!payload || typeof payload !== 'object') return acc;
    const json = payload as Record<string, unknown>;

    const numberKey = (key: string) => {
      const n = Number(json[key]);
      return Number.isFinite(n) ? n : 0;
    };
    const stringKey = (key: string) => String(json[key] || '').trim().toLowerCase();
    const booleanKey = (key: string) => {
      if (typeof json[key] === 'boolean') return json[key] as boolean;
      return false;
    };

    if (type === 'health') {
      acc[type].total_diarrhea_cases = (acc[type].total_diarrhea_cases || 0) + numberKey('diarrhea_cases');
      acc[type].total_respiratory_cases = (acc[type].total_respiratory_cases || 0) + numberKey('respiratory_cases');
      acc[type].total_fever_cases = (acc[type].total_fever_cases || 0) + numberKey('fever_cases');
      acc[type].total_clinic_visits = (acc[type].total_clinic_visits || 0) + numberKey('clinic_visits');
    } else if (type === 'maternal_child_health') {
      acc[type].total_pregnant_women = (acc[type].total_pregnant_women || 0) + numberKey('pregnant_women');
      acc[type].total_antenatal_visits = (acc[type].total_antenatal_visits || 0) + numberKey('antenatal_visits');
      acc[type].total_facility_births = (acc[type].total_facility_births || 0) + numberKey('facility_births');
      acc[type].total_home_births = (acc[type].total_home_births || 0) + numberKey('home_births');
    } else if (type === 'nutrition') {
      acc[type].total_children_screened = (acc[type].total_children_screened || 0) + numberKey('children_screened');
      acc[type].total_malnourished_children =
        (acc[type].total_malnourished_children || 0) +
        numberKey('malnourished_children') +
        numberKey('malnourished');
      acc[type].total_households_with_food_shortage =
        (acc[type].total_households_with_food_shortage || 0) + numberKey('households_with_food_shortage');
    } else if (type === 'wash') {
      const waterSource = stringKey('water_source');
      const safeWater = ['piped', 'well', 'borehole'].includes(waterSource);
      acc[type].safe_water_reports = (acc[type].safe_water_reports || 0) + (safeWater ? 1 : 0);
      acc[type].handwashing_available_reports =
        (acc[type].handwashing_available_reports || 0) + (booleanKey('handwashing_available') ? 1 : 0);
    }
    return acc;
  }, {});

  if (surveyTypeSummary.nutrition) {
    const screened = surveyTypeSummary.nutrition.total_children_screened || 0;
    const malnourished = surveyTypeSummary.nutrition.total_malnourished_children || 0;
    surveyTypeSummary.nutrition.malnutrition_rate_pct = screened > 0 ? Number(((malnourished / screened) * 100).toFixed(2)) : 0;
  }
  if (surveyTypeSummary.wash) {
    const washReports = surveyTypeSummary.wash.reports_count || 0;
    const safeWaterReports = surveyTypeSummary.wash.safe_water_reports || 0;
    surveyTypeSummary.wash.safe_water_pct = washReports > 0 ? Number(((safeWaterReports / washReports) * 100).toFixed(2)) : 0;
  }

  return {
    reports: parsedReports,
    stats: {
      total_reports: Number(totals[0]?.total_reports || 0),
      total_malaria_cases: Number(totals[0]?.total_malaria_cases || 0),
      urgent_reports_count: Number(totals[0]?.urgent_reports_count || 0),
    },
    survey_type_summary: surveyTypeSummary,
    time_series: {
      daily: dailyRows,
      weekly: weeklyRows,
    },
    location_breakdown: locationRows,
    map_points: mapRows,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      total_pages: totalPages,
    },
    filters_applied: {
      county: filters.county || null,
      district: filters.district || null,
      community: filters.community || null,
      survey_type: filters.surveyType || null,
      date_from: filters.dateFrom || null,
      date_to: filters.dateTo || null,
      is_urgent: filters.isUrgent,
      status: filters.status || null,
      sort_by: filters.sortBy,
      sort_dir: filters.sortDir,
      default_date_window_90d: filters.defaultDateWindow,
      include_aggregates: filters.includeAggregates,
    },
  };
}

// GET /api/reports/research
// researcher read-only endpoint with filtering, pagination, and aggregation
export async function GET(request: NextRequest) {
  try {
    await ensureReportsTable();
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['researcher', 'admin', 'management'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden - researcher, admin, or management role required' }, { status: 403 });
    }

    const accessFlags = await getCensusReportsAccessFlags();
    if (isCensusReportsBlockedForRole(user.role, accessFlags)) {
      return NextResponse.json(
        { error: 'Access to census reports is temporarily disabled for your role.' },
        { status: 403 }
      );
    }

    const filters = extractFilters(request);
    const data = await runResearchQuery(filters, false);
    return NextResponse.json(data);
  } catch (error) {
    const message = String((error as { message?: unknown })?.message || '');
    if (message.toLowerCase().includes('date_format')) {
      try {
        const filters = extractFilters(request);
        const data = await runResearchQuery(filters, true);
        return NextResponse.json(data);
      } catch (fallbackError) {
        console.error('Error fetching research reports (fallback):', fallbackError);
        return NextResponse.json({ error: 'Failed to fetch research reports' }, { status: 500 });
      }
    }

    console.error('Error fetching research reports:', error);
    return NextResponse.json({ error: 'Failed to fetch research reports' }, { status: 500 });
  }
}
