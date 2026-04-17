'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, Pencil, Trash2, Download, RotateCcw } from 'lucide-react';
import { useRoleRedirect } from '@/hooks/useRoleRedirect';
import ProfileAvatar from '@/components/ProfileAvatar';
import ConfirmDialog from '@/components/ConfirmDialog';

interface CensusReport {
  id: number;
  date_of_visit: string;
  county: string;
  district: string | null;
  community: string;
  survey_type?: 'malaria' | 'health' | 'maternal_child_health' | 'wash' | 'nutrition' | 'outbreak';
  households_surveyed: number;
  malaria_cases: number;
  fever_cases: number;
  children_under_5: number;
  pregnant_women: number;
  is_urgent: boolean;
  correction_note?: string | null;
  status: 'submitted' | 'reviewed' | 'needs_correction' | 'withdrawn' | string;
  created_at: string;
}

type SubmissionPagination = {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
};

const LIBERIA_TIMEZONE = 'Africa/Monrovia';

export default function CensusSubmissionsPage() {
  const router = useRouter();
  const { isAuthorized, isLoading } = useRoleRedirect('census');
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<CensusReport[]>([]);
  const [pagination, setPagination] = useState<SubmissionPagination>({
    page: 1,
    limit: 5,
    total: 0,
    total_pages: 1,
  });
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [restoringId, setRestoringId] = useState<number | null>(null);
  const [pendingWithdrawId, setPendingWithdrawId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'reviewed' | 'needs_correction' | 'withdrawn'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [exporting, setExporting] = useState(false);

  const fetchMyReports = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth-token');
      const params = new URLSearchParams({ limit: '5', page: String(page) });
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (dateFrom) params.set('date_from', dateFrom);
      if (dateTo) params.set('date_to', dateTo);
      const response = await fetch(`/api/reports/my?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: 'no-store',
      });
      if (!response.ok) return;
      const data = await response.json();
      setReports(Array.isArray(data?.reports) ? data.reports : []);
      setPagination({
        page: Number(data?.pagination?.page || page),
        limit: Number(data?.pagination?.limit || 5),
        total: Number(data?.pagination?.total || 0),
        total_pages: Math.max(1, Number(data?.pagination?.total_pages || 1)),
      });
    } catch (error) {
      console.error('Failed to fetch census submissions:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    if (!isAuthorized) return;
    fetchMyReports(1);
  }, [searchQuery, statusFilter, dateFrom, dateTo, isAuthorized, fetchMyReports]);

  const handleWithdraw = async (reportId: number) => {
    setDeletingId(reportId);
    setMessage(null);
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage({ type: 'error', text: data?.error || 'Failed to withdraw report.' });
        return;
      }
      setMessage({ type: 'success', text: 'Report withdrawn. You can undo within 5 minutes.' });
      setReports((prev) =>
        prev.map((report) => (report.id === reportId ? { ...report, status: 'withdrawn' } : report))
      );
    } catch (error) {
      console.error('Failed to withdraw report:', error);
      setMessage({ type: 'error', text: 'Network error while withdrawing report.' });
    } finally {
      setDeletingId(null);
    }
  };

  const handleUndoWithdraw = async (reportId: number) => {
    setRestoringId(reportId);
    setMessage(null);
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/reports/${reportId}/undo-withdraw`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage({ type: 'error', text: data?.error || 'Failed to restore report.' });
        return;
      }
      setMessage({ type: 'success', text: 'Report restored to submitted.' });
      setReports((prev) =>
        prev.map((report) => (report.id === reportId ? { ...report, status: 'submitted' } : report))
      );
    } catch (error) {
      console.error('Failed to restore withdrawn report:', error);
      setMessage({ type: 'error', text: 'Network error while restoring report.' });
    } finally {
      setRestoringId(null);
    }
  };

  const requestWithdraw = (reportId: number) => {
    setPendingWithdrawId(reportId);
  };

  const handleExportCsv = async () => {
    setExporting(true);
    setMessage(null);
    try {
      const token = localStorage.getItem('auth-token');
      const firstParams = new URLSearchParams({ page: '1', limit: '100' });
      if (searchQuery.trim()) firstParams.set('q', searchQuery.trim());
      if (statusFilter !== 'all') firstParams.set('status', statusFilter);
      if (dateFrom) firstParams.set('date_from', dateFrom);
      if (dateTo) firstParams.set('date_to', dateTo);

      const firstResponse = await fetch(`/api/reports/my?${firstParams.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: 'no-store',
      });
      if (!firstResponse.ok) {
        setMessage({ type: 'error', text: 'Failed to export reports.' });
        return;
      }
      const firstData = await firstResponse.json();
      let allReports: CensusReport[] = Array.isArray(firstData?.reports) ? firstData.reports : [];
      const totalPages = Number(firstData?.pagination?.total_pages || 1);

      for (let p = 2; p <= totalPages; p += 1) {
        const pageParams = new URLSearchParams(firstParams);
        pageParams.set('page', String(p));
        const pageResponse = await fetch(`/api/reports/my?${pageParams.toString()}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          cache: 'no-store',
        });
        if (!pageResponse.ok) continue;
        const pageData = await pageResponse.json();
        if (Array.isArray(pageData?.reports)) {
          allReports = allReports.concat(pageData.reports);
        }
      }

      const header = [
        'id',
        'date_of_visit',
        'county',
        'district',
        'community',
        'survey_type',
        'households_surveyed',
        'malaria_cases',
        'fever_cases',
        'children_under_5',
        'pregnant_women',
        'is_urgent',
        'status',
        'created_at',
      ];
      const rows = allReports.map((r) => [
        r.id,
        r.date_of_visit,
        r.county,
        r.district || '',
        r.community,
        r.survey_type || 'malaria',
        r.households_surveyed,
        r.malaria_cases,
        r.fever_cases,
        r.children_under_5,
        r.pregnant_women,
        r.is_urgent ? 'true' : 'false',
        r.status,
        r.created_at,
      ]);
      const csv = [header, ...rows]
        .map((line) =>
          line
            .map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`)
            .join(',')
        )
        .join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `census_submissions_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setMessage({ type: 'success', text: 'CSV export downloaded.' });
    } catch (error) {
      console.error('Failed to export CSV:', error);
      setMessage({ type: 'error', text: 'Failed to export reports.' });
    } finally {
      setExporting(false);
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
              type="button"
              onClick={() => router.push('/dashboard/field')}
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">My Submissions</h1>
              <p className="text-xs text-gray-500">{pagination.total} total reports</p>
            </div>
          </div>
          <ProfileAvatar onClick={() => router.push('/dashboard/field/profile')} />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-4 pb-24">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="grid w-full gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search county/district/community"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'submitted' | 'reviewed' | 'needs_correction' | 'withdrawn')}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            >
              <option value="all">All statuses</option>
              <option value="submitted">Submitted</option>
              <option value="reviewed">Reviewed</option>
              <option value="needs_correction">Needs correction</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={exporting}
              className="inline-flex items-center gap-2 rounded-lg border border-blue-300 bg-white px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-60"
            >
              <Download size={14} />
              {exporting ? 'Exporting...' : 'Export CSV'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/dashboard/field/submit')}
              className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
            >
              Submit New Report
            </button>
          </div>
        </div>

        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          {message && (
            <p className={`mb-3 text-sm ${message.type === 'success' ? 'text-emerald-700' : 'text-red-600'}`}>
              {message.text}
            </p>
          )}
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
                  {report.status === 'needs_correction' && String(report.correction_note || '').trim() && (
                    <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
                      <span className="font-semibold">Correction requested:</span> {report.correction_note}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => router.push(`/dashboard/field/submissions/${report.id}`)}
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <Eye size={14} />
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push(`/dashboard/field/submissions/${report.id}/edit`)}
                      disabled={report.status !== 'submitted' && report.status !== 'needs_correction'}
                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Pencil size={14} />
                      Edit
                    </button>
                    {report.status === 'withdrawn' ? (
                      <button
                        type="button"
                        onClick={() => handleUndoWithdraw(report.id)}
                        disabled={restoringId === report.id}
                        className="inline-flex items-center gap-1 rounded-lg border border-blue-300 px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <RotateCcw size={14} />
                        {restoringId === report.id ? 'Restoring...' : 'Undo'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => requestWithdraw(report.id)}
                        disabled={deletingId === report.id || report.status !== 'submitted'}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-300 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 size={14} />
                        {deletingId === report.id ? 'Withdrawing...' : 'Withdraw'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && pagination.total > 0 && (
            <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
              <p className="text-xs text-gray-500">
                Page {pagination.page} of {pagination.total_pages}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fetchMyReports(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => fetchMyReports(pagination.page + 1)}
                  disabled={pagination.page >= pagination.total_pages}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
      <ConfirmDialog
        open={pendingWithdrawId !== null}
        title="Withdraw this report?"
        message="The report will be hidden from normal analytics. You can undo within 5 minutes."
        confirmText="Withdraw report"
        cancelText="Cancel"
        loading={pendingWithdrawId !== null && deletingId === pendingWithdrawId}
        onCancel={() => {
          if (deletingId === null) {
            setPendingWithdrawId(null);
          }
        }}
        onConfirm={async () => {
          if (pendingWithdrawId === null) return;
          await handleWithdraw(pendingWithdrawId);
          setPendingWithdrawId(null);
        }}
      />
    </div>
  );
}
