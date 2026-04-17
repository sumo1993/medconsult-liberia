'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getCountyCanonical } from '@/lib/locations/liberia';
import {
  getElectoralOptionsForCounty,
  getAdminDistrictNamesForElectoral,
  getSeedCommunitiesForElectoral,
} from '@/lib/locations/liberia-electoral';

// ── types ────────────────────────────────────────────────────────────────────

export interface County {
  id: number;
  name: string;
}

export interface District {
  id: number;
  name: string;
  county_id: number;
  status: 'approved' | 'pending';
}

export interface Community {
  id: number;
  name: string;
  normalized_name: string;
  district_id: number;
  status: 'approved' | 'unverified';
  usage_count: number;
}

export interface LocationValue {
  county_id: number;
  county_name: string;
  /** NEC House electoral district id (e.g. MED-12, BOMI-01). */
  electoral_district?: string;
  district_id: number;
  district_name: string;
  community_id: number;
  community_name: string;
}

interface LocationSelectorProps {
  value: Partial<LocationValue>;
  onChange: (value: Partial<LocationValue>) => void;
  disabled?: boolean;
  /** Lock all fields — used when survey location is fixed. */
  locked?: boolean;
  /** Show district as optional (no asterisk). */
  districtOptional?: boolean;
  /** When set (e.g. from researcher survey), only these county names appear — worker picks district/community. */
  allowedCountyNames?: string[];
  className?: string;
}

// ── helpers ──────────────────────────────────────────────────────────────────

function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function norm(s: string): string {
  return s.trim().replace(/\s+/g, ' ').toLowerCase();
}

// ── component ────────────────────────────────────────────────────────────────

