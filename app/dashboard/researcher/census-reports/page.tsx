'use client';

import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  CheckSquare,
  Eye,
  MapPin,
  Pencil,
  Search,
  Square,
  Trash2,
} from 'lucide-react';
import ProfileAvatar from '@/components/ProfileAvatar';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useRoleRedirect } from '@/hooks/useRoleRedirect';
import { useCensusReportsAccess } from '@/hooks/useCensusReportsAccess';
import { DISTRICTS_BY_COUNTY, getCountyCanonical, LIBERIA_COUNTIES } from '@/lib/locations/liberia';
import { getElectoralOptionsForCounty } from '@/lib/locations/liberia-electoral';

interface CensusReport {
  id: number;
  collector_name: string;
  collector_email: string;
  date_of_visit: string;
  county: string;
  district: string | null;
  /** NEC House electoral district id (e.g. MED-01, BOMI-02). */
  electoral_district?: string | null;
  community: string;
  location_landmark?: string | null;
  households_surveyed: number;
  malaria_cases: number;
  fever_cases: number;
  children_under_5: number;
  pregnant_women: number;
  notes: string | null;
  correction_note?: string | null;
  is_urgent: boolean;
  status: 'submitted' | 'reviewed' | 'needs_correction' | 'withdrawn' | string;
  gps_lat: number | null;
  gps_lng: number | null;
  created_at: string;
  updated_at?: string;
}

type SavedView = {
  name: string;
  params: string;
};

interface ResearchResponse {
  reports: CensusReport[];
  stats: {
    total_reports: number;
    total_malaria_cases: number;
    urgent_reports_count: number;
  };
  time_series?: {
    daily?: Array<{ day: string; reports_count: number; malaria_cases: number }>;
    weekly?: Array<{ week: string; reports_count: number; malaria_cases: number }>;
  };
  location_breakdown: Array<{
    county: string;
    district: string;
    reports_count: number;
    malaria_cases: number;
  }>;
  map_points?: Array<{
    id: number;
    county: string;
    district: string | null;
    community: string;
    gps_lat: number;
    gps_lng: number;
    is_urgent: boolean;
    created_at: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

interface CensusAssignment {
  id: number;
  title: string;
  description: string | null;
  county: string;
  /** Selected counties for this survey (primary row `county` is the first). */
  counties?: string[];
  district: string | null;
  /** Legacy; new surveys omit — field staff enter community on the census form. */
  community: string | null;
  survey_type: string;
  due_date: string | null;
  end_date: string | null;
  status: string;
  created_at: string;
  /** When true, primary county/district/community on the survey row cannot be edited. */
  location_locked?: boolean | number;
  /** When true, geographic access rules may include counties other than the primary county. */
  national_scope?: boolean | number;
}

type CorrectionDialogState = {
  open: boolean;
  ids: number[];
  note: string;
  isBulk: boolean;
};

type SurveyTypeKey = 'malaria' | 'health' | 'maternal_child_health' | 'wash' | 'nutrition';
type SurveyLocks = Record<SurveyTypeKey, boolean>;

const LIBERIA_TIMEZONE = 'Africa/Monrovia';
const SAVED_FILTERS_KEY = 'researcher_census_saved_views_v1';
const MAX_SURVEY_COUNTIES = 15;

function getTodayDateString() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoDateString(days: number) {
  const now = new Date();
  now.setDate(now.getDate() - days);
  return now.toISOString().slice(0, 10);
}

function getQualityFlags(report: CensusReport): string[] {
  const flags: string[] = [];
  if (report.gps_lat === null || report.gps_lng === null) flags.push('Missing GPS');
  if (!String(report.notes || '').trim()) flags.push('No notes');
  if (Number(report.households_surveyed) > 0 && Number(report.malaria_cases) > Number(report.households_surveyed)) {
    flags.push('Malaria > households');
  }
  if (Number(report.households_surveyed) === 0 && Number(report.malaria_cases) > 0) {
    flags.push('0 households with cases');
  }
  return flags;
}

function electoralLabelFor(county: string, id: string | null | undefined): string {
  if (!id) return '';
  const c = getCountyCanonical(county) || county;
  const opt = getElectoralOptionsForCounty(c).find((o) => o.id === id);
  return opt ? opt.label : id;
}

export default function ResearcherCensusReportsPage() {
  const router = useRouter();
  const { isAuthorized, isLoading } = useRoleRedirect(['researcher', 'admin', 'management']);
  const { gate: accessGate, navHome, navProfile } = useCensusReportsAccess(isAuthorized);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ResearchResponse | null>(null);
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [newViewName, setNewViewName] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [assignments, setAssignments] = useState<CensusAssignment[]>([]);
  const [assignmentUpdatingId, setAssignmentUpdatingId] = useState<number | null>(null);
  const [surveyLocks, setSurveyLocks] = useState<SurveyLocks>({
    malaria: false,
    health: false,
    maternal_child_health: false,
    wash: false,
    nutrition: false,
  });
  const [surveyLockUpdating, setSurveyLockUpdating] = useState<SurveyTypeKey | null>(null);
  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    counties: [] as string[],
    survey_type: 'malaria',
    due_date: '',
    end_date: '',
    description: '',
  });
  const [surveyEditOpen, setSurveyEditOpen] = useState<CensusAssignment | null>(null);
  const [surveyEditForm, setSurveyEditForm] = useState({
    title: '',
    counties: [] as string[],
    survey_type: 'malaria',
    due_date: '',
    end_date: '',
    description: '',
    national_scope: false,
  });
  const [surveyEditSaving, setSurveyEditSaving] = useState(false);
  const [censusUsersForAssign, setCensusUsersForAssign] = useState<Array<{ id: number; full_name: string; email: string }>>(
    []
  );
  const [surveyAssigneeIds, setSurveyAssigneeIds] = useState<number[]>([]);
  const [assigneesLoading, setAssigneesLoading] = useState(false);
  const [placeRulesDraft, setPlaceRulesDraft] = useState<Array<{ county: string; district: string; community: string }>>(
    []
  );
  const [placesLoading, setPlacesLoading] = useState(false);

