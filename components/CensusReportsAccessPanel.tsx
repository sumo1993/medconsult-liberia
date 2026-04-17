'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ClipboardList, Download, ExternalLink, Shield } from 'lucide-react';

type Role = 'admin' | 'management';

type Flags = {
  block_researchers: boolean;
  block_management: boolean;
};

export default function CensusReportsAccessPanel({ role }: { role: Role }) {
  const router = useRouter();
  const [flags, setFlags] = useState<Flags | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const token = localStorage.getItem('auth-token');
      const res = await fetch('/api/census-reports/access', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: 'no-store',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data?.error === 'string' ? data.error : 'Could not load access settings');
        setFlags(null);
        return;
      }
      const f = data?.flags;
      if (f && typeof f.block_researchers === 'boolean' && typeof f.block_management === 'boolean') {
        setFlags({ block_researchers: f.block_researchers, block_management: f.block_management });
      } else {
        setFlags(null);
        setError('Invalid response');
      }
    } catch {
      setError('Could not load access settings');
      setFlags(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (body: Record<string, boolean>) => {
    setSaving(true);
    setError(null);
    try {
      const token = localStorage.getItem('auth-token');
      const res = await fetch('/api/census-reports/access', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data?.error === 'string' ? data.error : 'Update failed');
        return;
      }
      if (data?.flags && typeof data.flags.block_researchers === 'boolean') {
        setFlags({
          block_researchers: data.flags.block_researchers,
          block_management: Boolean(data.flags.block_management),
        });
      }
    } catch {
      setError('Update failed');
    } finally {
      setSaving(false);
    }
  };

  const censusHref = '/dashboard/researcher/census-reports';
  const paperFormsHref = `/dashboard/${role}/survey-print-forms`;

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 sm:p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700 shrink-0">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-600" />
              Census reports & surveys
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {role === 'admin'
                ? 'Open the same tools as researchers. Block researchers or CEO (management) from this area when needed.'
                : 'Open reports and surveys like researchers. You can block researchers only; only an admin can restrict CEO access.'}
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          <button
            type="button"
            onClick={() => router.push(censusHref)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors"
          >
            Open census hub
            <ExternalLink className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => router.push(paperFormsHref)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 border-emerald-600 text-emerald-700 text-sm font-semibold hover:bg-emerald-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Paper forms (PDF)
          </button>
        </div>
      </div>

      {error && (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="inline-block w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            Loading access controls…
          </div>
        ) : flags ? (
          <>
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                className="mt-1 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                checked={flags.block_researchers}
                disabled={saving}
                onChange={(e) => save({ block_researchers: e.target.checked })}
              />
              <span>
                <span className="font-medium text-gray-900">Block researchers</span>
                <span className="block text-sm text-gray-600">
                  Researchers cannot open census reports or surveys until this is turned off.
                </span>
              </span>
            </label>

            {role === 'admin' && (
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  className="mt-1 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  checked={flags.block_management}
                  disabled={saving}
                  onChange={(e) => save({ block_management: e.target.checked })}
                />
                <span>
                  <span className="font-medium text-gray-900">Block CEO (management)</span>
                  <span className="block text-sm text-gray-600">
                    Management users cannot open census reports or surveys until this is turned off.
                  </span>
                </span>
              </label>
            )}
          </>
        ) : (
          <p className="text-sm text-gray-500">Access controls unavailable.</p>
        )}
      </div>
    </div>
  );
}
