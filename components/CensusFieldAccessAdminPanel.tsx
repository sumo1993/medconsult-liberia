'use client';

import { useCallback, useEffect, useState } from 'react';
import { MapPin, UserX } from 'lucide-react';

type CensusUserRow = { id: number; full_name: string; email: string; field_blocked: boolean };

export default function CensusFieldAccessAdminPanel() {
  const [blockAll, setBlockAll] = useState(false);
  const [users, setUsers] = useState<CensusUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const token = localStorage.getItem('auth-token');
      const res = await fetch('/api/census/field-access', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: 'no-store',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data?.error === 'string' ? data.error : 'Could not load field access');
        return;
      }
      setBlockAll(Boolean(data?.block_all_field));
      setUsers(Array.isArray(data?.users) ? data.users : []);
    } catch {
      setError('Could not load field access');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveAll = async (next: boolean) => {
    setSaving(true);
    setError(null);
    try {
      const token = localStorage.getItem('auth-token');
      const res = await fetch('/api/census/field-access', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ block_all_field: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data?.error === 'string' ? data.error : 'Update failed');
        return;
      }
      setBlockAll(Boolean(data?.block_all_field));
      if (Array.isArray(data?.users)) setUsers(data.users);
    } catch {
      setError('Update failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleUser = async (userId: number, field_blocked: boolean) => {
    setSaving(true);
    setError(null);
    try {
      const token = localStorage.getItem('auth-token');
      const res = await fetch('/api/census/field-access', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ user_id: userId, field_blocked }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data?.error === 'string' ? data.error : 'Update failed');
        return;
      }
      setBlockAll(Boolean(data?.block_all_field));
      if (Array.isArray(data?.users)) setUsers(data.users);
    } catch {
      setError('Update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 sm:p-6 mb-6">
      <div className="flex gap-3">
        <div className="p-2.5 rounded-lg bg-slate-100 text-slate-700 shrink-0">
          <MapPin className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <UserX className="w-5 h-5 text-slate-600" />
            Census field worker dashboard
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Block the mobile/field census dashboard (`/dashboard/field`) for all census accounts, or block individual
            census users. Researchers and admin census tools are not affected.
          </p>
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
            <span className="inline-block w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
            Loading…
          </div>
        ) : (
          <>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 rounded border-gray-300 text-slate-800 focus:ring-slate-500"
                checked={blockAll}
                disabled={saving}
                onChange={(e) => saveAll(e.target.checked)}
              />
              <span>
                <span className="font-medium text-gray-900">Block all census field dashboards</span>
                <span className="block text-sm text-gray-600">
                  Every user with the census role is denied access until you turn this off.
                </span>
              </span>
            </label>

            {users.length === 0 ? (
              <p className="text-sm text-gray-500">No census accounts yet. Create users with role “census” first.</p>
            ) : (
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Individual census users
                </div>
                <ul className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                  {users.map((u) => (
                    <li key={u.id} className="flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-gray-50">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{u.full_name || '—'}</p>
                        <p className="text-xs text-gray-500 truncate">{u.email}</p>
                      </div>
                      <label className="flex items-center gap-2 shrink-0 text-sm text-gray-700">
                        <span className="sr-only">Block {u.email}</span>
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                          checked={u.field_blocked}
                          disabled={saving || blockAll}
                          title={blockAll ? 'Turn off global block first' : 'Block this user only'}
                          onChange={(e) => toggleUser(u.id, e.target.checked)}
                        />
                        Block
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
