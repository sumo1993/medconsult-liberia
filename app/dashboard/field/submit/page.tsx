'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, CheckCircle2, ClipboardList, LocateFixed, MapPin, Send } from 'lucide-react';
import { useRoleRedirect } from '@/hooks/useRoleRedirect';
import ProfileAvatar from '@/components/ProfileAvatar';
import AutoSaveIndicator from '@/components/AutoSaveIndicator';
import { useAutoSave } from '@/hooks/useAutoSave';
import { getCountyCanonical, isCoordinateInLiberia, LIBERIA_COUNTIES } from '@/lib/locations/liberia';
import { getElectoralOptionsForCounty } from '@/lib/locations/liberia-electoral';
import LocationSelector, { type LocationValue } from '@/components/LocationSelector';
import { showAppConfirm } from '@/components/AppDialogsProvider';

interface CensusReport {
  id: number;
  date_of_visit: string;
  county: string;
  district: string | null;
  community: string;
  survey_type?: 'malaria' | 'health' | 'maternal_child_health' | 'wash' | 'nutrition' | 'outbreak';
  data?: Record<string, unknown> | null;
  households_surveyed: number;
  malaria_cases: number;
  fever_cases: number;
  children_under_5: number;
  pregnant_women: number;
  is_urgent: boolean;
  status: 'submitted' | 'reviewed';
  created_at: string;
}

type SubmissionPagination = {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
};

type CensusForm = {
  date_of_visit: string;
  county: string;
  /** NEC House electoral district id (e.g. MED-12, BOMI-01). */
  electoral_district: string;
  district: string;
  community: string;
  survey_type: 'malaria' | 'health' | 'maternal_child_health' | 'wash' | 'nutrition';
  data: {
    diarrhea_cases: number;
    respiratory_cases: number;
    fever_cases: number;
    clinic_visits: number;
    water_source: string;
    toilet_type: string;
    handwashing_available: boolean;
    pregnant_women: number;
    antenatal_visits: number;
    facility_births: number;
    home_births: number;
    children_screened: number;
    malnourished_children: number;
    households_with_food_shortage: number;
  };
  households_surveyed: number;
  malaria_cases: number;
  fever_cases: number;
  children_under_5: number;
  pregnant_women: number;
  gps_lat: number | null;
  gps_lng: number | null;
  is_urgent: boolean;
  notes: string;
  /** Human place description when GPS/geocode is unavailable (works offline). */
  location_landmark: string;
};

const LIBERIA_TIMEZONE = 'Africa/Monrovia';
const CENSUS_DRAFT_KEY = 'census_report_draft_v2';
const CENSUS_OFFLINE_QUEUE_KEY = 'census_report_outbox_v1';
const MAX_NUMERIC = 10000;
const MAX_LANDMARK_CHARS = 500;
const URGENT_MALARIA_THRESHOLD = 10;
const NON_MALARIA_TYPES: Array<'health' | 'maternal_child_health' | 'wash' | 'nutrition'> = [
  'health',
  'maternal_child_health',
  'wash',
  'nutrition',
];
const WATER_SOURCE_OPTIONS = ['well', 'river', 'piped', 'borehole', 'rainwater', 'spring', 'vendor'] as const;
const TOILET_TYPE_OPTIONS = ['pit_latrine', 'flush', 'none', 'vip_latrine', 'composting'] as const;


type ReverseGeocodeResponse = {
  location?: string;
  display_name?: string;
  city?: string;
  state?: string;
  country?: string;
};

type DuplicatePreview = {
  duplicate_exists: boolean;
  existing_report?: {
    id?: number;
    created_at?: string;
  } | null;
};

type CensusAssignment = {
  id: number;
  title: string;
  description: string | null;
  county: string;
  counties?: string[];
  district: string | null;
  community: string | null;
  survey_type: 'malaria' | 'health' | 'maternal_child_health' | 'wash' | 'nutrition';
  due_date: string | null;
  end_date: string | null;
  status: string;
  /** When true, visit location fields are fixed to the survey row (legacy surveys). New surveys default unlocked. */
  location_locked?: boolean | number;
};

type SurveyLocks = {
  malaria: boolean;
  health: boolean;
  maternal_child_health: boolean;
  wash: boolean;
  nutrition: boolean;
};

