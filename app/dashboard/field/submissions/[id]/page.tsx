'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Pencil } from 'lucide-react';
import { useRoleRedirect } from '@/hooks/useRoleRedirect';
import ProfileAvatar from '@/components/ProfileAvatar';

interface CensusReport {
  id: number;
  date_of_visit: string;
  county: string;
  district: string | null;
  community: string;
  location_landmark?: string | null;
  survey_type?: string;
  households_surveyed: number;
  malaria_cases: number;
  fever_cases: number;
  children_under_5: number;
  pregnant_women: number;
  notes?: string | null;
  correction_note?: string | null;
  gps_lat?: number | null;
  gps_lng?: number | null;
  is_urgent: boolean;
  status: 'submitted' | 'reviewed' | 'needs_correction' | 'withdrawn';
  created_at: string;
}

const LIBERIA_TIMEZONE = 'Africa/Monrovia';

export default function CensusSubmissionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthorized, isLoading } = useRoleRedirect('census');
  const [loadingReport, setLoadingReport] = useState(true);
  const [report, setReport] = useState<CensusReport | null>(null);

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
        setReport(data?.report || null);
      } catch (error) {
        console.error('Failed to fetch report:', error);
      } finally {
        setLoadingReport(false);
      }
    };
    fetchReport();
  }, [isAuthorized, params?.id]);

  if (isLoading || !isAuthorized || loadingReport) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-4 border-emerald-200 border-t-emerald-700 animate-spin" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white p-4">
        <div className="mx-auto max-w-3xl rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Report not found or you do not have access.
        </div>
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
              <h1 className="text-lg font-bold text-gray-900">Submission Details</h1>
              <p className="text-xs text-gray-500">Report #{report.id}</p>
            </div>
          </div>
          <ProfileAvatar onClick={() => router.push('/dashboard/field/profile')} />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-4 pb-24">
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={() => router.push(`/dashboard/field/submissions/${report.id}/edit`)}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
          >
            <Pencil size={16} />
            Edit Report
          </button>
        </div>

        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <p className="text-sm"><span className="font-semibold">County:</span> {report.county}</p>
            <p className="text-sm"><span className="font-semibold">District:</span> {report.district || 'N/A'}</p>
            <p className="text-sm"><span className="font-semibold">Community:</span> {report.community}</p>
            {String(report.location_landmark || '').trim() && (
              <p className="text-sm sm:col-span-2">
                <span className="font-semibold">Village / landmark:</span>{' '}
                <span className="whitespace-pre-wrap">{report.location_landmark}</span>
              </p>
            )}
            <p className="text-sm"><span className="font-semibold">Survey Type:</span> {report.survey_type || 'malaria'}</p>
            <p className="text-sm">
              <span className="font-semibold">Date of Visit:</span>{' '}
              {new Date(report.date_of_visit).toLocaleDateString('en-US', { timeZone: LIBERIA_TIMEZONE })}
            </p>
            <p className="text-sm">
              <span className="font-semibold">Submitted:</span>{' '}
              {new Date(report.created_at).toLocaleString('en-US', { timeZone: LIBERIA_TIMEZONE })}
            </p>
            <p className="text-sm"><span className="font-semibold">Households:</span> {report.households_surveyed}</p>
            <p className="text-sm"><span className="font-semibold">Status:</span> {report.status}</p>
            <p className="text-sm"><span className="font-semibold">Malaria Cases:</span> {report.malaria_cases}</p>
            <p className="text-sm"><span className="font-semibold">Fever Cases:</span> {report.fever_cases}</p>
            <p className="text-sm"><span className="font-semibold">Children under 5:</span> {report.children_under_5}</p>
            <p className="text-sm"><span className="font-semibold">Pregnant Women:</span> {report.pregnant_women}</p>
            <p className="text-sm"><span className="font-semibold">Urgent:</span> {report.is_urgent ? 'Yes' : 'No'}</p>
            <p className="text-sm"><span className="font-semibold">GPS:</span> {report.gps_lat ?? 'N/A'}, {report.gps_lng ?? 'N/A'}</p>
          </div>

          <div className="mt-4 border-t border-gray-100 pt-3">
            <p className="text-xs font-semibold text-gray-600">Notes</p>
            <p className="mt-1 text-sm text-gray-800 whitespace-pre-wrap">{report.notes || 'No notes provided.'}</p>
          </div>
          {report.status === 'needs_correction' && String(report.correction_note || '').trim() && (
            <div className="mt-4 border-t border-amber-100 pt-3">
              <p className="text-xs font-semibold text-amber-700">Correction Requested</p>
              <p className="mt-1 text-sm text-amber-900 whitespace-pre-wrap">{report.correction_note}</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
