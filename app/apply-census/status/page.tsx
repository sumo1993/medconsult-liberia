'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';

type Result =
  | { found: false; message: string }
  | { found: true; status: string; createdAt: string; reviewedAt: string | null };

const labels: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  pending: { label: 'Received — pending review', color: 'text-amber-700', icon: Clock },
  reviewing: { label: 'Under review', color: 'text-blue-700', icon: Clock },
  approved: { label: 'Approved — check email for login', color: 'text-emerald-700', icon: CheckCircle },
  rejected: { label: 'Not selected at this time', color: 'text-red-700', icon: XCircle },
};

export default function ApplyCensusStatusPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/census-field-applications/lookup-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ found: false, message: data.error || 'Error' });
        return;
      }
      if (data.found) {
        setResult({
          found: true,
          status: data.status,
          createdAt: data.createdAt,
          reviewedAt: data.reviewedAt,
        });
      } else {
        setResult({ found: false, message: data.message });
      }
    } catch {
      setResult({ found: false, message: 'Network error.' });
    } finally {
      setLoading(false);
    }
  };

  const meta = result?.found ? labels[result.status] ?? labels.pending : null;
  const Icon = meta?.icon ?? AlertCircle;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-slate-50 p-6 md:p-10">
      <div className="max-w-lg mx-auto">
        <button
          type="button"
          onClick={() => router.push('/apply-census')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={20} /> Back to application
        </button>
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Field / census application status</h1>
          <p className="text-gray-600 text-sm mb-6">
            Enter the email you used on the field / census application form.
          </p>
          <form onSubmit={submit} className="space-y-4">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500"
              placeholder="you@example.com"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Search size={18} />
              {loading ? 'Checking…' : 'Check status'}
            </button>
          </form>
          {result && (
            <div className="mt-8 pt-6 border-t">
              {!result.found ? (
                <p className="text-gray-700 flex gap-2">
                  <AlertCircle className="text-amber-500 shrink-0" size={20} />
                  {result.message}
                </p>
              ) : (
                <div className="space-y-2">
                  <div className={`flex items-center gap-2 font-semibold ${meta?.color}`}>
                    <Icon size={22} />
                    {meta?.label ?? result.status}
                  </div>
                  <p className="text-sm text-gray-500">Submitted: {new Date(result.createdAt).toLocaleString()}</p>
                  {result.reviewedAt && (
                    <p className="text-sm text-gray-500">Updated: {new Date(result.reviewedAt).toLocaleString()}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
