'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, FileText } from 'lucide-react';
import { useRoleRedirect } from '@/hooks/useRoleRedirect';

type DashboardRole = 'admin' | 'management';

/** Must match `PRINTABLE_SURVEY_TYPES` in `lib/census-survey-print-forms.ts` (client avoids importing jsPDF). */
type PrintableSurveyType = 'malaria' | 'health' | 'maternal_child_health' | 'wash' | 'nutrition';

const PRINTABLE_SURVEY_TYPES: PrintableSurveyType[] = [
  'malaria',
  'health',
  'maternal_child_health',
  'wash',
  'nutrition',
];

const LABELS: Record<PrintableSurveyType, string> = {
  malaria: 'Malaria (household)',
  health: 'General health',
  maternal_child_health: 'Maternal & child health',
  wash: 'WASH',
  nutrition: 'Nutrition',
};

export default function SurveyPrintFormsPage({ dashboardRole }: { dashboardRole: DashboardRole }) {
  const router = useRouter();
  const { isAuthorized, isLoading: authLoading } = useRoleRedirect(['admin', 'management']);
  const [selected, setSelected] = useState<Set<PrintableSurveyType>>(() => new Set(PRINTABLE_SURVEY_TYPES));
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const basePath = `/dashboard/${dashboardRole}`;

  const toggle = (t: PrintableSurveyType) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  };

  const download = async (all: boolean) => {
    setError(null);
    setDownloading(true);
    try {
      const token = localStorage.getItem('auth-token');
      const typesQuery = all ? 'all' : Array.from(selected).join(',');
      if (!all && selected.size === 0) {
        setError('Select at least one survey type, or use “Download all”.');
        setDownloading(false);
        return;
      }
      const res = await fetch(`/api/census/survey-pdf?types=${encodeURIComponent(typesQuery)}`, {
        cache: 'no-store',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(typeof data?.error === 'string' ? data.error : 'Download failed');
      }
      const blob = await res.blob();
      const cd = res.headers.get('Content-Disposition');
      let name = `medconsult-field-survey-forms.pdf`;
      const m = cd?.match(/filename="([^"]+)"/);
      if (m?.[1]) name = m[1];
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-emerald-600 border-t-transparent" />
      </div>
    );
  }
  if (!isAuthorized) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-2xl mx-auto">
        <button
          type="button"
          onClick={() => router.push(basePath)}
          className="flex items-center gap-2 text-gray-600 mb-4 hover:text-gray-900"
        >
          <ArrowLeft size={20} /> Back to dashboard
        </button>

        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 sm:p-8">
          <div className="flex gap-3 mb-4">
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700 shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Paper survey forms (PDF)</h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">
                Generate blank forms for offline collection. Enter the same answers later in the digital field submission app when online.
              </p>
            </div>
          </div>

          <p className="text-sm text-gray-700 mb-4">Include these survey types in one PDF:</p>
          <ul className="space-y-2 mb-6">
            {PRINTABLE_SURVEY_TYPES.map((t) => (
              <li key={t}>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    checked={selected.has(t)}
                    onChange={() => toggle(t)}
                    disabled={downloading}
                  />
                  <span className="text-gray-900">{LABELS[t]}</span>
                </label>
              </li>
            ))}
          </ul>

          {error && (
            <p className="text-sm text-red-600 mb-4" role="alert">
              {error}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => download(true)}
              disabled={downloading}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-60 transition-colors"
            >
              <Download className="w-5 h-5" />
              {downloading ? 'Generating…' : 'Download all forms (one PDF)'}
            </button>
            <button
              type="button"
              onClick={() => download(false)}
              disabled={downloading || selected.size === 0}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg border-2 border-emerald-600 text-emerald-700 font-semibold hover:bg-emerald-50 disabled:opacity-60 transition-colors"
            >
              <Download className="w-5 h-5" />
              {downloading ? 'Generating…' : 'Download selected only'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