function normalize(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

export default function CensusDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthorized, isLoading } = useRoleRedirect('census');

  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<CensusReport[]>([]);
  const [submissionsPagination, setSubmissionsPagination] = useState<SubmissionPagination>({
    page: 1,
    limit: 5,
    total: 0,
    total_pages: 1,
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);
  const [submitMode, setSubmitMode] = useState<'default' | 'new'>('default');
  const [locationValue, setLocationValue] = useState<Partial<LocationValue>>({});
  const [resolvedPlaceName, setResolvedPlaceName] = useState('');
  const [resolvingPlace, setResolvingPlace] = useState(false);
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingOutboxCount, setPendingOutboxCount] = useState(0);
  const [duplicatePreview, setDuplicatePreview] = useState<DuplicatePreview | null>(null);
  const [assignment, setAssignment] = useState<CensusAssignment | null>(null);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [openAssignments, setOpenAssignments] = useState<CensusAssignment[]>([]);
  const [surveyLocks, setSurveyLocks] = useState<SurveyLocks>({
    malaria: false,
    health: false,
    maternal_child_health: false,
    wash: false,
    nutrition: false,
  });
  const [form, setForm] = useState<CensusForm>({
    date_of_visit: new Date().toISOString().split('T')[0],
    county: '',
    electoral_district: '',
    district: '',
    community: '',
    survey_type: 'malaria',
    data: {
      diarrhea_cases: 0,
      respiratory_cases: 0,
      fever_cases: 0,
      clinic_visits: 0,
      water_source: '',
      toilet_type: '',
      handwashing_available: false,
      pregnant_women: 0,
      antenatal_visits: 0,
      facility_births: 0,
      home_births: 0,
      children_screened: 0,
      malnourished_children: 0,
      households_with_food_shortage: 0,
    },
    households_surveyed: 1,
    malaria_cases: 0,
    fever_cases: 0,
    children_under_5: 0,
    pregnant_women: 0,
    gps_lat: null,
    gps_lng: null,
    is_urgent: false,
    notes: '',
    location_landmark: '',
  });

  const handleLocationChange = useCallback((loc: Partial<LocationValue>) => {
    setLocationValue(loc);
    setForm((prev) => ({
      ...prev,
      county: loc.county_name || prev.county,
      electoral_district: loc.electoral_district ?? prev.electoral_district,
      district: loc.district_name || '',
      community: loc.community_name || '',
    }));
  }, []);

  const assignmentSurveyCounties = useMemo(() => {
    if (!assignment) return undefined as string[] | undefined;
    const raw =
      assignment.counties && assignment.counties.length > 0
        ? assignment.counties
        : assignment.county
          ? [assignment.county]
          : [];
    return raw.map((c) => getCountyCanonical(c) || c.trim()).filter(Boolean);
  }, [assignment]);

  /** Keep visit county inside researcher-defined survey counties. */
  useEffect(() => {
    if (!assignmentSurveyCounties?.length) return;
    setForm((prev) => {
      const canon = getCountyCanonical(prev.county);
      const ok = canon && assignmentSurveyCounties.some((x) => normalize(x) === normalize(canon));
      if (ok) return prev;
      const first = assignmentSurveyCounties[0];
      const firstCanon = getCountyCanonical(first);
      const eds = firstCanon ? getElectoralOptionsForCounty(firstCanon) : [];
      const electoral = eds.length === 1 ? eds[0].id : '';
      return {
        ...prev,
        county: first,
        electoral_district: electoral,
        district: '',
        community: '',
      };
    });
    setLocationValue((prev) => {
      const first = assignmentSurveyCounties[0];
      const firstCanon = getCountyCanonical(first);
      const eds = firstCanon ? getElectoralOptionsForCounty(firstCanon) : [];
      const electoral = eds.length === 1 ? eds[0].id : undefined;
      return {
        ...prev,
        electoral_district: electoral,
        district_id: 0,
        district_name: '',
        community_id: 0,
        community_name: '',
      };
    });
  }, [assignment?.id, assignmentSurveyCounties]);

  useEffect(() => {
    if (!form.electoral_district.trim()) return;
    setLocationValue((prev) =>
      prev.electoral_district === form.electoral_district
        ? prev
        : { ...prev, electoral_district: form.electoral_district }
    );
  }, [form.electoral_district]);

  /** Keep LocationSelector in sync when county comes from assignment, draft, or GPS (string state only). */
  useEffect(() => {
    const countyName = form.county.trim();
    if (!countyName) {
      setLocationValue({});
      return;
    }
    const matches =
      Boolean(locationValue.county_id) &&
      normalize(locationValue.county_name || '') === normalize(countyName);
    if (matches) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/location/counties', { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as { counties?: Array<{ id: number; name: string }> };
        const list = Array.isArray(data?.counties) ? data.counties : [];
        const c = list.find((x) => normalize(x.name) === normalize(countyName));
        if (!c || cancelled) return;
        const syncCanon = getCountyCanonical(c.name);
        const syncEds = syncCanon ? getElectoralOptionsForCounty(syncCanon) : [];
        const syncElectoral = syncEds.length === 1 ? syncEds[0].id : undefined;
        setLocationValue((prev) => ({
          ...prev,
          county_id: c.id,
          county_name: c.name,
          electoral_district: syncElectoral,
          district_id: 0,
          district_name: '',
          community_id: 0,
          community_name: '',
        }));
        setForm((prev) => ({
          ...prev,
          county: c.name,
          electoral_district: syncElectoral ?? '',
          district: '',
          community: '',
        }));
      } catch {
        /* offline */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [form.county, locationValue.county_id, locationValue.county_name]);

  useEffect(() => {
    if (!isAuthorized) return;
    const fetchOpenAssignments = async () => {
      setAssignmentLoading(true);
      try {
        const token = localStorage.getItem('auth-token');
        const response = await fetch('/api/census/assignments?limit=20', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          cache: 'no-store',
        });
        if (!response.ok) return;
        const payload = await response.json();
        const rows = Array.isArray(payload?.assignments) ? payload.assignments : [];
        setOpenAssignments(rows as CensusAssignment[]);
      } catch (error) {
        console.error('Failed to load open assignments:', error);
      } finally {
        setAssignmentLoading(false);
      }
    };
    fetchOpenAssignments();
    const fetchSurveyLocks = async () => {
      try {
        const token = localStorage.getItem('auth-token');
        const response = await fetch('/api/census/survey-locks', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          cache: 'no-store',
        });
        if (!response.ok) return;
        const payload = await response.json();
        const locks = payload?.locks || {};
        setSurveyLocks({
          malaria: Boolean(locks.malaria),
          health: Boolean(locks.health),
          maternal_child_health: Boolean(locks.maternal_child_health),
          wash: Boolean(locks.wash),
          nutrition: Boolean(locks.nutrition),
        });
      } catch (error) {
        console.error('Failed to load survey locks:', error);
      }
    };
    fetchSurveyLocks();

    const surveyOrAssignmentId = Number(
      searchParams.get('survey_id') || searchParams.get('assignment_id') || 0
    );
    if (!Number.isFinite(surveyOrAssignmentId) || surveyOrAssignmentId <= 0) {
      setAssignment(null);
      return;
    }

    const fetchAssignment = async () => {
      try {
        const token = localStorage.getItem('auth-token');
        const response = await fetch(`/api/census/assignments?id=${surveyOrAssignmentId}&limit=1`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          cache: 'no-store',
        });
        if (!response.ok) return;
        const payload = await response.json();
        const item = Array.isArray(payload?.assignments) ? payload.assignments[0] : null;
        if (!item) {
          setAssignment(null);
          setMessage({ type: 'warning', text: 'This survey is closed, paused, ended, or unavailable.' });
          return;
        }
        setAssignment(item as CensusAssignment);
        setForm((prev) => ({
          ...prev,
          county: String(item.county || prev.county),
          electoral_district: '',
          district: String(item.district || ''),
          community: String(item.community || prev.community),
          survey_type:
            typeof item.survey_type === 'string' &&
            ['malaria', ...NON_MALARIA_TYPES].includes(item.survey_type as CensusForm['survey_type'])
              ? (item.survey_type as CensusForm['survey_type'])
              : prev.survey_type,
        }));
      } catch (error) {
        console.error('Failed to load survey:', error);
      }
    };
    fetchAssignment();
  }, [isAuthorized, searchParams]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CENSUS_DRAFT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<CensusForm>;
      setForm((prev) => ({
        ...prev,
        date_of_visit: typeof parsed.date_of_visit === 'string' ? parsed.date_of_visit : prev.date_of_visit,
        county: typeof parsed.county === 'string' ? parsed.county : prev.county,
        electoral_district:
          typeof (parsed as { electoral_district?: string }).electoral_district === 'string'
            ? (parsed as { electoral_district?: string }).electoral_district!
            : prev.electoral_district,
        district: typeof parsed.district === 'string' ? parsed.district : prev.district,
        community: typeof parsed.community === 'string' ? parsed.community : prev.community,
        survey_type:
          typeof parsed.survey_type === 'string' &&
          ['malaria', ...NON_MALARIA_TYPES].includes(parsed.survey_type as CensusForm['survey_type'])
            ? (parsed.survey_type as CensusForm['survey_type'])
            : prev.survey_type,
        data: {
          diarrhea_cases: Number.isFinite(Number(parsed.data?.diarrhea_cases)) ? Number(parsed.data?.diarrhea_cases) : prev.data.diarrhea_cases,
          respiratory_cases: Number.isFinite(Number(parsed.data?.respiratory_cases)) ? Number(parsed.data?.respiratory_cases) : prev.data.respiratory_cases,
          fever_cases: Number.isFinite(Number(parsed.data?.fever_cases)) ? Number(parsed.data?.fever_cases) : prev.data.fever_cases,
          clinic_visits: Number.isFinite(Number(parsed.data?.clinic_visits)) ? Number(parsed.data?.clinic_visits) : prev.data.clinic_visits,
          water_source: typeof parsed.data?.water_source === 'string' ? parsed.data.water_source : prev.data.water_source,
          toilet_type: typeof parsed.data?.toilet_type === 'string' ? parsed.data.toilet_type : prev.data.toilet_type,
          handwashing_available: typeof parsed.data?.handwashing_available === 'boolean' ? parsed.data.handwashing_available : prev.data.handwashing_available,
          pregnant_women: Number.isFinite(Number(parsed.data?.pregnant_women)) ? Number(parsed.data?.pregnant_women) : prev.data.pregnant_women,
          antenatal_visits: Number.isFinite(Number(parsed.data?.antenatal_visits)) ? Number(parsed.data?.antenatal_visits) : prev.data.antenatal_visits,
          facility_births: Number.isFinite(Number(parsed.data?.facility_births)) ? Number(parsed.data?.facility_births) : prev.data.facility_births,
          home_births: Number.isFinite(Number(parsed.data?.home_births)) ? Number(parsed.data?.home_births) : prev.data.home_births,
          children_screened: Number.isFinite(Number(parsed.data?.children_screened)) ? Number(parsed.data?.children_screened) : prev.data.children_screened,
          malnourished_children: Number.isFinite(Number(parsed.data?.malnourished_children)) ? Number(parsed.data?.malnourished_children) : prev.data.malnourished_children,
          households_with_food_shortage: Number.isFinite(Number(parsed.data?.households_with_food_shortage)) ? Number(parsed.data?.households_with_food_shortage) : prev.data.households_with_food_shortage,
        },
        households_surveyed: Number.isFinite(Number(parsed.households_surveyed)) ? Number(parsed.households_surveyed) : prev.households_surveyed,
        malaria_cases: Number.isFinite(Number(parsed.malaria_cases)) ? Number(parsed.malaria_cases) : prev.malaria_cases,
        fever_cases: Number.isFinite(Number(parsed.fever_cases)) ? Number(parsed.fever_cases) : prev.fever_cases,
        children_under_5: Number.isFinite(Number(parsed.children_under_5)) ? Number(parsed.children_under_5) : prev.children_under_5,
        pregnant_women: Number.isFinite(Number(parsed.pregnant_women)) ? Number(parsed.pregnant_women) : prev.pregnant_women,
        gps_lat: parsed.gps_lat === null || Number.isFinite(Number(parsed.gps_lat)) ? (parsed.gps_lat === null ? null : Number(parsed.gps_lat)) : prev.gps_lat,
        gps_lng: parsed.gps_lng === null || Number.isFinite(Number(parsed.gps_lng)) ? (parsed.gps_lng === null ? null : Number(parsed.gps_lng)) : prev.gps_lng,
        is_urgent: typeof parsed.is_urgent === 'boolean' ? parsed.is_urgent : prev.is_urgent,
        notes: typeof parsed.notes === 'string' ? parsed.notes : prev.notes,
        location_landmark:
          typeof parsed.location_landmark === 'string'
            ? parsed.location_landmark.slice(0, MAX_LANDMARK_CHARS)
            : prev.location_landmark,
      }));
    } catch (error) {
      console.warn('Unable to restore census draft:', error);
    }
  }, []);

  const selectedCounty = form.county || '';
  const isAssignmentLocationLocked =
    Boolean(assignment) &&
    assignment!.location_locked !== false &&
    Number(assignment!.location_locked) !== 0;
  const assignmentSurveyType =
    assignment && ['malaria', ...NON_MALARIA_TYPES].includes(assignment.survey_type as CensusForm['survey_type'])
      ? (assignment.survey_type as keyof SurveyLocks)
      : null;
  const selectedAssignmentSurveyLocked = assignmentSurveyType ? Boolean(surveyLocks[assignmentSurveyType]) : false;
  const currentSurveyTypeLocked = Boolean(surveyLocks[form.survey_type as keyof SurveyLocks]);
  /** Locks only the survey questionnaire (households + indicators), not visit location, GPS, or notes. */
  const surveyQuestionnaireLocked =
    assignmentLoading || !assignment || selectedAssignmentSurveyLocked || currentSurveyTypeLocked;
  const submitBlocked = surveyQuestionnaireLocked;

  const applyAssignment = (item: CensusAssignment) => {
    setAssignment(item);
    setForm((prev) => ({
      ...prev,
      county: String(item.county || prev.county),
      electoral_district: '',
      district: String(item.district || ''),
      community: String(item.community || prev.community),
      survey_type:
        typeof item.survey_type === 'string' &&
        ['malaria', ...NON_MALARIA_TYPES].includes(item.survey_type as CensusForm['survey_type'])
          ? (item.survey_type as CensusForm['survey_type'])
          : prev.survey_type,
    }));
    if (surveyLocks[item.survey_type as keyof SurveyLocks]) {
      setMessage({
        type: 'warning',
        text: `${item.survey_type.replace(/_/g, ' ')} is currently locked by researcher.`,
      });
    }
  };

  const checkDuplicatePreview = useCallback(async () => {
    if (!form.community.trim() || !form.date_of_visit) {
      setDuplicatePreview(null);
      return null;
    }
    try {
      const token = localStorage.getItem('auth-token');
      const params = new URLSearchParams({
        community: form.community.trim(),
        date_of_visit: form.date_of_visit,
      });
      const response = await fetch(`/api/reports/duplicate?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: 'no-store',
      });
      if (!response.ok) return null;
      const data = (await response.json()) as DuplicatePreview;
      setDuplicatePreview(data);
      return data;
    } catch {
      return null;
    }
  }, [form.community, form.date_of_visit]);


  const resolvePlaceFromCoordinates = useCallback(async (lat: number, lng: number, autoApply = false) => {
    setResolvingPlace(true);
    try {
      const response = await fetch(`/api/geocode/reverse?lat=${lat}&lng=${lng}`, { cache: 'no-store' });
      if (!response.ok) return;
      const geo = (await response.json()) as ReverseGeocodeResponse;
      const place =
        String(geo.display_name || '').trim() ||
        String(geo.location || '').trim() ||
        [geo.city, geo.state, geo.country].filter(Boolean).join(', ');
      setResolvedPlaceName(
        place || 'Could not look up a place name. Tap “Refresh place name” or check coordinates below.'
      );

      if (String(geo.country || '').trim() === 'Outside Liberia') {
        setLocationConfirmed(false);
      }

      if (!autoApply) return;
      setForm((prev) => {
        const next = { ...prev };
        const stateName = String(geo.state || '').trim();
        const cityName = String(geo.city || '').trim();
        let matchedCounty =
          LIBERIA_COUNTIES.find((county) => normalize(county) === normalize(stateName)) || '';

        if (assignmentSurveyCounties?.length && matchedCounty) {
          const inSurvey = assignmentSurveyCounties.some(
            (c) => normalize(c) === normalize(matchedCounty)
          );
          if (!inSurvey) matchedCounty = '';
        }

        if (!isAssignmentLocationLocked && matchedCounty && !prev.county) {
          next.county = matchedCounty;
          next.district = '';
          next.electoral_district = '';
        }
        if (!isAssignmentLocationLocked && cityName && !prev.community) {
          next.community = cityName;
        }
        return next;
      });
    } catch (error) {
      console.error('Failed to resolve place name:', error);
    } finally {
      setResolvingPlace(false);
    }
  }, [isAssignmentLocationLocked, assignmentSurveyCounties]);

  const requestDeviceGps = useCallback((opts?: { silent?: boolean }) => {
    const silent = Boolean(opts?.silent);
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      if (!silent) {
        setMessage({ type: 'warning', text: 'This device does not support GPS. Enter latitude and longitude manually.' });
      }
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position.coords.latitude.toFixed(7));
        const lng = Number(position.coords.longitude.toFixed(7));
        if (!isCoordinateInLiberia(lat, lng)) {
          setForm((prev) => ({ ...prev, gps_lat: null, gps_lng: null }));
          setResolvedPlaceName('');
          if (!silent) {
            setMessage({
              type: 'warning',
              text: 'GPS position is outside Liberia. Use your device in Liberia, or enter coordinates manually.',
            });
          }
          return;
        }
        setForm((prev) => ({
          ...prev,
          gps_lat: lat,
          gps_lng: lng,
        }));
        resolvePlaceFromCoordinates(lat, lng, true);
      },
      () => {
        if (!silent) {
          setMessage({
            type: 'warning',
            text: 'Could not read GPS. Check location permission, or type coordinates manually below.',
          });
        }
      },
      { enableHighAccuracy: true, maximumAge: 120000, timeout: 15000 }
    );
  }, [resolvePlaceFromCoordinates, isCoordinateInLiberia]);


  useEffect(() => {
    if (form.gps_lat === null || form.gps_lng === null) {
      setResolvedPlaceName('');
    }
  }, [form.gps_lat, form.gps_lng]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      checkDuplicatePreview();
    }, 350);
    return () => window.clearTimeout(id);
  }, [form.community, form.date_of_visit, checkDuplicatePreview]);

  const { isSaving, lastSaved, error: autoSaveError } = useAutoSave({
    data: form,
    delay: 900,
    enabled: true,
    onSave: async (draft) => {
      localStorage.setItem(CENSUS_DRAFT_KEY, JSON.stringify(draft));
    },
  });

  const fetchMyReports = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth-token');
      const params = new URLSearchParams({
        limit: '5',
        page: String(page),
      });
      const response = await fetch(`/api/reports/my?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: 'no-store',
      });
      if (!response.ok) return;
      const data = await response.json();
      setReports(Array.isArray(data?.reports) ? data.reports : []);
      setSubmissionsPagination({
        page: Number(data?.pagination?.page || page),
        limit: Number(data?.pagination?.limit || 5),
        total: Number(data?.pagination?.total || 0),
        total_pages: Math.max(1, Number(data?.pagination?.total_pages || 1)),
      });
    } catch (error) {
      console.error('Failed to fetch census reports:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const processOutbox = useCallback(async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    const token = localStorage.getItem('auth-token');
    if (!token) return;
    let queue: Array<{ id: string; payload: Record<string, unknown> }>;
    try {
      const raw = localStorage.getItem(CENSUS_OFFLINE_QUEUE_KEY);
      queue = JSON.parse(raw || '[]');
    } catch {
      return;
    }
    if (!Array.isArray(queue) || queue.length === 0) {
      setPendingOutboxCount(0);
      return;
    }

    const remaining: typeof queue = [];
    let synced = 0;
    for (const item of queue) {
      try {
        let response = await fetch('/api/reports', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ ...item.payload, force_duplicate: false }),
        });
        let data = await response.json().catch(() => ({}));
        if (response.status === 409 && data?.duplicate_exists) {
          response = await fetch('/api/reports', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ ...item.payload, force_duplicate: true }),
          });
          data = await response.json().catch(() => ({}));
        }
        if (response.ok) {
          synced += 1;
          continue;
        }
        remaining.push(item);
      } catch {
        remaining.push(item);
      }
    }

    try {
      localStorage.setItem(CENSUS_OFFLINE_QUEUE_KEY, JSON.stringify(remaining));
      setPendingOutboxCount(remaining.length);
    } catch {
      /* ignore */
    }
    if (synced > 0) {
      await fetchMyReports(1);
      setMessage({ type: 'success', text: `${synced} queued report(s) uploaded.` });
    }
  }, [fetchMyReports]);

  useEffect(() => {
    setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);
    try {
      const raw = localStorage.getItem(CENSUS_OFFLINE_QUEUE_KEY);
      const parsed = JSON.parse(raw || '[]');
      setPendingOutboxCount(Array.isArray(parsed) ? parsed.length : 0);
    } catch {
      setPendingOutboxCount(0);
    }
    const goOnline = () => {
      setIsOnline(true);
      void processOutbox();
    };
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    void processOutbox();
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, [processOutbox]);

  useEffect(() => {
    if (!isAuthorized) return;
    fetchMyReports();
  }, [isAuthorized, fetchMyReports]);

  const updateCount = (
    field: keyof Pick<CensusForm, 'households_surveyed' | 'malaria_cases' | 'fever_cases' | 'children_under_5' | 'pregnant_women'>,
    value: number
  ) => {
    const normalized = Math.max(0, Math.min(MAX_NUMERIC, Math.floor(Number(value) || 0)));
    setForm((prev) => ({ ...prev, [field]: normalized }));
  };

  const bumpCount = (
    field: keyof Pick<CensusForm, 'households_surveyed' | 'malaria_cases' | 'fever_cases' | 'children_under_5' | 'pregnant_women'>,
    delta: number
  ) => {
    setForm((prev) => {
      const next = Math.max(0, Math.min(MAX_NUMERIC, Number(prev[field]) + delta));
      return { ...prev, [field]: next };
    });
  };

  const validateForm = (): string | null => {
    if (!form.date_of_visit) return 'Date of visit is required';
    if (!form.county.trim()) return 'County is required';
    if (!isAssignmentLocationLocked) {
      const visitCanon = getCountyCanonical(form.county);
      if (
        visitCanon &&
        getElectoralOptionsForCounty(visitCanon).length > 0 &&
        !form.electoral_district.trim()
      ) {
        return 'Select an electoral district (NEC), then district and community.';
      }
    }
    if (!form.community.trim()) return 'Community is required';
    if (
      form.gps_lat !== null &&
      form.gps_lng !== null &&
      !isCoordinateInLiberia(form.gps_lat, form.gps_lng)
    ) {
      return 'GPS is outside Liberia. Clear coordinates or enter latitude/longitude inside Liberia.';
    }
    if (form.survey_type === 'malaria' && form.households_surveyed <= 0) return 'Households surveyed must be greater than 0';
    if (
      !isAssignmentLocationLocked &&
      resolvedPlaceName &&
      (form.gps_lat !== null || form.gps_lng !== null) &&
      !locationConfirmed
    ) {
      return 'Please confirm the detected place name before submitting.';
    }

    const numericFields = [
      form.households_surveyed,
      form.malaria_cases,
      form.fever_cases,
      form.children_under_5,
      form.pregnant_women,
    ];
    if (numericFields.some((v) => !Number.isFinite(v) || v < 0 || v > MAX_NUMERIC)) {
      return `Numeric fields must be between 0 and ${MAX_NUMERIC}`;
    }

    if (form.survey_type === 'malaria') {
      const hasIndicator =
        form.malaria_cases > 0 ||
        form.fever_cases > 0 ||
        form.children_under_5 > 0 ||
        form.pregnant_women > 0;
      if (!hasIndicator && !form.notes.trim() && !form.location_landmark.trim()) {
        return 'Enter at least one indicator value, notes, or a village/landmark description';
      }
    } else if (form.survey_type === 'health') {
      if (form.data.diarrhea_cases < 0 || form.data.respiratory_cases < 0 || form.data.fever_cases < 0 || form.data.clinic_visits < 0) {
        return 'Health counts cannot be negative';
      }
      if (
        form.data.diarrhea_cases > MAX_NUMERIC ||
        form.data.respiratory_cases > MAX_NUMERIC ||
        form.data.fever_cases > MAX_NUMERIC ||
        form.data.clinic_visits > MAX_NUMERIC
      ) {
        return `Health counts must be <= ${MAX_NUMERIC}`;
      }
    } else if (form.survey_type === 'maternal_child_health') {
      if (
        form.data.pregnant_women < 0 ||
        form.data.antenatal_visits < 0 ||
        form.data.facility_births < 0 ||
        form.data.home_births < 0
      ) {
        return 'Maternal and child health counts cannot be negative';
      }
      if (
        form.data.pregnant_women > MAX_NUMERIC ||
        form.data.antenatal_visits > MAX_NUMERIC ||
        form.data.facility_births > MAX_NUMERIC ||
        form.data.home_births > MAX_NUMERIC
      ) {
        return `Maternal and child health counts must be <= ${MAX_NUMERIC}`;
      }
    } else if (form.survey_type === 'wash') {
      if (!form.data.water_source.trim()) return 'Water source is required for WASH survey';
      if (!form.data.toilet_type.trim()) return 'Toilet type is required for WASH survey';
      if (!WATER_SOURCE_OPTIONS.includes(form.data.water_source as (typeof WATER_SOURCE_OPTIONS)[number])) {
        return 'Invalid water source selected';
      }
      if (!TOILET_TYPE_OPTIONS.includes(form.data.toilet_type as (typeof TOILET_TYPE_OPTIONS)[number])) {
        return 'Invalid toilet type selected';
      }
    } else if (form.survey_type === 'nutrition') {
      if (
        form.data.children_screened < 0 ||
        form.data.malnourished_children < 0 ||
        form.data.households_with_food_shortage < 0
      ) {
        return 'Nutrition numbers cannot be negative';
      }
      if (
        form.data.children_screened > MAX_NUMERIC ||
        form.data.malnourished_children > MAX_NUMERIC ||
        form.data.households_with_food_shortage > MAX_NUMERIC
      ) {
        return `Nutrition counts must be <= ${MAX_NUMERIC}`;
      }
      if (form.data.malnourished_children > form.data.children_screened) {
        return 'Malnourished children cannot be greater than children screened';
      }
    }

    return null;
  };

  const buildReportBody = (forceDuplicate: boolean) => ({
    ...form,
    assignment_id: assignment?.id || null,
    data: form.survey_type === 'malaria' ? null : form.data,
    is_urgent: form.is_urgent || form.malaria_cases > URGENT_MALARIA_THRESHOLD,
    force_duplicate: forceDuplicate,
  });

  const enqueueOfflinePayload = (payload: Record<string, unknown>) => {
    try {
      const raw = localStorage.getItem(CENSUS_OFFLINE_QUEUE_KEY);
      const list = (raw ? JSON.parse(raw) : []) as Array<{
        id: string;
        createdAt: string;
        payload: Record<string, unknown>;
      }>;
      const id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      list.push({ id, createdAt: new Date().toISOString(), payload });
      localStorage.setItem(CENSUS_OFFLINE_QUEUE_KEY, JSON.stringify(list));
      setPendingOutboxCount(list.length);
    } catch (e) {
      console.error('Failed to queue offline report:', e);
    }
  };

  const submitReport = async (forceDuplicate: boolean) => {
    const token = localStorage.getItem('auth-token');
    const response = await fetch('/api/reports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(buildReportBody(forceDuplicate)),
    });
    const data = await response.json().catch(() => ({}));
    return { response, data };
  };

  const resetAfterSuccessfulSend = () => {
    setForm((prev) => ({
      ...prev,
      county: assignment ? String(assignment.county || prev.county) : prev.county,
      electoral_district: '',
      district: assignment ? String(assignment.district || '') : submitMode === 'new' ? prev.district : '',
      community: assignment ? String(assignment.community || '') : '',
      survey_type: assignment
        ? ['malaria', ...NON_MALARIA_TYPES].includes(assignment.survey_type as CensusForm['survey_type'])
          ? (assignment.survey_type as CensusForm['survey_type'])
          : 'malaria'
        : 'malaria',
      data: {
        diarrhea_cases: 0,
        respiratory_cases: 0,
        fever_cases: 0,
        clinic_visits: 0,
        water_source: '',
        toilet_type: '',
        handwashing_available: false,
        pregnant_women: 0,
        antenatal_visits: 0,
        facility_births: 0,
        home_births: 0,
        children_screened: 0,
        malnourished_children: 0,
        households_with_food_shortage: 0,
      },
      households_surveyed: 1,
      malaria_cases: 0,
      fever_cases: 0,
      children_under_5: 0,
      pregnant_women: 0,
      is_urgent: false,
      notes: '',
      location_landmark: '',
    }));
    setLocationConfirmed(false);
    setDuplicatePreview(null);
    if (submitMode !== 'new') {
      localStorage.removeItem(CENSUS_DRAFT_KEY);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitBlocked) {
      setMessage({ type: 'warning', text: 'Select an unlocked assignment before submitting.' });
      return;
    }
    setSubmitting(true);
    setMessage(null);

    const validationError = validateForm();
    if (validationError) {
      setMessage({ type: 'error', text: validationError });
      setSubmitting(false);
      return;
    }

    const offline = typeof navigator !== 'undefined' && !navigator.onLine;
    if (offline) {
      if (duplicatePreview?.duplicate_exists) {
        const shouldContinue = await showAppConfirm({
          title: 'Possible duplicate',
          message: `A report for this community and date may already exist (ID: ${duplicatePreview.existing_report?.id || 'unknown'}). Queue this submission anyway?`,
          confirmLabel: 'Queue anyway',
          cancelLabel: 'Cancel',
        });
        if (!shouldContinue) {
          setMessage({ type: 'warning', text: 'Queued submission cancelled.' });
          setSubmitting(false);
          return;
        }
      }
      enqueueOfflinePayload(buildReportBody(false));
      setMessage({
        type: 'success',
        text: 'Saved on this device. It will upload automatically when you are back online.',
      });
      resetAfterSuccessfulSend();
      fetchMyReports(1);
      setSubmitting(false);
      return;
    }

    try {
      if (duplicatePreview?.duplicate_exists) {
        const shouldContinue = await showAppConfirm({
          title: 'Duplicate report',
          message: `A report for this community and date already exists (ID: ${duplicatePreview.existing_report?.id || 'unknown'}). Continue anyway?`,
          confirmLabel: 'Continue',
          cancelLabel: 'Cancel',
        });
        if (!shouldContinue) {
          setMessage({ type: 'warning', text: 'Submission cancelled because duplicate was detected.' });
          setSubmitting(false);
          return;
        }
      }

      let response: Response;
      let data: { error?: string; duplicate_exists?: boolean };
      try {
        const result = await submitReport(false);
        response = result.response;
        data = result.data;
      } catch {
        enqueueOfflinePayload(buildReportBody(false));
        setMessage({
          type: 'warning',
          text: 'Could not reach the server. Report saved on this device and will upload when the connection is stable.',
        });
        resetAfterSuccessfulSend();
        fetchMyReports(1);
        setSubmitting(false);
        return;
      }

      if (response.status === 409 && data?.duplicate_exists) {
        const shouldContinue = await showAppConfirm({
          title: 'Duplicate report',
          message: 'A report for this location and date already exists. Continue?',
          confirmLabel: 'Continue',
          cancelLabel: 'Cancel',
        });
        if (!shouldContinue) {
          setMessage({ type: 'warning', text: 'Submission cancelled by user.' });
          setSubmitting(false);
          return;
        }
        const retry = await submitReport(true);
        response = retry.response;
        data = retry.data;
      }

      if (!response.ok) {
        if (response.status >= 500) {
          enqueueOfflinePayload(buildReportBody(false));
          setMessage({
            type: 'warning',
            text: 'Server error. Report saved on this device to try again later.',
          });
          resetAfterSuccessfulSend();
          fetchMyReports(1);
          setSubmitting(false);
          return;
        }
        setMessage({ type: 'error', text: data?.error || 'Failed to submit report' });
        setSubmitting(false);
        return;
      }

      const sentAt = new Date().toLocaleString('en-US', { timeZone: LIBERIA_TIMEZONE });
      setMessage({
        type: 'success',
        text: `Report submitted successfully. ${sentAt}. Status: Sent to researchers.`,
      });

      resetAfterSuccessfulSend();
      fetchMyReports(1);
    } catch (error) {
      console.error('Failed to submit report:', error);
      enqueueOfflinePayload(buildReportBody(false));
      setMessage({
        type: 'warning',
        text: 'Network error. Report saved on this device to upload automatically when possible.',
      });
      resetAfterSuccessfulSend();
      fetchMyReports(1);
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || !isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-4 border-emerald-200 border-t-emerald-700 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <header className="sticky top-0 z-30 border-b border-emerald-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard/field')}
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Field Census Dashboard</h1>
              <p className="text-xs text-gray-500">Community health reporting</p>
            </div>
          </div>
          <ProfileAvatar onClick={() => router.push('/dashboard/field/profile')} />
        </div>
      </header>

      <main className="mx-auto grid max-w-4xl gap-4 px-4 py-4 pb-24">
        <section className="rounded-2xl border border-emerald-200/90 bg-white p-5 shadow-md shadow-emerald-900/5">
          <div className="mb-5 flex items-center gap-2 border-b border-emerald-100 pb-3">
            <ClipboardList className="text-emerald-700" size={18} />
            <h2 className="text-base font-semibold tracking-tight text-gray-900">Submit Community Report</h2>
          </div>
          {assignment && (
            <div className="mb-3 rounded-xl border border-blue-200 bg-blue-50 p-3">
              <p className="text-sm font-semibold text-blue-900">Active survey</p>
              <p className="mt-1 text-xs text-blue-800">
                #{assignment.id} {assignment.title} | Counties:{' '}
                {assignment.counties && assignment.counties.length > 0
                  ? assignment.counties.join(', ')
                  : assignment.county}
                {assignment.community ? ` · ${assignment.community}` : ''}
                {assignment.end_date ? ` | Ends ${String(assignment.end_date).slice(0, 10)}` : ''}
                {assignment.due_date ? ` | Target ${String(assignment.due_date).slice(0, 10)}` : ''}
              </p>
              {assignment.description && (
                <p className="mt-1 text-xs text-blue-800">{assignment.description}</p>
              )}
            </div>
          )}
          {assignment && selectedAssignmentSurveyLocked && (
            <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3">
              <p className="text-sm font-semibold text-red-900">Survey Locked By Researcher</p>
              <p className="mt-1 text-xs text-red-800">
                {assignment.survey_type.replace(/_/g, ' ')} is locked for now. Wait for researcher to unlock this specific survey type.
              </p>
            </div>
          )}
          {assignment && isAssignmentLocationLocked && (
            <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm font-semibold text-slate-900">Location set by survey</p>
              <p className="mt-1 text-xs text-slate-700">
                Visit location is fixed for this assignment and cannot be edited here.
              </p>
            </div>
          )}
          {!assignment && (
            <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <p className="text-sm font-semibold text-amber-900">Select an open survey</p>
              <p className="mt-1 text-xs text-amber-800">
                You can edit visit location and notes below. The survey questionnaire stays locked until you pick an open
                survey from the list (or open one from the field home with &quot;Start this survey&quot;).
              </p>
              <div className="mt-2 space-y-1">
                {assignmentLoading ? (
                  <p className="text-xs text-amber-800">Loading assignments...</p>
                ) : openAssignments.length === 0 ? (
                  <p className="text-xs text-amber-800">No unlocked assignments available.</p>
                ) : (
                  openAssignments.slice(0, 6).map((item) => {
                    const assignmentTypeLocked = Boolean(surveyLocks[item.survey_type as keyof SurveyLocks]);
                    return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={assignmentTypeLocked}
                      onClick={() => applyAssignment(item)}
                      className={`block w-full rounded-lg border px-3 py-1.5 text-left text-xs ${
                        assignmentTypeLocked
                          ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-500'
                          : 'border-amber-300 bg-white text-amber-900 hover:bg-amber-100'
                      }`}
                    >
                      #{item.id} {item.title} |{' '}
                      {item.counties && item.counties.length > 0 ? item.counties.join(', ') : item.county}
                      {item.community ? ` · ${item.community}` : ''}
                      <span className="ml-1 font-semibold">
                        ({item.survey_type.replace(/_/g, ' ')}{assignmentTypeLocked ? ' - survey locked' : ''})
                      </span>
                    </button>
                  )})
                )}
              </div>
            </div>
          )}
          <div className="mb-3">
            <AutoSaveIndicator isSaving={isSaving} lastSaved={lastSaved} error={autoSaveError} />
          </div>
          <div
            className={`mb-3 inline-flex flex-wrap items-center gap-2 rounded-lg px-2.5 py-1 text-xs font-medium ${
              isOnline ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
            }`}
          >
            <span>{isOnline ? 'Online: ready to submit' : 'Offline: drafts & queue saved on this device'}</span>
            {pendingOutboxCount > 0 && (
              <span className="rounded-md bg-amber-100 px-1.5 py-0.5 font-semibold text-amber-900">
                {pendingOutboxCount} queued upload{pendingOutboxCount === 1 ? '' : 's'}
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit} className="grid gap-5">
            <div className="grid gap-4">
              <label className="grid gap-1.5">
                <span className="text-xs font-medium text-gray-700">Date of Visit / Observation</span>
                <input
                  type="date"
                  value={form.date_of_visit}
                  onChange={(e) => setForm((prev) => ({ ...prev, date_of_visit: e.target.value }))}
                  className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  required
                />
                <span className="text-[11px] text-gray-500">Required. Use the date when visit/observation happened.</span>
              </label>

              <LocationSelector
                value={{ ...locationValue, electoral_district: locationValue.electoral_district ?? form.electoral_district }}
                onChange={handleLocationChange}
                locked={isAssignmentLocationLocked}
                districtOptional
                allowedCountyNames={assignmentSurveyCounties}
              />

              <label className="grid gap-1.5">
                <span className="text-xs font-medium text-gray-700">Survey Type</span>
                <select
                  value={form.survey_type}
                  disabled={Boolean(assignment)}
                  onChange={(e) =>
                    setForm((prev) => {
                      const nextType = e.target.value as CensusForm['survey_type'];
                      if (surveyLocks[nextType as keyof SurveyLocks]) {
                        setMessage({
                          type: 'warning',
                          text: `${nextType.replace(/_/g, ' ')} is currently locked by researcher.`,
                        });
                        return prev;
                      }
                      return {
                        ...prev,
                        survey_type: nextType,
                      };
                    })
                  }
                  className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none disabled:bg-gray-100 disabled:text-gray-500"
                >
                  <option value="malaria">Malaria (existing)</option>
                  <option value="" disabled>Other surveys</option>
                  {NON_MALARIA_TYPES.map((type) => (
                    <option key={type} value={type} disabled={Boolean(surveyLocks[type as keyof SurveyLocks])}>
                      {type
                        .split('_')
                        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                        .join(' ')}
                      {surveyLocks[type as keyof SurveyLocks] ? ' (Locked)' : ''}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-gray-500">
                  {assignment
                    ? 'Survey type is controlled by the selected assignment.'
                    : 'Locked survey types cannot be selected.'}
                </span>
              </label>
            </div>

            {duplicatePreview?.duplicate_exists && (
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                Duplicate warning: report already exists for this community and date
                {duplicatePreview.existing_report?.id ? ` (ID: ${duplicatePreview.existing_report.id})` : ''}.
              </div>
            )}

            <fieldset
              disabled={surveyQuestionnaireLocked}
              className={`min-w-0 border-0 p-0 ${surveyQuestionnaireLocked ? 'pointer-events-none opacity-60' : ''}`}
            >
              <legend className="sr-only">Survey questionnaire</legend>
              <p className="mb-2 text-xs font-medium text-gray-700">Survey questionnaire (special survey)</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="grid gap-1 sm:col-span-2">
                  <span className="text-xs font-medium text-gray-600">Households Surveyed</span>
                  <input
                    type="number"
                    min={form.survey_type === 'malaria' ? 1 : 0}
                    max={MAX_NUMERIC}
                    value={form.households_surveyed}
                    onChange={(e) => updateCount('households_surveyed', Number(e.target.value))}
                    className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                    required={form.survey_type === 'malaria'}
                  />
                  <span className="text-[11px] text-gray-500">Required for malaria survey. Must be greater than 0.</span>
                </label>
              </div>

            {form.survey_type === 'malaria' ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
                {[
                  { key: 'malaria_cases', label: 'Suspected Malaria Cases' },
                  { key: 'fever_cases', label: 'Fever Cases (last 2 weeks)' },
                  { key: 'children_under_5', label: 'Children under 5' },
                  { key: 'pregnant_women', label: 'Pregnant Women' },
                ].map((item) => (
                  <div key={item.key} className="rounded-xl border border-gray-200 p-2">
                    <p className="mb-1 text-xs font-medium text-gray-600">{item.label}</p>
                    <input
                      type="number"
                      min={0}
                      max={MAX_NUMERIC}
                      value={form[item.key as keyof CensusForm]}
                      onChange={(e) =>
                        updateCount(
                          item.key as keyof Pick<CensusForm, 'households_surveyed' | 'malaria_cases' | 'fever_cases' | 'children_under_5' | 'pregnant_women'>,
                          Number(e.target.value)
                        )
                      }
                      className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-emerald-500 focus:outline-none"
                    />
                    <div className="mt-2 flex gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          bumpCount(
                            item.key as keyof Pick<CensusForm, 'households_surveyed' | 'malaria_cases' | 'fever_cases' | 'children_under_5' | 'pregnant_women'>,
                            1
                          )
                        }
                        className="rounded-md bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700"
                      >
                        +1
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          bumpCount(
                            item.key as keyof Pick<CensusForm, 'households_surveyed' | 'malaria_cases' | 'fever_cases' | 'children_under_5' | 'pregnant_women'>,
                            5
                          )
                        }
                        className="rounded-md bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700"
                      >
                        +5
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateCount(
                            item.key as keyof Pick<CensusForm, 'households_surveyed' | 'malaria_cases' | 'fever_cases' | 'children_under_5' | 'pregnant_women'>,
                            0
                          )
                        }
                        className="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {form.survey_type === 'health' && (
                  <>
                    <label className="grid gap-1">
                      <span className="text-xs font-medium text-gray-600">diarrhea_cases</span>
                      <input
                        type="number"
                        min={0}
                        value={form.data.diarrhea_cases}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            data: { ...prev.data, diarrhea_cases: Math.max(0, Number(e.target.value) || 0) },
                          }))
                        }
                        className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                      />
                    </label>
                    <label className="grid gap-1">
                      <span className="text-xs font-medium text-gray-600">respiratory_cases</span>
                      <input
                        type="number"
                        min={0}
                        value={form.data.respiratory_cases}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            data: { ...prev.data, respiratory_cases: Math.max(0, Number(e.target.value) || 0) },
                          }))
                        }
                        className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                      />
                    </label>
                    <label className="grid gap-1">
                      <span className="text-xs font-medium text-gray-600">fever_cases</span>
                      <input
                        type="number"
                        min={0}
                        value={form.data.fever_cases}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            data: { ...prev.data, fever_cases: Math.max(0, Number(e.target.value) || 0) },
                          }))
                        }
                        className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                      />
                    </label>
                    <label className="grid gap-1">
                      <span className="text-xs font-medium text-gray-600">clinic_visits</span>
                      <input
                        type="number"
                        min={0}
                        value={form.data.clinic_visits}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            data: { ...prev.data, clinic_visits: Math.max(0, Number(e.target.value) || 0) },
                          }))
                        }
                        className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                      />
                    </label>
                  </>
                )}

                {form.survey_type === 'maternal_child_health' && (
                  <>
                    <label className="grid gap-1">
                      <span className="text-xs font-medium text-gray-600">pregnant_women</span>
                      <input
                        type="number"
                        min={0}
                        value={form.data.pregnant_women}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            data: { ...prev.data, pregnant_women: Math.max(0, Number(e.target.value) || 0) },
                          }))
                        }
                        className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                      />
                    </label>
                    <label className="grid gap-1">
                      <span className="text-xs font-medium text-gray-600">antenatal_visits</span>
                      <input
                        type="number"
                        min={0}
                        value={form.data.antenatal_visits}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            data: { ...prev.data, antenatal_visits: Math.max(0, Number(e.target.value) || 0) },
                          }))
                        }
                        className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                      />
                    </label>
                    <label className="grid gap-1">
                      <span className="text-xs font-medium text-gray-600">facility_births</span>
                      <input
                        type="number"
                        min={0}
                        value={form.data.facility_births}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            data: { ...prev.data, facility_births: Math.max(0, Number(e.target.value) || 0) },
                          }))
                        }
                        className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                      />
                    </label>
                    <label className="grid gap-1">
                      <span className="text-xs font-medium text-gray-600">home_births</span>
                      <input
                        type="number"
                        min={0}
                        value={form.data.home_births}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            data: { ...prev.data, home_births: Math.max(0, Number(e.target.value) || 0) },
                          }))
                        }
                        className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                      />
                    </label>
                  </>
                )}

                {form.survey_type === 'wash' && (
                  <>
                    <label className="grid gap-1">
                      <span className="text-xs font-medium text-gray-600">water_source</span>
                      <select
                        value={form.data.water_source}
                        onChange={(e) => setForm((prev) => ({ ...prev, data: { ...prev.data, water_source: e.target.value } }))}
                        className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                      >
                        <option value="">Select Water Source</option>
                        {WATER_SOURCE_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt.replace(/_/g, ' ')}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="grid gap-1">
                      <span className="text-xs font-medium text-gray-600">toilet_type</span>
                      <select
                        value={form.data.toilet_type}
                        onChange={(e) => setForm((prev) => ({ ...prev, data: { ...prev.data, toilet_type: e.target.value } }))}
                        className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                      >
                        <option value="">Select Toilet Type</option>
                        {TOILET_TYPE_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt.replace(/_/g, ' ')}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={form.data.handwashing_available}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            data: { ...prev.data, handwashing_available: e.target.checked },
                          }))
                        }
                        className="h-4 w-4"
                      />
                      handwashing_available
                    </label>
                  </>
                )}

                {form.survey_type === 'nutrition' && (
                  <>
                    <label className="grid gap-1">
                      <span className="text-xs font-medium text-gray-600">children_screened</span>
                      <input
                        type="number"
                        min={0}
                        value={form.data.children_screened}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            data: { ...prev.data, children_screened: Math.max(0, Number(e.target.value) || 0) },
                          }))
                        }
                        className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                      />
                    </label>
                    <label className="grid gap-1">
                      <span className="text-xs font-medium text-gray-600">malnourished_children</span>
                      <input
                        type="number"
                        min={0}
                        value={form.data.malnourished_children}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            data: { ...prev.data, malnourished_children: Math.max(0, Number(e.target.value) || 0) },
                          }))
                        }
                        className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                      />
                    </label>
                    <label className="grid gap-1 sm:col-span-2">
                      <span className="text-xs font-medium text-gray-600">households_with_food_shortage</span>
                      <input
                        type="number"
                        min={0}
                        value={form.data.households_with_food_shortage}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            data: { ...prev.data, households_with_food_shortage: Math.max(0, Number(e.target.value) || 0) },
                          }))
                        }
                        className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                      />
                    </label>
                  </>
                )}
              </div>
            )}

            </fieldset>

            <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 to-white p-4 shadow-sm ring-1 ring-emerald-100/60">
              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                  <MapPin className="h-5 w-5" aria-hidden />
                </div>
                <div className="min-w-0 flex-1 space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Where you are (GPS)</h3>
                    <p className="mt-0.5 text-[12px] leading-snug text-gray-600">
                      We show a <strong>place name</strong> you can read first. Numbers are only for technical records
                      and are stored with the report—expand below if you need to edit them.
                    </p>
                  </div>

                  <div className="rounded-xl border border-emerald-200/90 bg-white px-3 py-3 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800/90">Detected place</p>
                    <p className="mt-1.5 text-base font-medium leading-snug text-gray-900">
                      {resolvingPlace ? (
                        <span className="text-gray-500">Finding place name…</span>
                      ) : (
                        resolvedPlaceName ||
                        'Tap “Use current location” to see a readable address here. You can also open coordinates below.'
                      )}
                    </p>
                  </div>

                  <label className="grid gap-1.5">
                    <span className="text-xs font-medium text-gray-700">Village / landmark (optional)</span>
                    <textarea
                      value={form.location_landmark}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          location_landmark: e.target.value.slice(0, MAX_LANDMARK_CHARS),
                        }))
                      }
                      rows={2}
                      maxLength={MAX_LANDMARK_CHARS}
                      placeholder="e.g. Near the clinic in Gbarnga, after the bridge toward Totota, school compound…"
                      className="resize-y rounded-xl border border-emerald-200/80 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <span className="text-[11px] leading-snug text-gray-600">
                      <strong>No internet needed.</strong> Describe where the visit happened in words local staff will
                      recognize. Saved with the report and shown to researchers.
                    </span>
                  </label>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => requestDeviceGps({ silent: false })}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-white px-3 py-2 text-xs font-semibold text-emerald-900 shadow-sm hover:bg-emerald-50"
                    >
                      <LocateFixed className="h-3.5 w-3.5" aria-hidden />
                      Use current location
                    </button>
                    <button
                      type="button"
                      disabled={resolvingPlace || form.gps_lat === null || form.gps_lng === null}
                      onClick={() => {
                        if (form.gps_lat === null || form.gps_lng === null) return;
                        resolvePlaceFromCoordinates(form.gps_lat, form.gps_lng, false);
                      }}
                      className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-800 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {resolvingPlace ? 'Looking up…' : 'Refresh place name'}
                    </button>
                  </div>

                  <details className="group rounded-xl border border-gray-200/90 bg-gray-50/80 px-3 py-2 text-sm open:bg-white">
                    <summary className="cursor-pointer list-none font-medium text-gray-800 hover:text-emerald-900 [&::-webkit-details-marker]:hidden">
                      <span className="inline-flex items-center gap-2">
                        <span className="text-xs">Coordinates (numeric)</span>
                        <span className="text-[10px] font-normal text-gray-500">tap to expand</span>
                      </span>
                    </summary>
                    <div className="mt-3 grid grid-cols-1 gap-3 border-t border-gray-100 pt-3 sm:grid-cols-2">
                      <label className="grid gap-1.5">
                        <span className="text-xs font-medium text-gray-700">Latitude</span>
                        <input
                          type="number"
                          step="any"
                          min={-90}
                          max={90}
                          value={form.gps_lat ?? ''}
                          onChange={(e) => {
                            const v = e.target.value;
                            setForm((prev) => ({
                              ...prev,
                              gps_lat: v === '' ? null : Number(v),
                            }));
                          }}
                          className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm tabular-nums text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          placeholder="e.g. 6.3156"
                        />
                        <span className="text-[11px] text-gray-500">−90 to 90 — edit then tap “Refresh place name”</span>
                      </label>
                      <label className="grid gap-1.5">
                        <span className="text-xs font-medium text-gray-700">Longitude</span>
                        <input
                          type="number"
                          step="any"
                          min={-180}
                          max={180}
                          value={form.gps_lng ?? ''}
                          onChange={(e) => {
                            const v = e.target.value;
                            setForm((prev) => ({
                              ...prev,
                              gps_lng: v === '' ? null : Number(v),
                            }));
                          }}
                          className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm tabular-nums text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          placeholder="e.g. -10.8047"
                        />
                        <span className="text-[11px] text-gray-500">−180 to 180</span>
                      </label>
                    </div>
                  </details>

                  {isAssignmentLocationLocked && resolvedPlaceName && (
                    <p className="rounded-lg border border-amber-200 bg-amber-50/90 px-3 py-2 text-[11px] leading-snug text-amber-950">
                      Your <strong>survey area</strong> is fixed above. The detected place is only where the device thinks
                      you are—ignore it when testing away from the field.
                    </p>
                  )}
                  {!isAssignmentLocationLocked && (
                    <label className="inline-flex cursor-pointer items-start gap-2 rounded-lg border border-sky-200/80 bg-sky-50/90 px-3 py-2 text-xs text-sky-950">
                      <input
                        type="checkbox"
                        checked={locationConfirmed}
                        onChange={(e) => setLocationConfirmed(e.target.checked)}
                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300"
                      />
                      <span>I confirm this detected place matches where the visit happened</span>
                    </label>
                  )}
                </div>
              </div>
            </div>

            <textarea
              placeholder="Notes (symptoms trends, urgent alerts, drug stock issues)"
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              className="min-h-24 rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />

            <label className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              <input
                type="checkbox"
                checked={form.is_urgent || form.malaria_cases > URGENT_MALARIA_THRESHOLD}
                onChange={(e) => setForm((prev) => ({ ...prev, is_urgent: e.target.checked }))}
                className="h-4 w-4"
              />
              Mark as urgent alert (auto-urgent when malaria cases &gt; {URGENT_MALARIA_THRESHOLD})
            </label>

            {message && (
              <p
                className={`text-sm ${
                  message.type === 'success'
                    ? 'text-emerald-700'
                    : message.type === 'warning'
                      ? 'text-amber-700'
                      : 'text-red-600'
                }`}
              >
                {message.text}
              </p>
            )}

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="submit"
                disabled={submitting || submitBlocked}
                onClick={() => setSubmitMode('default')}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send size={16} />
                {submitting && submitMode === 'default' ? 'Submitting...' : 'Submit Report'}
              </button>
              <button
                type="submit"
                disabled={submitting || submitBlocked}
                onClick={() => setSubmitMode('new')}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send size={16} />
                {submitting && submitMode === 'new' ? 'Submitting...' : 'Submit & New'}
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">My Submissions</h2>
            <p className="text-xs text-gray-500">{submissionsPagination.total} total</p>
          </div>

          {loading ? (
            <p className="text-sm text-gray-500">Loading submissions...</p>
          ) : reports.length === 0 ? (
            <p className="text-sm text-gray-500">No submissions yet.</p>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <div key={report.id} className="rounded-xl border border-gray-200 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-900">{report.community}, {report.county}</p>
                      <p className="mt-1 text-xs font-medium text-emerald-700">
                        Survey: {(report.survey_type || 'malaria').toString()}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Visit: {new Date(report.date_of_visit).toLocaleDateString('en-US', { timeZone: LIBERIA_TIMEZONE })} |
                        Sent: {new Date(report.created_at).toLocaleTimeString('en-US', {
                          timeZone: LIBERIA_TIMEZONE,
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                        })}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        report.status === 'reviewed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {report.status}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-600">
                    <span>Households: {report.households_surveyed}</span>
                    {(report.survey_type || 'malaria') === 'malaria' ? (
                      <>
                        <span>Malaria: {report.malaria_cases}</span>
                        <span>Fever: {report.fever_cases}</span>
                        <span>Children &lt; 5: {report.children_under_5}</span>
                        <span>Pregnant Women: {report.pregnant_women}</span>
                      </>
                    ) : (
                      <span>Extra data captured in structured survey payload</span>
                    )}
                    {report.is_urgent && <span className="font-semibold text-red-600">Urgent</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && submissionsPagination.total > 0 && (
            <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
              <p className="text-xs text-gray-500">
                Page {submissionsPagination.page} of {submissionsPagination.total_pages}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fetchMyReports(submissionsPagination.page - 1)}
                  disabled={submissionsPagination.page <= 1}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => fetchMyReports(submissionsPagination.page + 1)}
                  disabled={submissionsPagination.page >= submissionsPagination.total_pages}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <div className="flex items-center gap-2 text-emerald-800">
            <MapPin size={16} />
            <p className="text-sm font-medium">Liberia Time Zone Enabled</p>
          </div>
          <p className="mt-1 text-xs text-emerald-700">
            All report timestamps are displayed in Africa/Monrovia time.
          </p>
          <div className="mt-2 flex items-center gap-2 text-xs text-emerald-700">
            <CheckCircle2 size={14} />
            Researchers can review submissions directly from their dashboard.
          </div>
        </section>
      </main>
    </div>
  );
}