export default function LocationSelector({
  value,
  onChange,
  disabled = false,
  locked = false,
  districtOptional = false,
  allowedCountyNames,
  className = '',
}: LocationSelectorProps) {
  const isDisabled = disabled || locked;

  // data
  const [counties, setCounties] = useState<County[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [suggestions, setSuggestions] = useState<Community[]>([]);

  // loading
  const [countiesLoading, setCountiesLoading] = useState(false);
  const [districtsLoading, setDistrictsLoading] = useState(false);
  const [communitiesLoading, setCommunitiesLoading] = useState(false);

  // community search
  const [communitySearch, setCommunitySearch] = useState(value.community_name || '');
  const [showCommunityDropdown, setShowCommunityDropdown] = useState(false);
  const communityRef = useRef<HTMLDivElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // add-new modals
  const [addingDistrict, setAddingDistrict] = useState(false);
  const [newDistrictName, setNewDistrictName] = useState('');
  const [addDistrictError, setAddDistrictError] = useState('');
  const [addDistrictSaving, setAddDistrictSaving] = useState(false);

  const visibleCounties = useMemo(() => {
    if (!allowedCountyNames?.length) return counties;
    const allowed = new Set(
      allowedCountyNames.map((a) => norm(getCountyCanonical(a) || a)).filter(Boolean)
    );
    return counties.filter((c) => allowed.has(norm(c.name)));
  }, [counties, allowedCountyNames]);

  const singleSurveyCounty = allowedCountyNames?.length === 1;
  const canonicalCounty = getCountyCanonical(value.county_name || '');
  const electoralOptions = useMemo(
    () => (canonicalCounty ? getElectoralOptionsForCounty(canonicalCounty) : []),
    [canonicalCounty]
  );
  const showElectoralPicker = electoralOptions.length > 1;

  const filteredDistrictRows = useMemo(() => {
    if (!canonicalCounty || !value.electoral_district) return districts;
    const allow = getAdminDistrictNamesForElectoral(canonicalCounty, value.electoral_district);
    if (!allow.length) return districts;
    const allowN = new Set(allow.map((a) => norm(a)));
    const filtered = districts.filter((d) => allowN.has(norm(d.name)));
    return filtered.length > 0 ? filtered : districts;
  }, [districts, canonicalCounty, value.electoral_district]);

  // ── fetch counties ─────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    setCountiesLoading(true);
    (async () => {
      try {
        const res = await fetch('/api/location/counties', { cache: 'no-store' });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (!cancelled && Array.isArray(data?.counties)) setCounties(data.counties);
      } catch { /* offline fallback: keep empty */ }
      finally { if (!cancelled) setCountiesLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  /** One survey county: auto-select DB row when counties load. */
  useEffect(() => {
    if (!singleSurveyCounty || !allowedCountyNames?.[0] || countiesLoading || isDisabled) return;
    const canon = getCountyCanonical(allowedCountyNames[0]) || allowedCountyNames[0];
    const row = counties.find((c) => norm(c.name) === norm(canon));
    if (!row) return;
    if (value.county_id === row.id && norm(value.county_name || '') === norm(row.name)) return;
    const surveyCanon = getCountyCanonical(row.name);
    const surveyEds = surveyCanon ? getElectoralOptionsForCounty(surveyCanon) : [];
    onChange({
      county_id: row.id,
      county_name: row.name,
      electoral_district: surveyEds.length === 1 ? surveyEds[0].id : undefined,
      district_id: 0,
      district_name: '',
      community_id: 0,
      community_name: '',
    });
    setCommunitySearch('');
  }, [
    singleSurveyCounty,
    allowedCountyNames,
    counties,
    countiesLoading,
    isDisabled,
    value.county_id,
    value.county_name,
    onChange,
  ]);

  // ── fetch districts on county change ───────────────────────────────────

  useEffect(() => {
    if (!value.county_id) {
      setDistricts([]);
      return;
    }
    let cancelled = false;
    setDistrictsLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/location/districts?county_id=${value.county_id}`, { cache: 'no-store' });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (!cancelled && Array.isArray(data?.districts)) setDistricts(data.districts);
      } catch { /* offline */ }
      finally { if (!cancelled) setDistrictsLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [value.county_id]);

  // ── community search ───────────────────────────────────────────────────

  const fetchCommunities = useCallback(async (districtId: number, search: string) => {
    setCommunitiesLoading(true);
    try {
      const params = new URLSearchParams({
        district_id: String(districtId),
        search,
        limit: '10',
      });
      const res = await fetch(`/api/location/communities?${params.toString()}`, {
        headers: authHeaders(),
        cache: 'no-store',
      });
      if (!res.ok) return;
      const data = await res.json();
      setCommunities(Array.isArray(data?.communities) ? data.communities : []);
      setSuggestions(Array.isArray(data?.suggestions) ? data.suggestions : []);
    } catch { /* offline */ }
    finally { setCommunitiesLoading(false); }
  }, []);

  useEffect(() => {
    if (!value.district_id) {
      setCommunities([]);
      setSuggestions([]);
      return;
    }
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      fetchCommunities(value.district_id!, communitySearch);
    }, 250);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [value.district_id, communitySearch, fetchCommunities]);

  // close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (communityRef.current && !communityRef.current.contains(e.target as Node)) {
        setShowCommunityDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // sync external value.community_name into search box
  useEffect(() => {
    if (value.community_name && value.community_name !== communitySearch) {
      setCommunitySearch(value.community_name);
    }
    // only sync on external prop change, not internal typing
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.community_id]);

  // ── handlers ───────────────────────────────────────────────────────────

  const handleCountyChange = (countyId: number) => {
    const county = visibleCounties.find((c) => c.id === countyId) || counties.find((c) => c.id === countyId);
    const name = county?.name || '';
    const canon = getCountyCanonical(name);
    const eds = canon ? getElectoralOptionsForCounty(canon) : [];
    onChange({
      county_id: countyId,
      county_name: name,
      electoral_district: eds.length === 1 ? eds[0].id : undefined,
      district_id: 0,
      district_name: '',
      community_id: 0,
      community_name: '',
    });
    setCommunitySearch('');
  };

  const handleElectoralChange = (edId: string) => {
    onChange({
      ...value,
      electoral_district: edId || undefined,
      district_id: 0,
      district_name: '',
      community_id: 0,
      community_name: '',
    });
    setCommunitySearch('');
  };

  const handleDistrictChange = (districtId: number) => {
    const district = filteredDistrictRows.find((d) => d.id === districtId) || districts.find((d) => d.id === districtId);
    onChange({
      ...value,
      district_id: districtId,
      district_name: district?.name || '',
      community_id: 0,
      community_name: '',
    });
    setCommunitySearch('');
  };

  const handleCommunitySelect = (community: Community) => {
    onChange({
      ...value,
      community_id: community.id,
      community_name: community.name,
    });
    setCommunitySearch(community.name);
    setShowCommunityDropdown(false);
  };

  const handleAddNewCommunity = async () => {
    if (!value.district_id || communitySearch.trim().length < 2) return;
    setCommunitiesLoading(true);
    try {
      const res = await fetch('/api/location/communities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ district_id: value.district_id, name: communitySearch.trim() }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data?.community) {
        handleCommunitySelect(data.community);
      }
    } catch { /* offline */ }
    finally { setCommunitiesLoading(false); }
  };

  const handleAddDistrict = async () => {
    if (!value.county_id || newDistrictName.trim().length < 2) {
      setAddDistrictError('Name must be at least 2 characters');
      return;
    }
    setAddDistrictSaving(true);
    setAddDistrictError('');
    try {
      const res = await fetch('/api/location/districts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ county_id: value.county_id, name: newDistrictName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddDistrictError(data?.error || 'Failed to add district');
        return;
      }
      if (data?.district) {
        setDistricts((prev) => [...prev, data.district].sort((a, b) => a.name.localeCompare(b.name)));
        handleDistrictChange(Number(data.district.id));
        setAddingDistrict(false);
        setNewDistrictName('');
      }
    } catch {
      setAddDistrictError('Network error');
    } finally {
      setAddDistrictSaving(false);
    }
  };

  // ── render ─────────────────────────────────────────────────────────────

  const inputBase =
    'w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none';
  const disabledClass = isDisabled ? 'cursor-not-allowed bg-slate-100 text-slate-700' : '';

  const exactMatch = communities.find(
    (c) => c.name.toLowerCase() === communitySearch.trim().toLowerCase()
  );
  const showAddOption = communitySearch.trim().length >= 2 && !exactMatch && !communitiesLoading;

  const seedNames =
    canonicalCounty && value.electoral_district
      ? getSeedCommunitiesForElectoral(canonicalCounty, value.electoral_district)
      : [];
  const districtList = filteredDistrictRows;
  const countyOptions = allowedCountyNames?.length ? visibleCounties : counties;
  const districtBlocked = electoralOptions.length > 0 && !value.electoral_district;

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* ── county ── */}
      <label className="grid gap-1.5">
        <span className="text-xs font-medium text-gray-700">
          County <span className="text-red-500">*</span>
        </span>
        {singleSurveyCounty && value.county_id && value.county_name ? (
          <div
            className={`${inputBase} ${disabledClass} border-emerald-200 bg-emerald-50/80 text-gray-900`}
          >
            <span className="font-medium">{value.county_name}</span>
            <span className="mt-0.5 block text-[10px] font-normal text-gray-600">
              Chosen by the researcher for this survey — select district and community below.
            </span>
          </div>
        ) : (
          <select
            value={value.county_id || ''}
            onChange={(e) => handleCountyChange(Number(e.target.value))}
            disabled={isDisabled}
            className={`${inputBase} ${disabledClass}`}
            required
          >
            <option value="">
              {countiesLoading ? 'Loading…' : 'Select county'}
            </option>
            {countyOptions.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
        {allowedCountyNames && allowedCountyNames.length > 1 ? (
          <span className="text-[10px] text-gray-500">
            Only counties included in your open survey are listed.
          </span>
        ) : null}
      </label>

      {/* ── NEC electoral district (narrows admin districts; Montserrado lists all 17) ── */}
      {showElectoralPicker && !isDisabled && (
        <label className="grid gap-1.5">
          <span className="text-xs font-medium text-gray-700">
            Electoral district <span className="text-red-500">*</span>
          </span>
          <select
            value={value.electoral_district || ''}
            onChange={(e) => handleElectoralChange(e.target.value)}
            className={inputBase}
            required
          >
            <option value="">Select electoral district (NEC)</option>
            {electoralOptions.map((ed) => (
              <option key={ed.id} value={ed.id}>
                {ed.label}
              </option>
            ))}
          </select>
          <span className="text-[10px] text-gray-500">
            Pick your NEC district first — then choose the administrative district. Suggested communities appear when
            you open Community.
          </span>
        </label>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
      {/* ── district ── */}
      <label className="grid gap-1.5">
        <span className="text-xs font-medium text-gray-700">
          District {!districtOptional && <span className="text-red-500">*</span>}
        </span>
        {addingDistrict ? (
          <div className="flex gap-1">
            <input
              value={newDistrictName}
              onChange={(e) => setNewDistrictName(e.target.value)}
              placeholder="New district name"
              className={`${inputBase} flex-1`}
              autoFocus
            />
            <button
              type="button"
              onClick={handleAddDistrict}
              disabled={addDistrictSaving}
              className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {addDistrictSaving ? '…' : 'Add'}
            </button>
            <button
              type="button"
              onClick={() => { setAddingDistrict(false); setNewDistrictName(''); setAddDistrictError(''); }}
              className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        ) : (
          <select
            value={value.district_id || ''}
            onChange={(e) => {
              const v = e.target.value;
              if (v === '__add__') {
                setAddingDistrict(true);
                return;
              }
              handleDistrictChange(Number(v));
            }}
            disabled={isDisabled || !value.county_id || districtBlocked}
            className={`${inputBase} ${disabledClass} ${!value.county_id || districtBlocked ? 'bg-gray-100 text-gray-500' : ''}`}
          >
            <option value="">
              {districtsLoading
                ? 'Loading…'
                : !value.county_id
                  ? 'Select county first'
                  : districtBlocked
                    ? 'Select electoral district first'
                    : 'Select district'}
            </option>
            {districtList.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}{d.status === 'pending' ? ' (pending)' : ''}
              </option>
            ))}
            {!isDisabled && value.county_id ? (
              <option value="__add__">+ Add new district</option>
            ) : null}
          </select>
        )}
        {addDistrictError && (
          <span className="text-[11px] text-red-600">{addDistrictError}</span>
        )}
      </label>

      {/* ── community ── */}
      <div className="relative grid gap-1.5" ref={communityRef}>
        <span className="text-xs font-medium text-gray-700">
          Community <span className="text-red-500">*</span>
        </span>
        {seedNames.length > 0 && value.district_id ? (
          <div className="flex flex-wrap gap-1.5">
            <span className="w-full text-[10px] font-medium text-gray-600">Suggested places (tap):</span>
            {seedNames.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => {
                  setCommunitySearch(name);
                  onChange({ ...value, community_id: 0, community_name: name });
                  setShowCommunityDropdown(true);
                }}
                className="rounded-full border border-emerald-200 bg-white px-2 py-0.5 text-[11px] text-emerald-900 hover:bg-emerald-50"
              >
                {name}
              </button>
            ))}
          </div>
        ) : null}
        <input
          type="text"
          value={communitySearch}
          onChange={(e) => {
            setCommunitySearch(e.target.value);
            onChange({ ...value, community_id: 0, community_name: e.target.value });
            setShowCommunityDropdown(true);
          }}
          onFocus={() => { if (value.district_id) setShowCommunityDropdown(true); }}
          placeholder={!value.district_id ? 'Select district first' : 'Search community…'}
          disabled={isDisabled || !value.district_id}
          className={`${inputBase} ${disabledClass} ${!value.district_id ? 'bg-gray-100 text-gray-500' : ''}`}
          required
          autoComplete="off"
        />

        {showCommunityDropdown && value.district_id && !isDisabled && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
            {communitiesLoading && (
              <div className="px-3 py-2 text-xs text-gray-500">Searching…</div>
            )}

            {communities.map((c) => (
              <button
                type="button"
                key={c.id}
                onClick={() => handleCommunitySelect(c)}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-emerald-50"
              >
                <span className="truncate">{c.name}</span>
                <span className="ml-2 shrink-0 text-[10px] text-gray-400">
                  used {c.usage_count}x
                </span>
              </button>
            ))}

            {suggestions.length > 0 && communities.length === 0 && (
              <>
                <div className="border-t border-gray-100 px-3 py-1.5 text-[11px] font-medium text-amber-700">
                  Did you mean:
                </div>
                {suggestions.map((s) => (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => handleCommunitySelect(s)}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-amber-800 hover:bg-amber-50"
                  >
                    <span className="truncate">{s.name}</span>
                    <span className="ml-2 shrink-0 text-[10px] text-gray-400">
                      used {s.usage_count}x
                    </span>
                  </button>
                ))}
              </>
            )}

            {showAddOption && (
              <button
                type="button"
                onClick={handleAddNewCommunity}
                className="flex w-full items-center gap-2 border-t border-gray-100 px-3 py-2 text-left text-sm font-medium text-emerald-700 hover:bg-emerald-50"
              >
                <span className="shrink-0 text-lg leading-none">+</span>
                <span className="truncate">
                  Add new community: <strong>{communitySearch.trim()}</strong>
                </span>
              </button>
            )}

            {!communitiesLoading && communities.length === 0 && suggestions.length === 0 && !showAddOption && (
              <div className="px-3 py-2 text-xs text-gray-500">
                {communitySearch.trim().length < 2 ? 'Type to search…' : 'No communities found'}
              </div>
            )}
          </div>
        )}
        <span className="text-[10px] text-gray-500">
          Type to search; new names are saved automatically for future use.
        </span>
      </div>
      </div>
    </div>
  );
}