  const [county, setCounty] = useState('');
  const [district, setDistrict] = useState('');
  const [electoralDistrict, setElectoralDistrict] = useState('');
  const [community, setCommunity] = useState('');
  const [dateFrom, setDateFrom] = useState(daysAgoDateString(7));
  const [dateTo, setDateTo] = useState(getTodayDateString());
  const [status, setStatus] = useState<'all' | 'submitted' | 'reviewed' | 'needs_correction' | 'withdrawn'>('all');
  const [urgentFilter, setUrgentFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [sortBy, setSortBy] = useState<'date_of_visit' | 'created_at' | 'malaria_cases' | 'households_surveyed' | 'community' | 'county' | 'status'>('date_of_visit');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [pendingDeleteSurveyId, setPendingDeleteSurveyId] = useState<number | null>(null);
  const [surveyDeletingId, setSurveyDeletingId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  /** Shown under Create survey so validation/API errors are visible without scrolling. */
  const [createSurveyError, setCreateSurveyError] = useState<string | null>(null);
  const [correctionDialog, setCorrectionDialog] = useState<CorrectionDialogState>({
    open: false,
    ids: [],
    note: '',
    isBulk: false,
  });
  const limit = 20;

  const countyDeferred = useDeferredValue(county);
  const districtDeferred = useDeferredValue(district);
  const electoralDistrictDeferred = useDeferredValue(electoralDistrict);
  const communityDeferred = useDeferredValue(community);

  const buildParams = useCallback(
    (useDeferred = true) => {
      const params = new URLSearchParams();
      const countyValue = useDeferred ? countyDeferred : county;
      const districtValue = useDeferred ? districtDeferred : district;
      const electoralValue = useDeferred ? electoralDistrictDeferred : electoralDistrict;
      const communityValue = useDeferred ? communityDeferred : community;
      if (countyValue.trim()) params.set('county', countyValue.trim());
      if (districtValue.trim()) params.set('district', districtValue.trim());
      if (electoralValue.trim()) params.set('electoral_district', electoralValue.trim());
      if (communityValue.trim()) params.set('community', communityValue.trim());
      if (dateFrom) params.set('date_from', dateFrom);
      if (dateTo) params.set('date_to', dateTo);
      if (status !== 'all') params.set('status', status);
      if (urgentFilter !== 'all') params.set('is_urgent', urgentFilter === 'yes' ? 'true' : 'false');
      params.set('sort_by', sortBy);
      params.set('sort_dir', sortDir);
      params.set('page', String(page));
      params.set('limit', String(limit));
      return params;
    },
    [
      countyDeferred,
      county,
      districtDeferred,
      district,
      electoralDistrictDeferred,
      electoralDistrict,
      communityDeferred,
      community,
      dateFrom,
      dateTo,
      status,
      urgentFilter,
      sortBy,
      sortDir,
      page,
    ]
  );

  const fetchReports = useCallback(async () => {
    const controller = new AbortController();
    try {
      setLoading(true);
      const token = localStorage.getItem('auth-token');
      const params = buildParams(true);
      const response = await fetch(`/api/reports/research?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: 'no-store',
        signal: controller.signal,
      });
      if (!response.ok) return;
      const payload = await response.json();
      setData(payload);
      setSelectedIds((prev) => prev.filter((id) => (payload?.reports || []).some((report: CensusReport) => report.id === id)));
    } catch (error) {
      if ((error as { name?: string }).name !== 'AbortError') {
        console.error('Failed to fetch researcher reports:', error);
      }
    } finally {
      setLoading(false);
    }
    return () => controller.abort();
  }, [buildParams]);

  const fetchAssignments = useCallback(async () => {
    try {
      setAssignmentLoading(true);
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/census/assignments?limit=24', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: 'no-store',
      });
      if (!response.ok) return;
      const payload = await response.json();
      setAssignments(Array.isArray(payload?.assignments) ? payload.assignments : []);
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
    } finally {
      setAssignmentLoading(false);
    }
  }, []);

  const fetchSurveyLocks = useCallback(async () => {
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
      console.error('Failed to fetch survey locks:', error);
    }
  }, []);

  useEffect(() => {
    if (!isAuthorized || accessGate !== 'ok') return;
    fetchReports();
  }, [isAuthorized, accessGate, fetchReports]);

  useEffect(() => {
    if (!isAuthorized || accessGate !== 'ok') return;
    fetchAssignments();
  }, [isAuthorized, accessGate, fetchAssignments]);

  useEffect(() => {
    if (!isAuthorized || accessGate !== 'ok') return;
    fetchSurveyLocks();
  }, [isAuthorized, accessGate, fetchSurveyLocks]);

  useEffect(() => {
    setCreateSurveyError(null);
  }, [assignmentForm.title, assignmentForm.counties.join('|'), assignmentForm.end_date]);

  useEffect(() => {
    if (!surveyEditOpen || accessGate !== 'ok') {
      setCensusUsersForAssign([]);
      setSurveyAssigneeIds([]);
      setPlaceRulesDraft([]);
      return;
    }
    let cancelled = false;
    setAssigneesLoading(true);
    setPlacesLoading(true);
    (async () => {
      try {
        const token = localStorage.getItem('auth-token');
        const headers: HeadersInit = { ...(token ? { Authorization: `Bearer ${token}` } : {}) };
        const [usersRes, assignRes, placesRes] = await Promise.all([
          fetch('/api/census/census-users?limit=200', { headers, cache: 'no-store' }),
          fetch(`/api/census/assignments/${surveyEditOpen.id}/assignees`, { headers, cache: 'no-store' }),
          fetch(`/api/census/assignments/${surveyEditOpen.id}/places`, { headers, cache: 'no-store' }),
        ]);
        const usersPayload = await usersRes.json().catch(() => ({}));
        const assignPayload = await assignRes.json().catch(() => ({}));
        const placesPayload = await placesRes.json().catch(() => ({}));
        if (cancelled) return;
        const users = Array.isArray(usersPayload?.users) ? usersPayload.users : [];
        setCensusUsersForAssign(
          users.map((u: { id: number; full_name?: string; email?: string }) => ({
            id: Number(u.id),
            full_name: String(u.full_name || ''),
            email: String(u.email || ''),
          }))
        );
        const ids = Array.isArray(assignPayload?.assignees)
          ? assignPayload.assignees.map((a: { user_id: number }) => Number(a.user_id))
          : [];
        setSurveyAssigneeIds(ids);
        const pls = Array.isArray(placesPayload?.places) ? placesPayload.places : [];
        const primaryCounty = String(
          surveyEditOpen.counties?.[0] || surveyEditOpen.county || ''
        );
        const national = Boolean(Number(surveyEditOpen.national_scope ?? 0));
        setPlaceRulesDraft(
          pls.length > 0
            ? pls.map((p: { county?: string; district?: string | null; community?: string | null }) => ({
                county: national ? String(p.county || '') : primaryCounty,
                district: p.district ? String(p.district) : '',
                community: p.community ? String(p.community) : '',
              }))
            : []
        );
      } catch {
        if (!cancelled) {
          setCensusUsersForAssign([]);
          setSurveyAssigneeIds([]);
          setPlaceRulesDraft([]);
        }
      } finally {
        if (!cancelled) {
          setAssigneesLoading(false);
          setPlacesLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [surveyEditOpen, accessGate]);

  useEffect(() => {
    setPage(1);
  }, [
    countyDeferred,
    districtDeferred,
    electoralDistrictDeferred,
    communityDeferred,
    dateFrom,
    dateTo,
    status,
    urgentFilter,
    sortBy,
    sortDir,
  ]);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const paramMap = {
        county: setCounty,
        district: setDistrict,
        electoral_district: setElectoralDistrict,
        community: setCommunity,
        date_from: setDateFrom,
        date_to: setDateTo,
      } as const;
      (Object.keys(paramMap) as Array<keyof typeof paramMap>).forEach((key) => {
        const value = params.get(key);
        if (value) paramMap[key](value);
      });
      const statusParam = params.get('status');
      if (statusParam && ['submitted', 'reviewed', 'needs_correction', 'withdrawn'].includes(statusParam)) {
        setStatus(statusParam as typeof status);
      }
      const urgentParam = params.get('is_urgent');
      if (urgentParam === 'true') setUrgentFilter('yes');
      if (urgentParam === 'false') setUrgentFilter('no');
      const sortByParam = params.get('sort_by');
      if (
        sortByParam &&
        ['date_of_visit', 'created_at', 'malaria_cases', 'households_surveyed', 'community', 'county', 'status'].includes(sortByParam)
      ) {
        setSortBy(sortByParam as typeof sortBy);
      }
      const sortDirParam = params.get('sort_dir');
      if (sortDirParam && ['asc', 'desc'].includes(sortDirParam)) setSortDir(sortDirParam as typeof sortDir);
      const pageParam = Number(params.get('page') || '');
      if (Number.isFinite(pageParam) && pageParam > 0) setPage(pageParam);
    } catch {
      // no-op
    }

    try {
      const raw = localStorage.getItem(SAVED_FILTERS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) setSavedViews(parsed.slice(0, 10));
    } catch {
      // no-op
    }
  }, []);

  useEffect(() => {
    const params = buildParams(false);
    const next = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', next);
  }, [buildParams]);

  const applyDatePreset = (preset: 'today' | '7d' | '30d' | 'all') => {
    if (preset === 'today') {
      const today = getTodayDateString();
      setDateFrom(today);
      setDateTo(today);
      return;
    }
    if (preset === '7d') {
      setDateFrom(daysAgoDateString(7));
      setDateTo(getTodayDateString());
      return;
    }
    if (preset === '30d') {
      setDateFrom(daysAgoDateString(30));
      setDateTo(getTodayDateString());
      return;
    }
    setDateFrom('');
    setDateTo('');
  };

  const persistSavedViews = (next: SavedView[]) => {
    setSavedViews(next);
    localStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(next.slice(0, 10)));
  };

  const saveCurrentView = () => {
    const name = newViewName.trim();
    if (!name) return;
    const params = buildParams(false).toString();
    const next = [{ name, params }, ...savedViews.filter((item) => item.name !== name)].slice(0, 10);
    persistSavedViews(next);
    setNewViewName('');
  };

  const applySavedView = (paramsString: string) => {
    const params = new URLSearchParams(paramsString);
    setCounty(params.get('county') || '');
    setDistrict(params.get('district') || '');
    setElectoralDistrict(params.get('electoral_district') || '');
    setCommunity(params.get('community') || '');
    setDateFrom(params.get('date_from') || '');
    setDateTo(params.get('date_to') || '');
    const savedStatus = params.get('status');
    setStatus(
      savedStatus && ['submitted', 'reviewed', 'needs_correction', 'withdrawn'].includes(savedStatus)
        ? (savedStatus as typeof status)
        : 'all'
    );
    const savedUrgent = params.get('is_urgent');
    setUrgentFilter(savedUrgent === 'true' ? 'yes' : savedUrgent === 'false' ? 'no' : 'all');
    const savedSortBy = params.get('sort_by');
    if (savedSortBy && ['date_of_visit', 'created_at', 'malaria_cases', 'households_surveyed', 'community', 'county', 'status'].includes(savedSortBy)) {
      setSortBy(savedSortBy as typeof sortBy);
    } else {
      setSortBy('date_of_visit');
    }
    const savedSortDir = params.get('sort_dir');
    setSortDir(savedSortDir === 'asc' ? 'asc' : 'desc');
    setPage(Number(params.get('page') || 1));
  };

  const updateLocalStatus = (ids: number[], nextStatus: 'reviewed' | 'needs_correction', correctionNote?: string) => {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        reports: prev.reports.map((report) =>
          ids.includes(report.id)
            ? { ...report, status: nextStatus, correction_note: nextStatus === 'needs_correction' ? (correctionNote || '') : null }
            : report
        ),
      };
    });
  };

  const performStatusUpdate = async (
    ids: number[],
    nextStatus: 'reviewed' | 'needs_correction',
    correctionNote = ''
  ) => {
    if (ids.length === 0) return;
    const isSingle = ids.length === 1;
    const targetId = isSingle ? ids[0] : null;

    if (isSingle && targetId !== null) {
      setStatusUpdatingId(targetId);
    } else {
      setBulkLoading(true);
    }
    setMessage(null);
    try {
      const token = localStorage.getItem('auth-token');
      let response = await fetch('/api/reports/bulk-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ ids, status: nextStatus, correction_note: correctionNote }),
      });

      if (!response.ok && isSingle && targetId !== null) {
        response = await fetch(`/api/reports/${targetId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ status: nextStatus, correction_note: correctionNote }),
        });
      }

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage({ type: 'error', text: payload?.error || `Failed to update report status (HTTP ${response.status}).` });
        return;
      }
      updateLocalStatus(ids, nextStatus, correctionNote);
      if (isSingle && targetId !== null) {
        setMessage({ type: 'success', text: `Report #${targetId} marked as ${nextStatus}.` });
      } else {
        setMessage({ type: 'success', text: `${ids.length} report(s) updated to ${nextStatus}.` });
        setSelectedIds([]);
      }
    } catch (error) {
      console.error('Failed to update report status:', error);
      setMessage({ type: 'error', text: 'Network error while updating report status.' });
    } finally {
      if (isSingle) {
        setStatusUpdatingId(null);
      } else {
        setBulkLoading(false);
      }
    }
  };

  const openCorrectionDialog = (ids: number[], isBulk: boolean) => {
    setCorrectionDialog({ open: true, ids, note: '', isBulk });
  };

  const closeCorrectionDialog = () => {
    if (statusUpdatingId !== null || bulkLoading) return;
    setCorrectionDialog({ open: false, ids: [], note: '', isBulk: false });
  };

  const confirmCorrectionRequest = async () => {
    const note = correctionDialog.note.trim();
    if (!note) {
      setMessage({ type: 'error', text: 'Correction request needs a clear note.' });
      return;
    }
    await performStatusUpdate(correctionDialog.ids, 'needs_correction', note);
    setCorrectionDialog({ open: false, ids: [], note: '', isBulk: false });
  };

  const updateReportStatus = async (reportId: number, nextStatus: 'reviewed' | 'needs_correction') => {
    if (nextStatus === 'needs_correction') {
      openCorrectionDialog([reportId], false);
      return;
    }
    await performStatusUpdate([reportId], nextStatus);
  };

  const bulkUpdateStatus = async (nextStatus: 'reviewed' | 'needs_correction') => {
    if (selectedIds.length === 0) return;
    if (nextStatus === 'needs_correction') {
      openCorrectionDialog(selectedIds, true);
      return;
    }
    await performStatusUpdate(selectedIds, nextStatus);
  };

  const exportSelected = () => {
    const selected = (data?.reports || []).filter((report) => selectedIds.includes(report.id));
    if (!selected.length) return;
    const header = [
      'id',
      'collector_name',
      'date_of_visit',
      'county',
      'district',
      'electoral_district',
      'community',
      'households_surveyed',
      'malaria_cases',
      'fever_cases',
      'children_under_5',
      'pregnant_women',
      'is_urgent',
      'status',
      'created_at',
    ];
    const rows = selected.map((report) => [
      report.id,
      report.collector_name,
      report.date_of_visit,
      report.county,
      report.district || '',
      report.electoral_district || '',
      report.community,
      report.households_surveyed,
      report.malaria_cases,
      report.fever_cases,
      report.children_under_5,
      report.pregnant_women,
      report.is_urgent ? 'true' : 'false',
      report.status,
      report.created_at,
    ]);
    const csv = [header, ...rows]
      .map((line) => line.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `researcher_selected_reports_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (reportId: number) => {
    setDeletingId(reportId);
    setMessage(null);
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage({ type: 'error', text: payload?.error || 'Failed to delete report.' });
        return;
      }
      setMessage({ type: 'success', text: `Report #${reportId} deleted.` });
      setData((prev) => {
        if (!prev) return prev;
        const deleted = prev.reports.find((report) => report.id === reportId);
        if (!deleted) return prev;
        const nextReports = prev.reports.filter((report) => report.id !== reportId);
        const nextTotal = Math.max(0, (prev.pagination?.total || 0) - 1);
        const nextTotalPages = Math.max(1, Math.ceil(nextTotal / (prev.pagination?.limit || limit)));
        const nextPage = Math.min(prev.pagination?.page || 1, nextTotalPages);
        return {
          ...prev,
          reports: nextReports,
          stats: {
            ...prev.stats,
            total_reports: Math.max(0, prev.stats.total_reports - 1),
            total_malaria_cases: Math.max(0, prev.stats.total_malaria_cases - (Number(deleted.malaria_cases) || 0)),
            urgent_reports_count: Math.max(0, prev.stats.urgent_reports_count - (deleted.is_urgent ? 1 : 0)),
          },
          pagination: {
            ...prev.pagination,
            total: nextTotal,
            total_pages: nextTotalPages,
            page: nextPage,
          },
        };
      });
      setSelectedIds((prev) => prev.filter((id) => id !== reportId));
    } catch (error) {
      console.error('Failed to delete report:', error);
      setMessage({ type: 'error', text: 'Network error while deleting report.' });
    } finally {
      setDeletingId(null);
    }
  };

  const requestDelete = (reportId: number) => setPendingDeleteId(reportId);

  const handleCreateAssignment = async () => {
    const title = assignmentForm.title.trim();
    const counties = assignmentForm.counties;
    const endDate = assignmentForm.end_date.trim();
    if (!title || counties.length === 0) {
      const text = 'Survey needs a title and at least one county.';
      setCreateSurveyError(text);
      setMessage({ type: 'error', text });
      return;
    }
    if (!endDate) {
      const text = 'Survey end date is required.';
      setCreateSurveyError(text);
      setMessage({ type: 'error', text });
      return;
    }
    setAssignmentLoading(true);
    setMessage(null);
    setCreateSurveyError(null);
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/census/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          ...assignmentForm,
          title,
          counties,
          county: counties[0],
          district: '',
          community: '',
          description: assignmentForm.description.trim(),
          end_date: endDate,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const text = String(payload?.error || 'Failed to create survey.');
        setCreateSurveyError(text);
        setMessage({ type: 'error', text });
        return;
      }
      setCreateSurveyError(null);
      setMessage({ type: 'success', text: 'Survey created. Census dashboards can use it until it ends or you close it.' });
      setAssignmentForm({
        title: '',
        counties: [],
        survey_type: 'malaria',
        due_date: '',
        end_date: '',
        description: '',
      });
      await fetchAssignments();
    } catch (error) {
      console.error('Failed to create survey:', error);
      const text = 'Network error while creating survey.';
      setCreateSurveyError(text);
      setMessage({ type: 'error', text });
    } finally {
      setAssignmentLoading(false);
    }
  };

  const toggleSurveyAssignee = (userId: number) => {
    setSurveyAssigneeIds((prev) =>
      prev.includes(userId) ? prev.filter((x) => x !== userId) : [...prev, userId].sort((a, b) => a - b)
    );
  };

  const toggleCreateCounty = (c: string) => {
    setAssignmentForm((prev) => {
      const has = prev.counties.includes(c);
      const next = has ? prev.counties.filter((x) => x !== c) : [...prev.counties, c];
      if (!has && next.length > MAX_SURVEY_COUNTIES) return prev;
      return {
        ...prev,
        counties: next,
      };
    });
  };

  const toggleSurveyEditCounty = (c: string) => {
    setSurveyEditForm((prev) => {
      const has = prev.counties.includes(c);
      const next = has ? prev.counties.filter((x) => x !== c) : [...prev.counties, c];
      if (!has && next.length > MAX_SURVEY_COUNTIES) return prev;
      return {
        ...prev,
        counties: next,
      };
    });
  };

  const addPlaceRuleRow = () => {
    setPlaceRulesDraft((prev) =>
      prev.length >= 50
        ? prev
        : [
            ...prev,
            {
              county: surveyEditForm.national_scope ? '' : surveyEditForm.counties[0] || '',
              district: '',
              community: '',
            },
          ]
    );
  };

  const removePlaceRuleRow = (index: number) => {
    setPlaceRulesDraft((prev) => prev.filter((_, i) => i !== index));
  };

  const updatePlaceRuleRow = (
    index: number,
    field: 'county' | 'district' | 'community',
    value: string
  ) => {
    setPlaceRulesDraft((prev) => {
      const next = [...prev];
      if (!next[index]) return prev;
      const row = { ...next[index], [field]: value };
      if (field === 'county') row.district = '';
      next[index] = row;
      return next;
    });
  };

  const openSurveyEdit = (item: CensusAssignment) => {
    setSurveyEditOpen(item);
    const countyList =
      item.counties && item.counties.length > 0 ? item.counties : item.county ? [item.county] : [];
    setSurveyEditForm({
      title: item.title,
      counties: countyList,
      survey_type: item.survey_type,
      due_date: item.due_date ? String(item.due_date).slice(0, 10) : '',
      end_date: item.end_date ? String(item.end_date).slice(0, 10) : '',
      description: item.description || '',
      national_scope: Boolean(Number(item.national_scope ?? 0)),
    });
  };

  const handleSaveSurveyEdit = async () => {
    if (!surveyEditOpen) return;
    const title = surveyEditForm.title.trim();
    const countyList = surveyEditForm.counties;
    const endDate = surveyEditForm.end_date.trim();
    const surveyLocationLocked = Boolean(Number(surveyEditOpen.location_locked ?? 1));
    if (!title || !endDate) {
      setMessage({ type: 'error', text: 'Title and survey end date are required.' });
      return;
    }
    if (!surveyLocationLocked && countyList.length === 0) {
      setMessage({ type: 'error', text: 'Select at least one county.' });
      return;
    }
    setSurveyEditSaving(true);
    setMessage(null);
    try {
      const token = localStorage.getItem('auth-token');
      const patchBody: Record<string, unknown> = {
        id: surveyEditOpen.id,
        title,
        survey_type: surveyEditForm.survey_type,
        due_date: surveyEditForm.due_date.trim() ? surveyEditForm.due_date.trim() : null,
        end_date: endDate,
        description: surveyEditForm.description.trim(),
        national_scope: surveyEditForm.national_scope,
      };
      if (!surveyLocationLocked) {
        patchBody.counties = countyList;
        patchBody.county = countyList[0];
        patchBody.district = '';
        patchBody.community = '';
      }
      const response = await fetch('/api/census/assignments', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(patchBody),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage({ type: 'error', text: payload?.error || 'Failed to save survey.' });
        return;
      }
      const assignRes = await fetch(`/api/census/assignments/${surveyEditOpen.id}/assignees`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ user_ids: surveyAssigneeIds }),
      });
      const assignPayload = await assignRes.json().catch(() => ({}));
      if (!assignRes.ok) {
        setMessage({
          type: 'error',
          text: assignPayload?.error || 'Survey saved, but assigning census dashboards failed.',
        });
        await fetchAssignments();
        return;
      }
      const placesRes = await fetch(`/api/census/assignments/${surveyEditOpen.id}/places`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          places: placeRulesDraft
            .filter((r) => r.county.trim())
            .map((r) => ({
              county: r.county.trim(),
              district: r.district.trim() || null,
              community: r.community.trim() || null,
            })),
        }),
      });
      const placesPayload = await placesRes.json().catch(() => ({}));
      if (!placesRes.ok) {
        setMessage({
          type: 'error',
          text: placesPayload?.error || 'Survey saved, but geographic access rules failed to update.',
        });
        await fetchAssignments();
        return;
      }
      setMessage({ type: 'success', text: 'Survey, assignments, and place rules updated.' });
      setSurveyEditOpen(null);
      await fetchAssignments();
    } catch (error) {
      console.error('Failed to save survey:', error);
      setMessage({ type: 'error', text: 'Network error while saving survey.' });
    } finally {
      setSurveyEditSaving(false);
    }
  };

  const updateAssignmentStatus = async (assignmentId: number, nextStatus: 'open' | 'locked' | 'closed') => {
    setAssignmentUpdatingId(assignmentId);
    setMessage(null);
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/census/assignments', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ id: assignmentId, status: nextStatus }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage({ type: 'error', text: payload?.error || 'Failed to update survey status.' });
        return;
      }
      setAssignments((prev) =>
        prev.map((item) => (item.id === assignmentId ? { ...item, status: nextStatus } : item))
      );
      setMessage({
        type: 'success',
        text:
          nextStatus === 'locked'
            ? `Survey #${assignmentId} paused — census workers cannot submit against it until you reopen it.`
            : nextStatus === 'closed'
              ? `Survey #${assignmentId} ended — census workers can no longer submit for it.`
              : `Survey #${assignmentId} is open again.`,
      });
    } catch (error) {
      console.error('Failed to update survey status:', error);
      setMessage({ type: 'error', text: 'Network error while updating survey status.' });
    } finally {
      setAssignmentUpdatingId(null);
    }
  };

  const deleteSurvey = async (assignmentId: number) => {
    setSurveyDeletingId(assignmentId);
    setMessage(null);
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/census/assignments/${assignmentId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage({ type: 'error', text: payload?.error || 'Failed to delete survey.' });
        return;
      }
      setAssignments((prev) => prev.filter((item) => item.id !== assignmentId));
      setSurveyEditOpen((open) => (open?.id === assignmentId ? null : open));
      setMessage({ type: 'success', text: `Survey #${assignmentId} was permanently deleted.` });
    } catch (error) {
      console.error('Failed to delete survey:', error);
      setMessage({ type: 'error', text: 'Network error while deleting survey.' });
    } finally {
      setSurveyDeletingId(null);
    }
  };

  const updateSurveyLock = async (surveyType: SurveyTypeKey, nextLocked: boolean) => {
    setSurveyLockUpdating(surveyType);
    setMessage(null);
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/census/survey-locks', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ survey_type: surveyType, is_locked: nextLocked }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage({ type: 'error', text: payload?.error || 'Failed to update survey lock.' });
        return;
      }
      setSurveyLocks((prev) => ({ ...prev, [surveyType]: nextLocked }));
      setMessage({
        type: 'success',
        text: `${surveyType.replace(/_/g, ' ')} survey questionnaire is now ${nextLocked ? 'locked' : 'unlocked'} for census workers.`,
      });
    } catch (error) {
      console.error('Failed to update survey lock:', error);
      setMessage({ type: 'error', text: 'Network error while updating survey lock.' });
    } finally {
      setSurveyLockUpdating(null);
    }
  };

  const reports = useMemo(() => data?.reports || [], [data?.reports]);
  const allSelectedOnPage = reports.length > 0 && reports.every((report) => selectedIds.includes(report.id));

  const setOrClearSelectAll = () => {
    if (allSelectedOnPage) {
      setSelectedIds((prev) => prev.filter((id) => !reports.some((report) => report.id === id)));
      return;
    }
    setSelectedIds((prev) => [...new Set([...prev, ...reports.map((report) => report.id)])]);
  };

  const totalPages = data?.pagination?.total_pages || 1;
  const urgentRate = data?.stats?.total_reports
    ? `${((data.stats.urgent_reports_count / data.stats.total_reports) * 100).toFixed(1)}%`
    : '0%';
  const malariaPer100Households = useMemo(() => {
    const households = reports.reduce((sum, item) => sum + Number(item.households_surveyed || 0), 0);
    const malaria = reports.reduce((sum, item) => sum + Number(item.malaria_cases || 0), 0);
    if (!households) return '0';
    return ((malaria / households) * 100).toFixed(1);
  }, [reports]);
  const dailyAverageReports = useMemo(() => {
    const daily = data?.time_series?.daily || [];
    if (!daily.length) return '0';
    const total = daily.reduce((sum, day) => sum + Number(day.reports_count || 0), 0);
    return (total / daily.length).toFixed(1);
  }, [data?.time_series?.daily]);

  if (isLoading || !isAuthorized || accessGate !== 'ok') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-4 border-emerald-200 border-t-emerald-700 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => router.push(navHome)} className="rounded-lg p-2 hover:bg-gray-100">
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Field Reports Analytics</h1>
              <p className="text-xs text-gray-500">Fast triage, data quality checks, and map/list explorer</p>
            </div>
          </div>
          <ProfileAvatar onClick={() => router.push(navProfile)} />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-4 pb-24">
        {message && (
          <div className={`mb-3 rounded-lg px-3 py-2 text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
            {message.text}
          </div>
        )}

        <section className="mb-4 rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">Create Census Survey</h3>
          <p className="mt-1 text-xs text-gray-500">
            Define <strong>which counties</strong> this survey covers. Census workers choose district and community when they
            submit each report. You can add optional geographic access rules after creating the survey.
          </p>
          <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-2">
            <p className="mb-1 text-xs font-semibold text-gray-700">Global locks (questionnaire per survey type)</p>
            <p className="mb-2 text-[11px] text-gray-600">
              Optional: block specific questionnaire types across all open surveys. Location and notes stay editable on the
              census form.
            </p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(surveyLocks) as SurveyTypeKey[]).map((surveyType) => {
                const isLocked = surveyLocks[surveyType];
                return (
                  <button
                    key={surveyType}
                    type="button"
                    disabled={surveyLockUpdating === surveyType}
                    onClick={() => updateSurveyLock(surveyType, !isLocked)}
                    className={`rounded-lg border px-2.5 py-1 text-xs font-medium disabled:opacity-50 ${
                      isLocked
                        ? 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100'
                        : 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    {surveyType.replace(/_/g, ' ')}: {isLocked ? 'Locked' : 'Unlocked'}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-3">
            <p className="text-[11px] font-medium text-gray-700">Counties covered (select one or more, max {MAX_SURVEY_COUNTIES})</p>
            <p className="mt-0.5 text-[11px] text-gray-500">
              First selected county is the primary record for this survey. To reorder, uncheck all and select again (first tick =
              primary). Field staff enter district and community on the census dashboard.
            </p>
            {assignmentForm.counties.length > 0 && (
              <p className="mt-1 text-[11px] font-medium text-emerald-900">
                Primary county: {assignmentForm.counties[0]}
                {assignmentForm.counties.length > 1 && ` · Also: ${assignmentForm.counties.slice(1).join(', ')}`}
              </p>
            )}
            <div className="mt-2 grid max-h-40 grid-cols-2 gap-x-3 gap-y-1 overflow-y-auto sm:grid-cols-3 md:grid-cols-4">
              {LIBERIA_COUNTIES.map((c) => (
                <label key={c} className="flex cursor-pointer items-center gap-2 text-[11px] text-gray-800">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 rounded border-gray-400 text-emerald-700"
                    checked={assignmentForm.counties.includes(c)}
                    onChange={() => toggleCreateCounty(c)}
                  />
                  <span>{c}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <input
              value={assignmentForm.title}
              onChange={(event) => setAssignmentForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Survey title"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
            />
            <select
              value={assignmentForm.survey_type}
              onChange={(event) => setAssignmentForm((prev) => ({ ...prev, survey_type: event.target.value }))}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="malaria">Malaria</option>
              <option value="health">Health</option>
              <option value="maternal_child_health">Maternal Child Health</option>
              <option value="wash">WASH</option>
              <option value="nutrition">Nutrition</option>
            </select>
            <div className="grid gap-1">
              <label className="text-[11px] font-medium text-gray-600">Due / target (optional)</label>
              <input
                type="date"
                value={assignmentForm.due_date}
                onChange={(event) => setAssignmentForm((prev) => ({ ...prev, due_date: event.target.value }))}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="grid gap-1">
              <label className="text-[11px] font-medium text-gray-600">Survey ends (required)</label>
              <input
                type="date"
                value={assignmentForm.end_date}
                onChange={(event) => setAssignmentForm((prev) => ({ ...prev, end_date: event.target.value }))}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <input
              value={assignmentForm.description}
              onChange={(event) => setAssignmentForm((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Notes / instructions"
              className="sm:col-span-2 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
            />
            {createSurveyError && (
              <div className="sm:col-span-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {createSurveyError}
              </div>
            )}
            <button
              type="button"
              onClick={handleCreateAssignment}
              disabled={assignmentLoading}
              className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
            >
              {assignmentLoading ? 'Creating...' : 'Create survey'}
            </button>
          </div>

          <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-2">
            <p className="mb-1 text-xs font-semibold text-gray-700">Recent surveys</p>
            {assignmentLoading ? (
              <p className="text-xs text-gray-500">Loading surveys...</p>
            ) : assignments.length === 0 ? (
              <p className="text-xs text-gray-500">No surveys yet.</p>
            ) : (
              <div className="space-y-2">
                {assignments.slice(0, 8).map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex flex-wrap items-center gap-2 rounded-md bg-white px-2 py-2 text-xs text-gray-700"
                  >
                    <span className="font-medium">
                      #{assignment.id} {assignment.title} |{' '}
                      {assignment.counties && assignment.counties.length > 0
                        ? assignment.counties.join(', ')
                        : assignment.county}
                      {assignment.community ? ` · ${assignment.community}` : ''}
                      {assignment.end_date ? ` | ends ${String(assignment.end_date).slice(0, 10)}` : ''}
                    </span>
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                        assignment.status === 'locked'
                          ? 'bg-amber-100 text-amber-800'
                          : assignment.status === 'closed'
                            ? 'bg-gray-200 text-gray-700'
                            : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {assignment.status === 'locked' ? 'paused' : assignment.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => openSurveyEdit(assignment)}
                      className="rounded border border-gray-300 px-1.5 py-0.5 text-[10px] font-medium text-gray-800 hover:bg-gray-50"
                    >
                      Edit
                    </button>
                    {assignment.status === 'open' && (
                      <>
                        <button
                          type="button"
                          disabled={assignmentUpdatingId === assignment.id}
                          onClick={() => updateAssignmentStatus(assignment.id, 'locked')}
                          className="rounded border border-amber-300 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 hover:bg-amber-50 disabled:opacity-50"
                        >
                          Pause
                        </button>
                        <button
                          type="button"
                          disabled={assignmentUpdatingId === assignment.id}
                          onClick={() => {
                            if (window.confirm('End this survey? Census workers will no longer be able to submit for it.')) {
                              updateAssignmentStatus(assignment.id, 'closed');
                            }
                          }}
                          className="rounded border border-red-300 px-1.5 py-0.5 text-[10px] font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          End survey
                        </button>
                      </>
                    )}
                    {assignment.status === 'locked' && (
                      <button
                        type="button"
                        disabled={assignmentUpdatingId === assignment.id}
                        onClick={() => updateAssignmentStatus(assignment.id, 'open')}
                        className="rounded border border-emerald-300 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                      >
                        Resume
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={
                        assignmentUpdatingId === assignment.id || surveyDeletingId === assignment.id
                      }
                      onClick={() => setPendingDeleteSurveyId(assignment.id)}
                      className="rounded border border-red-300 px-1.5 py-0.5 text-[10px] font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      {surveyDeletingId === assignment.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {surveyEditOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-gray-200 bg-white p-5 shadow-xl">
              <h3 className="text-base font-semibold text-gray-900">Edit survey #{surveyEditOpen.id}</h3>
              <p className="mt-1 text-xs text-gray-500">
                Changes apply only to this survey. Paused or ended surveys stay blocked for new submissions. County list may
                be locked after the survey is created; field staff always enter district and community on the census form
                unless you use geographic access rules.
              </p>
              {Boolean(Number(surveyEditOpen.location_locked ?? 1)) && (
                <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
                  County list on this survey is locked. Use <strong>geographic access rules</strong> below to refine
                  counties, districts, or communities (up to 50 rows).
                </p>
              )}
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1 sm:col-span-2">
                  <span className="text-[11px] font-medium text-gray-600">Survey name</span>
                  <input
                    value={surveyEditForm.title}
                    onChange={(e) => setSurveyEditForm((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Survey title"
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
                <div className="grid gap-1 sm:col-span-2">
                  <span className="text-[11px] font-medium text-gray-600">Counties covered (max {MAX_SURVEY_COUNTIES})</span>
                  {Boolean(Number(surveyEditOpen.location_locked ?? 1)) ? (
                    <p className="rounded-lg border border-gray-200 bg-slate-50 px-3 py-2 text-sm text-gray-800">
                      {(surveyEditOpen.counties && surveyEditOpen.counties.length > 0
                        ? surveyEditOpen.counties
                        : surveyEditOpen.county
                          ? [surveyEditOpen.county]
                          : []
                      ).join(', ') || '—'}
                    </p>
                  ) : (
                    <div className="max-h-36 overflow-y-auto rounded-lg border border-gray-200 bg-white p-2">
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1 sm:grid-cols-3">
                        {LIBERIA_COUNTIES.map((c) => (
                          <label key={c} className="flex cursor-pointer items-center gap-2 text-[11px] text-gray-800">
                            <input
                              type="checkbox"
                              className="h-3.5 w-3.5 rounded border-gray-400 text-emerald-700"
                              checked={surveyEditForm.counties.includes(c)}
                              onChange={() => toggleSurveyEditCounty(c)}
                            />
                            <span>{c}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="text-[10px] text-gray-500">
                    Census workers enter district and community on each field report.
                  </p>
                </div>
                <label className="grid gap-1 sm:col-span-2">
                  <span className="text-[11px] font-medium text-gray-600">Survey category</span>
                  <select
                    value={surveyEditForm.survey_type}
                    onChange={(e) => setSurveyEditForm((prev) => ({ ...prev, survey_type: e.target.value }))}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="malaria">Malaria</option>
                    <option value="health">Health</option>
                    <option value="maternal_child_health">Maternal Child Health</option>
                    <option value="wash">WASH</option>
                    <option value="nutrition">Nutrition</option>
                  </select>
                </label>
                <label className="grid gap-1">
                  <span className="text-[11px] font-medium text-gray-600">Due / target (optional)</span>
                  <input
                    type="date"
                    value={surveyEditForm.due_date}
                    onChange={(e) => setSurveyEditForm((prev) => ({ ...prev, due_date: e.target.value }))}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-[11px] font-medium text-gray-600">Survey ends (required)</span>
                  <input
                    type="date"
                    value={surveyEditForm.end_date}
                    onChange={(e) => setSurveyEditForm((prev) => ({ ...prev, end_date: e.target.value }))}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
                <label className="grid gap-1 sm:col-span-2">
                  <span className="text-[11px] font-medium text-gray-600">Notes / instructions</span>
                  <textarea
                    value={surveyEditForm.description}
                    onChange={(e) => setSurveyEditForm((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Notes / instructions"
                    rows={3}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
                <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-teal-300 bg-white p-2 sm:col-span-2">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 rounded border-teal-400 text-teal-800"
                    checked={surveyEditForm.national_scope}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setSurveyEditForm((p) => {
                        if (!checked) {
                          const primary = p.counties[0] || '';
                          setPlaceRulesDraft((rows) =>
                            rows.map((r) => ({
                              ...r,
                              county: primary,
                              district: r.county === primary ? r.district : '',
                            }))
                          );
                        }
                        return { ...p, national_scope: checked };
                      });
                    }}
                  />
                  <span className="text-[11px] leading-snug text-teal-950">
                    <span className="font-semibold">National / multi-county survey</span> — allow extra geographic rules in{' '}
                    <em>other</em> counties than the primary county above. Leave off for a normal single-county survey
                    (recommended for accurate data).
                  </span>
                </label>

                <div className="rounded-lg border border-teal-200 bg-teal-50/80 p-3 sm:col-span-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-teal-900">Geographic access (optional)</p>
                      <p className="mt-1 text-[11px] text-teal-900">
                        {surveyEditForm.national_scope
                          ? 'Add districts/communities or other counties. Empty = no extra rules (combine with dashboard list below). Up to 50 rows.'
                          : `Extra rules must use counties selected above (${surveyEditForm.counties.join(', ') || 'above'}): districts or communities only. Up to 50 rows.`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addPlaceRuleRow}
                      disabled={placeRulesDraft.length >= 50}
                      className="rounded-lg border border-teal-300 bg-white px-2 py-1 text-[11px] font-medium text-teal-900 hover:bg-teal-100 disabled:opacity-50"
                    >
                      Add row
                    </button>
                  </div>
                  {placesLoading ? (
                    <p className="mt-2 text-xs text-teal-800">Loading place rules…</p>
                  ) : (
                    <div className="mt-2 max-h-52 space-y-2 overflow-y-auto rounded border border-teal-100 bg-white p-2">
                      {placeRulesDraft.length === 0 ? (
                        <p className="text-[11px] text-gray-600">No extra place rules. Use “Add row” to allow more areas.</p>
                      ) : (
                        placeRulesDraft.map((row, idx) => (
                          <div
                            key={`place-${idx}`}
                            className="grid gap-2 rounded-md border border-gray-100 p-2 sm:grid-cols-[1fr_1fr_1fr_auto]"
                          >
                            <select
                              value={row.county}
                              onChange={(e) => updatePlaceRuleRow(idx, 'county', e.target.value)}
                              disabled={!surveyEditForm.national_scope}
                              className="rounded border border-gray-300 px-2 py-1.5 text-[11px] disabled:cursor-not-allowed disabled:bg-slate-100"
                            >
                              <option value="">County</option>
                              {(
                                surveyEditForm.national_scope
                                  ? LIBERIA_COUNTIES
                                  : surveyEditForm.counties.length > 0
                                    ? surveyEditForm.counties
                                    : []
                              ).map((c) => (
                                <option key={`${idx}-${c}`} value={c}>
                                  {c}
                                </option>
                              ))}
                            </select>
                            <select
                              value={row.district}
                              onChange={(e) => updatePlaceRuleRow(idx, 'district', e.target.value)}
                              disabled={!row.county}
                              className="rounded border border-gray-300 px-2 py-1.5 text-[11px] disabled:bg-gray-100"
                            >
                              <option value="">District (optional)</option>
                              {(DISTRICTS_BY_COUNTY[row.county] || []).map((d) => (
                                <option key={`${idx}-d-${d}`} value={d}>
                                  {d}
                                </option>
                              ))}
                            </select>
                            <input
                              value={row.community}
                              onChange={(e) => updatePlaceRuleRow(idx, 'community', e.target.value)}
                              placeholder="Community (optional)"
                              className="rounded border border-gray-300 px-2 py-1.5 text-[11px]"
                            />
                            <button
                              type="button"
                              onClick={() => removePlaceRuleRow(idx)}
                              className="rounded border border-gray-200 px-2 py-1 text-[11px] text-red-700 hover:bg-red-50"
                            >
                              Remove
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
                <div className="rounded-lg border border-indigo-200 bg-indigo-50/80 p-3 sm:col-span-2">
                  <p className="text-xs font-semibold text-indigo-900">Census dashboards (assign who can use this survey)</p>
                  <p className="mt-1 text-[11px] text-indigo-800">
                    Leave none selected to allow <strong>all</strong> census accounts (subject to geographic rules above).
                    Select specific users to restrict this survey to those dashboards.
                  </p>
                  {assigneesLoading ? (
                    <p className="mt-2 text-xs text-indigo-700">Loading census accounts…</p>
                  ) : (
                    <div className="mt-2 max-h-48 space-y-1.5 overflow-y-auto rounded border border-indigo-100 bg-white p-2">
                      {censusUsersForAssign.length === 0 ? (
                        <p className="text-xs text-gray-500">No census users found.</p>
                      ) : (
                        censusUsersForAssign.map((u) => (
                          <label
                            key={u.id}
                            className="flex cursor-pointer items-start gap-2 rounded px-1 py-0.5 text-xs hover:bg-gray-50"
                          >
                            <input
                              type="checkbox"
                              className="mt-0.5"
                              checked={surveyAssigneeIds.includes(u.id)}
                              onChange={() => toggleSurveyAssignee(u.id)}
                            />
                            <span>
                              <span className="font-medium text-gray-900">{u.full_name || `User #${u.id}`}</span>
                              <span className="block text-[10px] text-gray-500">{u.email}</span>
                            </span>
                          </label>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSurveyEditOpen(null)}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={surveyEditSaving}
                  onClick={handleSaveSurveyEdit}
                  className="rounded-lg bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
                >
                  {surveyEditSaving ? 'Saving...' : 'Save survey'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
          <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500">Total Reports</p>
            <p className="text-2xl font-bold text-gray-900">{data?.stats?.total_reports || 0}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500">Malaria Cases</p>
            <p className="text-2xl font-bold text-emerald-700">{data?.stats?.total_malaria_cases || 0}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500">Urgent Alerts</p>
            <p className="text-2xl font-bold text-red-600">{data?.stats?.urgent_reports_count || 0}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500">Urgent Rate</p>
            <p className="text-2xl font-bold text-red-700">{urgentRate}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500">Malaria / 100 HH</p>
            <p className="text-2xl font-bold text-blue-700">{malariaPer100Households}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500">Avg Reports / Day</p>
            <p className="text-2xl font-bold text-violet-700">{dailyAverageReports}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500">Records Loaded</p>
            <p className="text-2xl font-bold text-gray-900">{reports.length}</p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => applyDatePreset('today')} className="rounded-full border border-gray-300 px-3 py-1 text-xs font-medium hover:bg-gray-50">Today</button>
          <button type="button" onClick={() => applyDatePreset('7d')} className="rounded-full border border-gray-300 px-3 py-1 text-xs font-medium hover:bg-gray-50">Last 7 days</button>
          <button type="button" onClick={() => applyDatePreset('30d')} className="rounded-full border border-gray-300 px-3 py-1 text-xs font-medium hover:bg-gray-50">Last 30 days</button>
          <button type="button" onClick={() => applyDatePreset('all')} className="rounded-full border border-gray-300 px-3 py-1 text-xs font-medium hover:bg-gray-50">All time</button>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <input
              value={newViewName}
              onChange={(event) => setNewViewName(event.target.value)}
              placeholder="Save current view"
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-500"
            />
            <button type="button" onClick={saveCurrentView} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700">Save view</button>
            <select
              onChange={(event) => {
                if (!event.target.value) return;
                applySavedView(event.target.value);
              }}
              className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:border-emerald-500"
              value=""
            >
              <option value="">Load saved view</option>
              {savedViews.map((view) => (
                <option key={view.name} value={view.params}>{view.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-4 grid gap-2 rounded-xl bg-white p-3 shadow-sm border border-gray-100 sm:grid-cols-2 lg:grid-cols-6">
          <input
            value={county}
            onChange={(e) => setCounty(e.target.value)}
            placeholder="Filter county"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
          />
          <input
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            placeholder="Filter district"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
          />
          <input
            value={electoralDistrict}
            onChange={(e) => setElectoralDistrict(e.target.value)}
            placeholder="Electoral district (e.g. MED-01)"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
            title="NEC House district id — partial match"
          />
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              value={community}
              onChange={(e) => setCommunity(e.target.value)}
              placeholder="Community"
              className="w-full rounded-lg border border-gray-300 py-2 pl-8 pr-3 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All status</option>
            <option value="submitted">Submitted</option>
            <option value="reviewed">Reviewed</option>
            <option value="needs_correction">Needs correction</option>
            <option value="withdrawn">Withdrawn</option>
          </select>
          <select
            value={urgentFilter}
            onChange={(e) => setUrgentFilter(e.target.value as typeof urgentFilter)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Urgent: all</option>
            <option value="yes">Urgent only</option>
            <option value="no">Non-urgent only</option>
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
          >
            <option value="date_of_visit">Sort: Visit Date ↓↑</option>
            <option value="created_at">Sort: Sent Time ↓↑</option>
            <option value="malaria_cases">Sort: Malaria Cases ↓↑</option>
            <option value="households_surveyed">Sort: Households ↓↑</option>
            <option value="community">Sort: Community A-Z</option>
            <option value="county">Sort: County A-Z</option>
            <option value="status">Sort: Status</option>
          </select>
          <select
            value={sortDir}
            onChange={(e) => setSortDir(e.target.value as typeof sortDir)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
          >
            <option value="desc">Order: Desc</option>
            <option value="asc">Order: Asc</option>
          </select>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setViewMode((prev) => (prev === 'list' ? 'map' : 'list'))}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              {viewMode === 'list' ? 'Map view' : 'List view'}
            </button>
            <button
              type="button"
              onClick={() => {
                setCounty('');
                setDistrict('');
                setElectoralDistrict('');
                setCommunity('');
                setDateFrom(daysAgoDateString(7));
                setDateTo(getTodayDateString());
                setUrgentFilter('all');
                setStatus('all');
                setSortBy('date_of_visit');
                setSortDir('desc');
                setPage(1);
              }}
              className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              Reset Filters
            </button>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white p-3">
          <button
            type="button"
            onClick={setOrClearSelectAll}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            {allSelectedOnPage ? <CheckSquare size={14} /> : <Square size={14} />}
            {allSelectedOnPage ? 'Clear page' : 'Select page'}
          </button>
          <button
            type="button"
            disabled={bulkLoading || selectedIds.length === 0}
            onClick={() => bulkUpdateStatus('reviewed')}
            className="rounded-lg border border-emerald-300 px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
          >
            Mark reviewed ({selectedIds.length})
          </button>
          <button
            type="button"
            disabled={bulkLoading || selectedIds.length === 0}
            onClick={() => bulkUpdateStatus('needs_correction')}
            className="rounded-lg border border-amber-300 px-2.5 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-50"
          >
            Request correction ({selectedIds.length})
          </button>
          <button
            type="button"
            disabled={selectedIds.length === 0}
            onClick={exportSelected}
            className="rounded-lg border border-blue-300 px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-50"
          >
            Export selected
          </button>
          <span className="ml-auto text-xs text-gray-500">Withdrawn reports are excluded from analytics by default.</span>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Loading reports...</p>
        ) : viewMode === 'map' ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            {!data?.map_points?.length ? (
              <div className="text-sm text-gray-500">No mappable points in current filter.</div>
            ) : (
              <div className="max-h-[60vh] overflow-auto space-y-2">
                {data.map_points.slice(0, 250).map((point) => (
                  <a
                    key={point.id}
                    href={`https://maps.google.com/?q=${point.gps_lat},${point.gps_lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50/50 px-3 py-2 text-sm hover:bg-blue-50"
                  >
                    <span className="font-medium text-blue-900">
                      {point.community}, {point.county}
                    </span>
                    <span className="text-xs text-blue-700">
                      {point.gps_lat}, {point.gps_lng}
                    </span>
                  </a>
                ))}
              </div>
            )}
          </div>
        ) : !reports.length ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
            <p>No reports found for selected filters.</p>
            <button
              type="button"
              onClick={() => {
                setCounty('');
                setDistrict('');
                setElectoralDistrict('');
                setCommunity('');
                setDateFrom(daysAgoDateString(7));
                setDateTo(getTodayDateString());
                setUrgentFilter('all');
                setStatus('all');
                setSortBy('date_of_visit');
                setSortDir('desc');
                setPage(1);
              }}
              className="mt-3 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Reset and show all
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => {
              const flags = getQualityFlags(report);
              const selected = selectedIds.includes(report.id);
              return (
                <div
                  key={report.id}
                  className={`rounded-2xl border bg-white p-4 shadow-sm ${report.is_urgent ? 'border-red-200' : 'border-gray-200'}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedIds((prev) =>
                            prev.includes(report.id) ? prev.filter((id) => id !== report.id) : [...prev, report.id]
                          )
                        }
                        className="mt-0.5 rounded p-1 hover:bg-gray-100"
                      >
                        {selected ? <CheckSquare size={16} className="text-emerald-700" /> : <Square size={16} className="text-gray-500" />}
                      </button>
                      <div>
                        <p className="font-semibold text-gray-900">{report.community}, {report.county}</p>
                        <p className="text-xs text-gray-500">
                          {report.collector_name} ({report.collector_email || 'No email'})
                        </p>
                        <p className="text-xs text-gray-500">
                          Visit: {new Date(report.date_of_visit).toLocaleDateString('en-US', { timeZone: LIBERIA_TIMEZONE })} | Sent:{' '}
                          {new Date(report.created_at).toLocaleString('en-US', { timeZone: LIBERIA_TIMEZONE })}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          Timeline: created {new Date(report.created_at).toLocaleString('en-US', { timeZone: LIBERIA_TIMEZONE })} | updated{' '}
                          {new Date(report.updated_at || report.created_at).toLocaleString('en-US', { timeZone: LIBERIA_TIMEZONE })}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {report.is_urgent && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
                          <AlertTriangle size={12} />
                          Urgent
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          report.status === 'reviewed'
                            ? 'bg-emerald-100 text-emerald-700'
                            : report.status === 'needs_correction'
                              ? 'bg-red-100 text-red-700'
                              : report.status === 'withdrawn'
                                ? 'bg-gray-200 text-gray-700'
                                : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {report.status === 'needs_correction' ? 'needs correction' : report.status}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-700">
                    <span>Households: {report.households_surveyed}</span>
                    <span>Malaria: {report.malaria_cases}</span>
                    <span>Fever: {report.fever_cases}</span>
                    <span>Children &lt; 5: {report.children_under_5}</span>
                    <span>Pregnant: {report.pregnant_women}</span>
                    {report.district && <span>District: {report.district}</span>}
                    {!!report.electoral_district && (
                      <span
                        className="max-w-[min(100%,28rem)] truncate"
                        title={electoralLabelFor(report.county, report.electoral_district)}
                      >
                        NEC: {report.electoral_district}
                      </span>
                    )}
                  </div>

                  {!!flags.length && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {flags.map((flag) => (
                        <span key={flag} className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                          {flag}
                        </span>
                      ))}
                    </div>
                  )}

                  {(report.location_landmark?.trim() || (report.gps_lat !== null && report.gps_lng !== null)) && (
                    <div className="mt-2 flex flex-wrap items-start gap-2 rounded-lg bg-blue-50 px-2 py-1.5 text-xs text-blue-800">
                      <MapPin size={14} className="mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1 space-y-0.5">
                        {!!report.location_landmark?.trim() && (
                          <p className="font-medium text-blue-900">{report.location_landmark.trim()}</p>
                        )}
                        <p className="text-blue-800/90">
                          {[report.community, report.district, report.electoral_district, report.county].filter(Boolean).join(' · ')}
                        </p>
                        {report.gps_lat !== null && report.gps_lng !== null && (
                          <a
                            href={`https://www.google.com/maps?q=${report.gps_lat},${report.gps_lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block text-blue-700 underline decoration-blue-400/70 underline-offset-2 hover:text-blue-900"
                          >
                            Open in map · {Number(report.gps_lat).toFixed(5)}, {Number(report.gps_lng).toFixed(5)}
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {report.notes && <p className="mt-2 rounded-lg bg-gray-50 p-2 text-sm text-gray-700">{report.notes}</p>}
                  {report.status === 'needs_correction' && String(report.correction_note || '').trim() && (
                    <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-sm text-amber-800">
                      <span className="font-semibold">Correction requested:</span> {report.correction_note}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => router.push(`/dashboard/researcher/census-reports/${report.id}`)}
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <Eye size={14} />
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push(`/dashboard/researcher/census-reports/${report.id}/edit`)}
                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                    >
                      <Pencil size={14} />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => updateReportStatus(report.id, 'reviewed')}
                      disabled={statusUpdatingId === report.id || report.status === 'withdrawn'}
                      className="rounded-lg border border-emerald-300 px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                    >
                      Mark reviewed
                    </button>
                    <button
                      type="button"
                      onClick={() => updateReportStatus(report.id, 'needs_correction')}
                      disabled={statusUpdatingId === report.id || report.status === 'withdrawn'}
                      className="rounded-lg border border-amber-300 px-2.5 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                    >
                      Request correction
                    </button>
                    <button
                      type="button"
                      onClick={() => requestDelete(report.id)}
                      disabled={deletingId === report.id}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-300 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                      {deletingId === report.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between rounded-xl bg-white p-3 border border-gray-100">
          <p className="text-xs text-gray-500">Page {data?.pagination?.page || 1} of {totalPages}</p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>

        {!!data?.location_breakdown?.length && (
          <div className="mt-4 rounded-xl border border-gray-200 bg-white p-3">
            <h3 className="mb-2 text-sm font-semibold text-gray-900">Location Breakdown</h3>
            <div className="max-h-56 overflow-auto space-y-1">
              {data.location_breakdown.slice(0, 30).map((loc, idx) => (
                <div key={`${loc.county}-${loc.district}-${idx}`} className="flex items-center justify-between text-xs">
                  <span className="text-gray-700">{loc.county}{loc.district ? ` / ${loc.district}` : ''}</span>
                  <span className="text-gray-500">{loc.reports_count} reports, {loc.malaria_cases} malaria</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Delete this report?"
        message="This permanently removes the report. For safety, type DELETE to continue."
        confirmText="Delete permanently"
        cancelText="Cancel"
        loadingText="Deleting..."
        loading={pendingDeleteId !== null && deletingId === pendingDeleteId}
        requireText="DELETE"
        requireTextLabel="Type this exact word"
        onCancel={() => {
          if (deletingId === null) {
            setPendingDeleteId(null);
          }
        }}
        onConfirm={async () => {
          if (pendingDeleteId === null) return;
          await handleDelete(pendingDeleteId);
          setPendingDeleteId(null);
        }}
      />
      <ConfirmDialog
        open={pendingDeleteSurveyId !== null}
        title="Delete this survey?"
        message="This permanently removes the survey definition, assignees, and geographic access rules. Submitted census reports are kept, but they will no longer be linked to this survey. Type DELETE to confirm."
        confirmText="Delete survey"
        cancelText="Cancel"
        loadingText="Deleting..."
        loading={pendingDeleteSurveyId !== null && surveyDeletingId === pendingDeleteSurveyId}
        requireText="DELETE"
        requireTextLabel="Type this exact word"
        onCancel={() => {
          if (surveyDeletingId === null) {
            setPendingDeleteSurveyId(null);
          }
        }}
        onConfirm={async () => {
          if (pendingDeleteSurveyId === null) return;
          await deleteSurvey(pendingDeleteSurveyId);
          setPendingDeleteSurveyId(null);
        }}
      />
      {correctionDialog.open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-amber-200 bg-white p-5 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900">Request Correction</h3>
            <p className="mt-1 text-sm text-gray-600">
              {correctionDialog.isBulk
                ? `Tell the field team what to fix for ${correctionDialog.ids.length} selected report(s).`
                : 'Tell the field team exactly what to correct in this report.'}
            </p>
            <label className="mt-4 grid gap-1">
              <span className="text-xs font-medium text-gray-700">Correction details</span>
              <textarea
                value={correctionDialog.note}
                onChange={(event) =>
                  setCorrectionDialog((prev) => ({ ...prev, note: event.target.value }))
                }
                placeholder="Example: Please verify households surveyed and update GPS coordinates for this community."
                rows={4}
                className="w-full resize-y rounded-xl border border-amber-300 bg-amber-50/40 px-3 py-2 text-sm text-gray-900 outline-none focus:border-amber-500"
              />
            </label>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeCorrectionDialog}
                disabled={statusUpdatingId !== null || bulkLoading}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmCorrectionRequest}
                disabled={!correctionDialog.note.trim() || statusUpdatingId !== null || bulkLoading}
                className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {statusUpdatingId !== null || bulkLoading ? 'Sending...' : 'Send correction request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
