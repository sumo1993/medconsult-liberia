'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';

type LookupResult =
  | { found: false; message: string }
  | {
      found: true;
      status: string;
      createdAt: string;
      reviewedAt: string | null;
    };

const statusCopy: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  pending: { label: 'Received — we will review soon', color: 'text-amber-700', icon: Clock },
  reviewing: { label: 'Under review', color: 'text-blue-700', icon: Clock },
  approved: { label: 'Approved', color: 'text-emerald-700', icon: CheckCircle },
  rejected: { label: 'Not selected at this time', color: 'text-red-700', icon: XCircle },
};

export default function ApplyTeamStatusPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LookupResult | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/team-applications/lookup-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ found: false, message: data.error || 'Something went wrong.' });
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
        setResult({ found: false, message: data.message || 'No application found.' });
      }
    } catch {
      setResult({ found: false, message: 'Network error. Try again.' });
    } finally {
      setLoading(false);
    }
  };

  const meta = result?.found ? statusCopy[result.status] ?? statusCopy.pending : null;
  const Icon = meta?.icon ?? AlertCircle;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 p-6 md:p-10">
      <div className="max-w-lg mx-auto">
        <button
          type="button"
          onClick={() => router.push('/apply-team')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={20} /> Back to application
        </button>

        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Application status</h1>
          <p className="text-gray-600 text-sm mb-6">
            Enter the same email you used on the Join Our Team form. We will show the latest status for that
            address. If you are approved, you will also receive an email at this address.
          </p>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50"
            >
              <Search size={18} />
              {loading ? 'Checking…' : 'Check status'}
            </button>
          </form>

          {result && (
            <div className="mt-8 pt-6 border-t border-gray-100">
              {!result.found ? (
                <p className="text-gray-700 flex items-start gap-2">
                  <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={20} />
                  {result.message}
                </p>
              ) : (
                <div className="space-y-3">
                  <div className={`flex items-center gap-2 font-semibold ${meta?.color}`}>
                    <Icon size={22} />
                    {meta?.label ?? result.status}
                  </div>
                  <p className="text-sm text-gray-500">
                    Submitted: {new Date(result.createdAt).toLocaleString()}
                  </p>
                  {result.reviewedAt && (
                    <p className="text-sm text-gray-500">
                      Last update: {new Date(result.reviewedAt).toLocaleString()}
                    </p>
                  )}
                  {result.status === 'approved' && (
                    <p className="text-sm text-gray-700 mt-2">
                      Check your email for login instructions. If you were given a new researcher account, use the
                      temporary password from the email, then change your password after signing in.
                    </p>
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
