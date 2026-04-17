'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Send } from 'lucide-react';
import { useRoleRedirect } from '@/hooks/useRoleRedirect';
import ProfileAvatar from '@/components/ProfileAvatar';
import { isCoordinateInLiberia, LIBERIA_COUNTIES } from '@/lib/locations/liberia';
import LocationSelector, { type LocationValue } from '@/components/LocationSelector';

type CensusForm = {
  date_of_visit: string;
  county: string;
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
  location_landmark: string;
  status: 'submitted' | 'reviewed' | 'needs_correction' | 'withdrawn';
};

type ReverseGeocodeResponse = {
  location?: string;
  display_name?: string;
  city?: string;
  state?: string;
  country?: string;
};

type CensusAssignment = {
  id: number;
  county: string;
  district: string | null;
  community: string;
  location_locked?: boolean | number;
  national_scope?: boolean | number;
};

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

function normalize(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

export default function EditCensusSubmissionPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthorized, isLoading } = useRoleRedirect('census');

  const [loadingReport, setLoadingReport] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [resolvedPlaceName, setResolvedPlaceName] = useState('');
  const [resolvingPlace, setResolvingPlace] = useState(false);
  const [locationValue, setLocationValue] = useState<Partial<LocationValue>>({});
  const [assignment, setAssignment] = useState<CensusAssignment | null>(null);
  const [form, setForm] = useState<CensusForm>({
    date_of_visit: '',
    county: '',
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
    status: 'submitted',
  });

  useEffect(() => {
    if (!isAuthorized || !params?.id) return;
    const fetchReport = async () => {
      setLoadingReport(true);
      try {
        const token = localStorage.getItem('auth-token');
        const response = await fetch(`/api/reports/${params.id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          cache: 'no-store',
        });
        if (!response.ok) return;
        const data = await response.json();
        const report = data?.report;
        if (!report) return;

        let nextAssignment: CensusAssignment | null = null;
        const aid = Number(report.census_assignment_id || 0);
        if (aid > 0) {
          try {
            const ar = await fetch(`/api/census/assignments?id=${aid}&limit=1`, {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
              cache: 'no-store',
            });
            if (ar.ok) {
              const payload = await ar.json();
              const item = Array.isArray(payload?.assignments) ? payload.assignments[0] : null;
              if (item) nextAssignment = item as CensusAssignment;
            }
          } catch {
            /* ignore */
          }
        }
        setAssignment(nextAssignment);

        setForm({
          date_of_visit: String(report.date_of_visit || '').split('T')[0],
          county: String(report.county || ''),
          district: String(report.district || ''),
          community: String(report.community || ''),
          survey_type:
            typeof report.survey_type === 'string' &&
            ['malaria', ...NON_MALARIA_TYPES].includes(report.survey_type)
              ? report.survey_type
              : 'malaria',
          data: {
            diarrhea_cases: Number(report?.data?.diarrhea_cases || 0),
            respiratory_cases: Number(report?.data?.respiratory_cases || 0),
            fever_cases: Number(report?.data?.fever_cases || 0),
            clinic_visits: Number(report?.data?.clinic_visits || 0),
            water_source: String(report?.data?.water_source || ''),
            toilet_type: String(report?.data?.toilet_type || ''),
            handwashing_available: Boolean(report?.data?.handwashing_available),
            pregnant_women: Number(report?.data?.pregnant_women || 0),
            antenatal_visits: Number(report?.data?.antenatal_visits || 0),
            facility_births: Number(report?.data?.facility_births || 0),
            home_births: Number(report?.data?.home_births || 0),
            children_screened: Number(report?.data?.children_screened || 0),
            malnourished_children: Number(report?.data?.malnourished_children || 0),
            households_with_food_shortage: Number(report?.data?.households_with_food_shortage || 0),
          },
          households_surveyed: Number(report.households_surveyed || 0),
          malaria_cases: Number(report.malaria_cases || 0),
          fever_cases: Number(report.fever_cases || 0),
          children_under_5: Number(report.children_under_5 || 0),
          pregnant_women: Number(report.pregnant_women || 0),
          notes: String(report.notes || ''),
          location_landmark: String(report.location_landmark || '').slice(0, MAX_LANDMARK_CHARS),
          gps_lat: report.gps_lat === null ? null : Number(report.gps_lat),
          gps_lng: report.gps_lng === null ? null : Number(report.gps_lng),
          is_urgent: Boolean(report.is_urgent),
          status:
            report.status === 'reviewed'
              ? 'reviewed'
              : report.status === 'needs_correction'
                ? 'needs_correction'
                : report.status === 'withdrawn'
                  ? 'withdrawn'
                  : 'submitted',
        });
      } catch (error) {
        console.error('Failed to fetch report for edit:', error);
      } finally {
        setLoadingReport(false);
      }
    };
    fetchReport();
  }, [isAuthorized, params?.id]);

  const selectedCounty = form.county || '';

  /** Linked to a researcher survey: county, district, community, and survey type are fixed here; change them under Recent surveys. */
  const surveyFieldsLocked = Boolean(assignment);

  const handleLocationChange = (loc: Partial<LocationValue>) => {
    setLocationValue(loc);
    setForm((prev) => ({
      ...prev,
      county: loc.county_name || prev.county,
      district: loc.district_name || '',
      community: loc.community_name || '',
    }));
  };

  const resolvePlaceFromCoordinates = async (lat: number, lng: number, autoApply = false) => {
    setResolvingPlace(true);
    try {
      const response = await fetch(`/api/geocode/reverse?lat=${lat}&lng=${lng}`, { cache: 'no-store' });
      if (!response.ok) return;
      const geo = (await response.json()) as ReverseGeocodeResponse;
      const place = geo.display_name || geo.location || '';
      setResolvedPlaceName(place);

      if (!autoApply) return;
      if (String(geo.country || '').trim() === 'Outside Liberia') return;
      setForm((prev) => {
        const next = { ...prev };
        const stateName = String(geo.state || '').trim();
        const cityName = String(geo.city || '').trim();
        const matchedCounty =
          LIBERIA_COUNTIES.find((county) => normalize(county) === normalize(stateName)) || '';
        if (!surveyFieldsLocked && matchedCounty && !prev.county) {
          next.county = matchedCounty;
          next.district = '';
        }
        if (!surveyFieldsLocked && cityName && !prev.community) {
          next.community = cityName;
        }
        return next;
      });
    } catch (error) {
      console.error('Failed to resolve place name:', error);
    } finally {
      setResolvingPlace(false);
    }
  };

  useEffect(() => {
    if (loadingReport) return;
    if (form.gps_lat === null || form.gps_lng === null) {
      setResolvedPlaceName('');
      return;
    }
    if (!isCoordinateInLiberia(form.gps_lat, form.gps_lng)) {
      setResolvedPlaceName(
        'GPS is outside Liberia. Clear coordinates or enter latitude/longitude inside Liberia.'
      );
      return;
    }
    void resolvePlaceFromCoordinates(form.gps_lat, form.gps_lng, false);
  }, [loadingReport, form.gps_lat, form.gps_lng]);

  const updateCount = (
    field: keyof Pick<CensusForm, 'households_surveyed' | 'malaria_cases' | 'fever_cases' | 'children_under_5' | 'pregnant_women'>,
    value: number
  ) => {
    const normalized = Math.max(0, Math.min(MAX_NUMERIC, Math.floor(Number(value) || 0)));
    setForm((prev) => ({ ...prev, [field]: normalized }));
  };

  const validateForm = (): string | null => {
    if (form.status === 'reviewed' || form.status === 'withdrawn') return 'This report cannot be edited in its current status.';
    if (!form.date_of_visit) return 'Date of visit is required';
    if (!form.county.trim()) return 'County is required';
    if (!form.community.trim()) return 'Community is required';
    if (
      form.gps_lat !== null &&
      form.gps_lng !== null &&
      !isCoordinateInLiberia(form.gps_lat, form.gps_lng)
    ) {
      return 'GPS is outside Liberia. Clear coordinates or enter latitude/longitude inside Liberia.';
    }
    if (form.survey_type === 'malaria' && form.households_surveyed <= 0) return 'Households surveyed must be greater than 0';

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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);

    const validationError = validateForm();
    if (validationError) {
      setMessage({ type: 'error', text: validationError });
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/reports/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          ...form,
          data: form.survey_type === 'malaria' ? null : form.data,
          is_urgent: form.is_urgent || form.malaria_cases > URGENT_MALARIA_THRESHOLD,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage({ type: 'error', text: data?.error || 'Failed to update report.' });
        return;
      }
      setMessage({ type: 'success', text: 'Report updated successfully.' });
      setTimeout(() => router.push('/dashboard/field/submissions'), 450);
    } catch (error) {
      console.error('Failed to update report:', error);
      setMessage({ type: 'error', text: 'Network error while updating report.' });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || !isAuthorized || loadingReport) {
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
              type="button"
              onClick={() => router.push('/dashboard/field/submissions')}
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Edit Submission</h1>
              <p className="text-xs text-gray-500">Use the full report form to update this record</p>
            </div>
          </div>
          <ProfileAvatar onClick={() => router.push('/dashboard/field/profile')} />
        </div>
      </header>

      <main className="mx-auto grid max-w-4xl gap-4 px-4 py-4 pb-24">
        <section className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm">
          <h2 className="mb-4 font-semibold text-gray-900">Update Community Report</h2>
          {surveyFieldsLocked && (
            <p className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
              County, district, community, and survey type come from the researcher survey and cannot be changed on this
              screen. Ask your researcher to update the survey under Recent surveys if something is wrong.
            </p>
          )}

          <form onSubmit={handleSubmit} className="grid gap-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="grid gap-1">
                <span className="text-xs font-medium text-gray-600">Date of Visit / Observation</span>
                <input
                  type="date"
                  value={form.date_of_visit}
                  onChange={(e) => setForm((prev) => ({ ...prev, date_of_visit: e.target.value }))}
                  className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  required
                />
              </label>

              <div className="sm:col-span-2">
                <LocationSelector
                  value={locationValue}
                  onChange={handleLocationChange}
                  locked={surveyFieldsLocked}
                  districtOptional
                />
              </div>

              <label className="grid gap-1">
                <span className="text-xs font-medium text-gray-600">Survey Type</span>
                <select
                  value={form.survey_type}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      survey_type: e.target.value as CensusForm['survey_type'],
                    }))
                  }
                  disabled={surveyFieldsLocked}
                  className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none disabled:bg-gray-100 disabled:text-gray-600"
                >
                  <option value="malaria">Malaria (existing)</option>
                  <option value="" disabled>Other surveys</option>
                  {NON_MALARIA_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type
                        .split('_')
                        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                        .join(' ')}
                    </option>
                  ))}
                </select>
              </label>

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
                  <label key={item.key} className="grid gap-1 rounded-xl border border-gray-200 p-2">
                    <span className="text-xs font-medium text-gray-600">{item.label}</span>
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
                  </label>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {form.survey_type === 'health' && (
                  <>
                    <label className="grid gap-1">
                      <span className="text-xs font-medium text-gray-600">diarrhea_cases</span>
                      <input type="number" min={0} value={form.data.diarrhea_cases} onChange={(e) => setForm((prev) => ({ ...prev, data: { ...prev.data, diarrhea_cases: Math.max(0, Number(e.target.value) || 0) } }))} className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" />
                    </label>
                    <label className="grid gap-1">
                      <span className="text-xs font-medium text-gray-600">respiratory_cases</span>
                      <input type="number" min={0} value={form.data.respiratory_cases} onChange={(e) => setForm((prev) => ({ ...prev, data: { ...prev.data, respiratory_cases: Math.max(0, Number(e.target.value) || 0) } }))} className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" />
                    </label>
                    <label className="grid gap-1">
                      <span className="text-xs font-medium text-gray-600">fever_cases</span>
                      <input type="number" min={0} value={form.data.fever_cases} onChange={(e) => setForm((prev) => ({ ...prev, data: { ...prev.data, fever_cases: Math.max(0, Number(e.target.value) || 0) } }))} className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" />
                    </label>
                    <label className="grid gap-1">
                      <span className="text-xs font-medium text-gray-600">clinic_visits</span>
                      <input type="number" min={0} value={form.data.clinic_visits} onChange={(e) => setForm((prev) => ({ ...prev, data: { ...prev.data, clinic_visits: Math.max(0, Number(e.target.value) || 0) } }))} className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" />
                    </label>
                  </>
                )}

                {form.survey_type === 'maternal_child_health' && (
                  <>
                    <label className="grid gap-1">
                      <span className="text-xs font-medium text-gray-600">pregnant_women</span>
                      <input type="number" min={0} value={form.data.pregnant_women} onChange={(e) => setForm((prev) => ({ ...prev, data: { ...prev.data, pregnant_women: Math.max(0, Number(e.target.value) || 0) } }))} className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" />
                    </label>
                    <label className="grid gap-1">
                      <span className="text-xs font-medium text-gray-600">antenatal_visits</span>
                      <input type="number" min={0} value={form.data.antenatal_visits} onChange={(e) => setForm((prev) => ({ ...prev, data: { ...prev.data, antenatal_visits: Math.max(0, Number(e.target.value) || 0) } }))} className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" />
                    </label>
                    <label className="grid gap-1">
                      <span className="text-xs font-medium text-gray-600">facility_births</span>
                      <input type="number" min={0} value={form.data.facility_births} onChange={(e) => setForm((prev) => ({ ...prev, data: { ...prev.data, facility_births: Math.max(0, Number(e.target.value) || 0) } }))} className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" />
                    </label>
                    <label className="grid gap-1">
                      <span className="text-xs font-medium text-gray-600">home_births</span>
                      <input type="number" min={0} value={form.data.home_births} onChange={(e) => setForm((prev) => ({ ...prev, data: { ...prev.data, home_births: Math.max(0, Number(e.target.value) || 0) } }))} className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" />
                    </label>
                  </>
                )}

                {form.survey_type === 'wash' && (
                  <>
                    <label className="grid gap-1">
                      <span className="text-xs font-medium text-gray-600">water_source</span>
                      <select value={form.data.water_source} onChange={(e) => setForm((prev) => ({ ...prev, data: { ...prev.data, water_source: e.target.value } }))} className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none">
                        <option value="">Select Water Source</option>
                        {WATER_SOURCE_OPTIONS.map((opt) => (<option key={opt} value={opt}>{opt.replace(/_/g, ' ')}</option>))}
                      </select>
                    </label>
                    <label className="grid gap-1">
                      <span className="text-xs font-medium text-gray-600">toilet_type</span>
                      <select value={form.data.toilet_type} onChange={(e) => setForm((prev) => ({ ...prev, data: { ...prev.data, toilet_type: e.target.value } }))} className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none">
                        <option value="">Select Toilet Type</option>
                        {TOILET_TYPE_OPTIONS.map((opt) => (<option key={opt} value={opt}>{opt.replace(/_/g, ' ')}</option>))}
                      </select>
                    </label>
                    <label className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                      <input type="checkbox" checked={form.data.handwashing_available} onChange={(e) => setForm((prev) => ({ ...prev, data: { ...prev.data, handwashing_available: e.target.checked } }))} className="h-4 w-4" />
                      handwashing_available
                    </label>
                  </>
                )}

                {form.survey_type === 'nutrition' && (
                  <>
                    <label className="grid gap-1">
                      <span className="text-xs font-medium text-gray-600">children_screened</span>
                      <input type="number" min={0} value={form.data.children_screened} onChange={(e) => setForm((prev) => ({ ...prev, data: { ...prev.data, children_screened: Math.max(0, Number(e.target.value) || 0) } }))} className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" />
                    </label>
                    <label className="grid gap-1">
                      <span className="text-xs font-medium text-gray-600">malnourished_children</span>
                      <input type="number" min={0} value={form.data.malnourished_children} onChange={(e) => setForm((prev) => ({ ...prev, data: { ...prev.data, malnourished_children: Math.max(0, Number(e.target.value) || 0) } }))} className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" />
                    </label>
                    <label className="grid gap-1 sm:col-span-2">
                      <span className="text-xs font-medium text-gray-600">households_with_food_shortage</span>
                      <input type="number" min={0} value={form.data.households_with_food_shortage} onChange={(e) => setForm((prev) => ({ ...prev, data: { ...prev.data, households_with_food_shortage: Math.max(0, Number(e.target.value) || 0) } }))} className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" />
                    </label>
                  </>
                )}
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1">
                <span className="text-xs font-medium text-gray-600">Latitude (optional)</span>
                <input type="number" step="0.0000001" value={form.gps_lat ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, gps_lat: e.target.value === '' ? null : Number(e.target.value) }))} className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" />
                <span className="text-[11px] text-gray-500">Must be inside Liberia if provided, or leave blank.</span>
              </label>
              <label className="grid gap-1">
                <span className="text-xs font-medium text-gray-600">Longitude (optional)</span>
                <input type="number" step="0.0000001" value={form.gps_lng ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, gps_lng: e.target.value === '' ? null : Number(e.target.value) }))} className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" />
              </label>
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2">
              <p className="text-xs font-medium text-blue-800">Detected Place Name</p>
              <p className="mt-1 text-sm text-blue-900">
                {resolvingPlace
                  ? 'Resolving place from GPS...'
                  : resolvedPlaceName || 'No place resolved yet. Use the button below after entering GPS.'}
              </p>
              <button
                type="button"
                disabled={resolvingPlace || form.gps_lat === null || form.gps_lng === null}
                onClick={() => {
                  if (form.gps_lat === null || form.gps_lng === null) return;
                  if (!isCoordinateInLiberia(form.gps_lat, form.gps_lng)) {
                    setResolvedPlaceName(
                      'GPS is outside Liberia. Clear coordinates or enter latitude/longitude inside Liberia.'
                    );
                    return;
                  }
                  resolvePlaceFromCoordinates(form.gps_lat, form.gps_lng, false);
                }}
                className="mt-2 rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Resolve Place Name
              </button>
            </div>

            <label className="grid gap-1">
              <span className="text-xs font-medium text-gray-600">Village / landmark (optional)</span>
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
                placeholder="Local description (works offline)"
                className="min-h-[4rem] rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </label>

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
              <p className={`text-sm ${message.type === 'success' ? 'text-emerald-700' : 'text-red-600'}`}>
                {message.text}
              </p>
            )}

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send size={16} />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/dashboard/field/submissions')}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
