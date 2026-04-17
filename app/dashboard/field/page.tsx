'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  ArrowRight,
  LogOut,
  Clock3,
  AlertTriangle,
  BookOpenCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useRoleRedirect } from '@/hooks/useRoleRedirect';
import { useSessionValidation } from '@/hooks/useSessionValidation';
import { useAccountStatus } from '@/hooks/useAccountStatus';
import ProfileAvatar from '@/components/ProfileAvatar';

type CensusAssignment = {
  id: number;
  title: string;
  description: string | null;
  county: string;
  counties?: string[];
  district: string | null;
  community: string | null;
  survey_type: string;
  due_date: string | null;
  end_date: string | null;
  status: string;
  created_at: string;
};

const SURVEYS_PAGE_SIZE = 5;

export default function CensusDashboardHomePage() {
  const router = useRouter();
  const { isAuthorized, isLoading } = useRoleRedirect('census');
  useSessionValidation();
  useAccountStatus();
  const [submittedCount, setSubmittedCount] = useState(0);
  const [todaySubmitted, setTodaySubmitted] = useState(0);
  const [todayUrgent, setTodayUrgent] = useState(0);
  const [lastSyncLabel, setLastSyncLabel] = useState('');
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [assignmentLoading, setAssignmentLoading] = useState(true);
  const [assignments, setAssignments] = useState<CensusAssignment[]>([]);
  const [surveyPage, setSurveyPage] = useState(1);

  useEffect(() => {
    if (!isAuthorized) return;

    const fetchSubmissionSummary = async () => {
      setLoadingSubmissions(true);
      try {
        const token = localStorage.getItem('auth-token');
        const baseResponse = await fetch('/api/reports/my?limit=1&page=1', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          cache: 'no-store',
        });
        if (baseResponse.ok) {
          const data = await baseResponse.json();
          const total = Number(data?.pagination?.total || 0);
          setSubmittedCount(Number.isFinite(total) ? total : 0);
        }

        const today = new Date().toISOString().split('T')[0];
        const todayResponse = await fetch(`/api/reports/my?limit=1&page=1&date_from=${today}&date_to=${today}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          cache: 'no-store',
        });
        if (todayResponse.ok) {
          const data = await todayResponse.json();
          setTodaySubmitted(Number(data?.pagination?.total || 0));
        }

        const urgentTodayResponse = await fetch(
          `/api/reports/my?limit=1&page=1&date_from=${today}&date_to=${today}&is_urgent=true`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            cache: 'no-store',
          }
        );
        if (urgentTodayResponse.ok) {
          const data = await urgentTodayResponse.json();
          setTodayUrgent(Number(data?.pagination?.total || 0));
        }

        setLastSyncLabel(
          new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          })
        );
      } catch (error) {
        console.error('Failed to load submission summary:', error);
      } finally {
        setLoadingSubmissions(false);
      }
    };

    fetchSubmissionSummary();
  }, [isAuthorized]);

  useEffect(() => {
    if (!isAuthorized) return;
    const fetchAssignments = async () => {
      setAssignmentLoading(true);
      try {
        const token = localStorage.getItem('auth-token');
        const response = await fetch('/api/census/assignments?limit=50', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          cache: 'no-store',
        });
        if (!response.ok) return;
        const payload = await response.json();
        setAssignments(Array.isArray(payload?.assignments) ? payload.assignments : []);
      } catch (error) {
        console.error('Failed to load census assignments:', error);
      } finally {
        setAssignmentLoading(false);
      }
    };
    fetchAssignments();
  }, [isAuthorized]);

  useEffect(() => {
    const tp = Math.max(1, Math.ceil(assignments.length / SURVEYS_PAGE_SIZE));
    setSurveyPage((p) => Math.min(Math.max(1, p), tp));
  }, [assignments.length]);

  const surveyTotalPages = Math.max(1, Math.ceil(assignments.length / SURVEYS_PAGE_SIZE));
  const surveyPageSafe = Math.min(Math.max(1, surveyPage), surveyTotalPages);
  const surveysOnPage = assignments.slice(
    (surveyPageSafe - 1) * SURVEYS_PAGE_SIZE,
    surveyPageSafe * SURVEYS_PAGE_SIZE
  );

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // continue local logout even if API logout fails
    } finally {
      localStorage.removeItem('auth-token');
      localStorage.removeItem('user');
      router.replace('/login');
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
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/90 via-white to-gray-50/80">
      <header className="sticky top-0 z-30 border-b border-emerald-100/80 bg-white/90 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:py-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold tracking-tight text-gray-900 sm:text-xl">Field Census Dashboard</h1>
            <p className="mt-0.5 text-xs text-gray-500 sm:text-sm">Welcome back. Choose what you want to do.</p>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <ProfileAvatar onClick={() => router.push('/dashboard/field/profile')} />
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="inline-flex items-center gap-2 rounded-lg border border-red-700 bg-red-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LogOut size={14} className="shrink-0" aria-hidden />
              {loggingOut ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-5 pb-28 sm:py-6 sm:pb-24">
        <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Submitted Today</p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-gray-900">{loadingSubmissions ? '…' : todaySubmitted}</p>
          </div>
          <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 to-white p-4 shadow-sm ring-1 ring-red-100">
            <p className="text-xs font-medium uppercase tracking-wide text-red-700">Urgent Today</p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-red-700">{loadingSubmissions ? '…' : todayUrgent}</p>
          </div>
          <div className="rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 to-white p-4 shadow-sm ring-1 ring-sky-100">
            <p className="text-xs font-medium uppercase tracking-wide text-sky-700">Last Sync</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-sky-900">
              {loadingSubmissions ? '…' : lastSyncLabel || '—'}
            </p>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
          <section className="lg:col-span-5">
            <button
              type="button"
              onClick={() => router.push('/dashboard/field/submissions')}
              className="w-full rounded-2xl border border-emerald-200/90 bg-white p-5 text-left shadow-md ring-1 ring-emerald-100 transition hover:border-emerald-300 hover:shadow-lg"
            >
              <div className="mb-3 inline-flex rounded-xl bg-blue-100 p-2.5 text-blue-700">
                <FileText size={22} />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">My Submissions</h2>
              <p className="mt-1 text-sm text-gray-600">View your latest submitted reports and status.</p>
              <p className="mt-2 text-sm font-medium text-gray-800">
                {loadingSubmissions ? 'Loading report count…' : `${submittedCount} reports submitted`}
              </p>
              <div className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-700">
                View submissions <ArrowRight size={16} />
              </div>
            </button>
          </section>

          <section className="rounded-2xl border border-blue-200 bg-blue-50/80 p-4 shadow-sm ring-1 ring-blue-100 lg:col-span-7">
            <h3 className="text-base font-semibold text-blue-950">Active surveys</h3>
            <p className="mt-1 text-xs leading-relaxed text-blue-900/90">
              Researchers create surveys (possibly many at once). Pick one to open the report form with that survey
              selected.
            </p>
            <div className="mt-4 space-y-3">
              {assignmentLoading ? (
                <p className="text-sm text-blue-800">Loading surveys…</p>
              ) : assignments.length === 0 ? (
                <p className="text-sm text-blue-800">No open surveys yet. Check back soon.</p>
              ) : (
                <>
                  {surveysOnPage.map((assignment) => (
                    <div key={assignment.id} className="rounded-xl border border-blue-200/90 bg-white p-3.5 shadow-sm">
                      <p className="text-sm font-semibold text-gray-900">{assignment.title}</p>
                      <p className="mt-1 text-xs text-gray-600">
                        Counties:{' '}
                        {assignment.counties && assignment.counties.length > 0
                          ? assignment.counties.join(', ')
                          : assignment.county}
                        {assignment.community ? ` · ${assignment.community}` : ''}
                        {assignment.end_date ? ` | Ends ${String(assignment.end_date).slice(0, 10)}` : ''}
                        {assignment.due_date ? ` | Target ${String(assignment.due_date).slice(0, 10)}` : ''}
                      </p>
                      {assignment.description && (
                        <p className="mt-1 text-xs text-gray-600">{assignment.description}</p>
                      )}
                      <button
                        type="button"
                        onClick={() => router.push(`/dashboard/field/submit?survey_id=${assignment.id}`)}
                        className="mt-3 w-full rounded-lg border border-blue-400 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-800 transition hover:bg-blue-100 sm:w-auto"
                      >
                        Start this survey
                      </button>
                    </div>
                  ))}
                  {surveyTotalPages > 1 && (
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-blue-200/60 pt-3">
                      <p className="text-xs text-blue-900/80">
                        Page {surveyPageSafe} of {surveyTotalPages}
                        <span className="text-blue-800/70">
                          {' '}
                          ({assignments.length} total)
                        </span>
                      </p>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setSurveyPage((p) => Math.max(1, Math.min(p, surveyTotalPages) - 1))}
                          disabled={surveyPageSafe <= 1}
                          className="inline-flex items-center gap-0.5 rounded-lg border border-blue-300 bg-white px-2.5 py-1.5 text-xs font-medium text-blue-900 shadow-sm hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <ChevronLeft size={16} aria-hidden />
                          Prev
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setSurveyPage((p) => Math.min(surveyTotalPages, Math.max(1, Math.min(p, surveyTotalPages)) + 1))
                          }
                          disabled={surveyPageSafe >= surveyTotalPages}
                          className="inline-flex items-center gap-0.5 rounded-lg border border-blue-300 bg-white px-2.5 py-1.5 text-xs font-medium text-blue-900 shadow-sm hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Next
                          <ChevronRight size={16} aria-hidden />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        </div>

        <section className="mt-8 rounded-2xl border border-emerald-200/90 bg-white p-4 shadow-sm ring-1 ring-emerald-100 sm:p-5">
          <h3 className="text-base font-semibold text-gray-900">Quick Field Tips</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-3.5">
              <div className="mb-2 inline-flex rounded-lg bg-emerald-100 p-1.5 text-emerald-700">
                <Clock3 size={14} />
              </div>
              <p className="text-xs font-semibold text-gray-800">Tip 1</p>
              <p className="mt-1 text-xs leading-relaxed text-gray-600">Submit reports the same day to keep trend analysis accurate.</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-3.5">
              <div className="mb-2 inline-flex rounded-lg bg-red-100 p-1.5 text-red-700">
                <AlertTriangle size={14} />
              </div>
              <p className="text-xs font-semibold text-gray-800">Tip 2</p>
              <p className="mt-1 text-xs leading-relaxed text-gray-600">Mark urgent when symptoms spike so researchers can prioritize.</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-3.5">
              <div className="mb-2 inline-flex rounded-lg bg-blue-100 p-1.5 text-blue-700">
                <BookOpenCheck size={14} />
              </div>
              <p className="text-xs font-semibold text-gray-800">Tip 3</p>
              <p className="mt-1 text-xs leading-relaxed text-gray-600">Use clear notes for anything unusual in your community report.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
