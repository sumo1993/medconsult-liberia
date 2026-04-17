'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Phone, MapPin, Check, X, Clock } from 'lucide-react';
import { useRoleRedirect } from '@/hooks/useRoleRedirect';
import { useNotifications } from '@/hooks/useNotifications';

interface Row {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  preferred_region: string;
  field_experience: string;
  motivation: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export default function CensusFieldApplicationsPage() {
  const router = useRouter();
  const { markCategorySeen } = useNotifications('admin');
  const { isAuthorized, isLoading: authLoading } = useRoleRedirect('admin');

  useEffect(() => {
    markCategorySeen('censusFieldApplications');
  }, [markCategorySeen]);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<Row | null>(null);
  const [notes, setNotes] = useState('');
  const [toast, setToast] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const url = filter === 'all' ? '/api/census-field-applications' : `/api/census-field-applications?status=${filter}`;
      const res = await fetch(url, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setRows(Array.isArray(data) ? data : []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading || !isAuthorized) return;
    load();
  }, [filter, authLoading, isAuthorized]);

  const updateStatus = async (status: 'reviewing' | 'approved' | 'rejected') => {
    if (!selected) return;
    const res = await fetch('/api/census-field-applications', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicationId: selected.id, status, adminNotes: notes }),
    });
    if (res.ok) {
      setToast('Updated');
      setSelected(null);
      load();
      setTimeout(() => setToast(''), 2500);
    } else {
      const d = await res.json();
      setToast(d.error || 'Failed');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-emerald-600 border-t-transparent" />
      </div>
    );
  }
  if (!isAuthorized) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <button
          type="button"
          onClick={() => router.push('/dashboard/admin')}
          className="flex items-center gap-2 text-gray-600 mb-4"
        >
          <ArrowLeft size={20} /> Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Field / census applications</h1>
        <p className="text-gray-600 mb-6">Review people who applied to collect field data via /apply-census</p>

        <div className="flex flex-wrap gap-2 mb-4">
          {['all', 'pending', 'reviewing', 'approved', 'rejected'].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                filter === s ? 'bg-emerald-600 text-white' : 'bg-white border'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-gray-500">Loading…</p>
        ) : rows.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center text-gray-500">
            No applications. Share: <code className="bg-gray-100 px-2 rounded">/apply-census</code>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-3">Applicant</th>
                  <th className="text-left p-3">Area</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Submitted</th>
                  <th className="text-left p-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div className="font-medium">{r.full_name}</div>
                      <div className="text-gray-500 flex items-center gap-1">
                        <Mail size={12} /> {r.email}
                      </div>
                    </td>
                    <td className="p-3">{r.preferred_region}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 text-xs">{r.status}</span>
                    </td>
                    <td className="p-3 text-gray-500">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => {
                          setSelected(r);
                          setNotes(r.admin_notes || '');
                        }}
                        className="text-emerald-600 font-medium"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {toast && <p className="fixed bottom-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg">{toast}</p>}

        {selected && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold">{selected.full_name}</h2>
                <button type="button" onClick={() => setSelected(null)} className="text-gray-400">
                  <X size={22} />
                </button>
              </div>
              <div className="space-y-3 text-sm">
                <p>
                  <Mail className="inline mr-1" size={14} /> {selected.email}
                </p>
                <p>
                  <Phone className="inline mr-1" size={14} /> {selected.phone}
                </p>
                <p>
                  <MapPin className="inline mr-1" size={14} /> {selected.preferred_region}
                </p>
                <div>
                  <strong>Experience</strong>
                  <p className="text-gray-700 whitespace-pre-wrap mt-1">{selected.field_experience}</p>
                </div>
                <div>
                  <strong>Motivation</strong>
                  <p className="text-gray-700 whitespace-pre-wrap mt-1">{selected.motivation}</p>
                </div>
                <div>
                  <label className="font-semibold">Notes (applicant may see in email)</label>
                  <textarea
                    className="w-full mt-1 border rounded-lg p-2"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-6">
                {selected.status === 'pending' && (
                  <button
                    type="button"
                    onClick={() => updateStatus('reviewing')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-1"
                  >
                    <Clock size={16} /> Reviewing
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => updateStatus('approved')}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg flex items-center gap-1"
                >
                  <Check size={16} /> Approve
                </button>
                <button
                  type="button"
                  onClick={() => updateStatus('rejected')}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg flex items-center gap-1"
                  >
                  <X size={16} /> Reject
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
