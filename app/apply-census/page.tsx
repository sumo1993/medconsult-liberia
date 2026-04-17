'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { CENSUS_FIELD_TEXT_MIN_LENGTH } from '@/lib/census-field-application-validation';

export default function ApplyCensusPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    preferredRegion: '',
    fieldExperience: '',
    motivation: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/census-field-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          preferredRegion: formData.preferredRegion.trim(),
          fieldExperience: formData.fieldExperience.trim(),
          motivation: formData.motivation.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Submission failed. Please try again.');
        return;
      }
      setSubmitted(true);
    } catch {
      setError('Network error. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 flex items-center justify-center p-8">
        <div className="max-w-xl w-full bg-white rounded-xl shadow-2xl p-8 text-center">
          <CheckCircle className="text-emerald-600 mx-auto mb-4" size={56} />
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Application received</h1>
          <p className="text-gray-600 mb-4">
            Thank you. We will review your request to collect field / census data for MedConsult Liberia.
            You will get an email when there is a decision.
          </p>
          <p className="text-sm text-gray-600 mb-6">
            <a href="/apply-census/status" className="text-emerald-700 font-semibold underline">
              Check your application status
            </a>{' '}
            anytime with your email.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              type="button"
              onClick={() => router.push('/apply-census/status')}
              className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg font-semibold"
            >
              Check status
            </button>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="px-5 py-2.5 border border-gray-300 rounded-lg font-semibold"
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => router.push('/dashboard/general-consultation')}
              className="px-5 py-2.5 border-2 border-emerald-600 text-emerald-700 rounded-lg font-semibold hover:bg-emerald-50"
            >
              Prospective member portal
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 p-6 md:p-10">
      <div className="max-w-2xl mx-auto">
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} /> Back
          </button>
          <Link href="/" className="text-sm text-emerald-700 font-medium hover:underline">
            MedConsult home
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-xl p-6 md:p-10">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 text-center">
            Apply for field / census data work
          </h1>
          <p className="text-gray-600 mb-4 text-center leading-relaxed">
            Use this form if you want to help collect survey and field data for our programs. Accounts are reviewed by
            our team; if approved, you will get a <strong>census field</strong> login to the field dashboard.
          </p>
          <div className="flex justify-center mb-6">
            <ul className="text-sm text-gray-600 list-disc list-inside space-y-1 text-left max-w-md">
              <li>Typical review time: a few business days (you will receive an email).</li>
              <li>
                Track your application anytime:{' '}
                <Link href="/apply-census/status" className="text-emerald-700 font-semibold underline">
                  check status by email
                </Link>
                .
              </li>
              <li>
                Applying as a consultant or researcher instead? Use{' '}
                <Link href="/apply-team" className="text-emerald-700 font-semibold underline">
                  Join our team
                </Link>
                .
              </li>
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {error && (
              <div
                className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                role="alert"
              >
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="census-fullName">
                Full name *
              </label>
              <input
                id="census-fullName"
                required
                autoComplete="name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="census-email">
                  Email *
                </label>
                <input
                  id="census-email"
                  type="email"
                  required
                  autoComplete="email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="census-phone">
                  Phone *
                </label>
                <input
                  id="census-phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="census-region">
                Preferred county / area to work in *
              </label>
              <input
                id="census-region"
                required
                autoComplete="address-level1"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="e.g. Montserrado, Nimba, or Nationwide"
                value={formData.preferredRegion}
                onChange={(e) => setFormData({ ...formData, preferredRegion: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="census-exp">
                Relevant experience (surveys, community work, devices, etc.) *
              </label>
              <textarea
                id="census-exp"
                required
                minLength={CENSUS_FIELD_TEXT_MIN_LENGTH}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Describe any survey, data collection, or community field experience (at least a few sentences)."
                value={formData.fieldExperience}
                onChange={(e) => setFormData({ ...formData, fieldExperience: e.target.value })}
              />
              <p className="mt-1 text-xs text-gray-500">
                Minimum {CENSUS_FIELD_TEXT_MIN_LENGTH} characters helps us review your background.
              </p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="census-why">
                Why do you want to do this work? *
              </label>
              <textarea
                id="census-why"
                required
                minLength={CENSUS_FIELD_TEXT_MIN_LENGTH}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="What motivates you to contribute to health data collection in Liberia?"
                value={formData.motivation}
                onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
              />
            </div>
            <p className="text-xs text-gray-500">
              By submitting, you agree that MedConsult Liberia may use this information only to evaluate your
              application and contact you about field work. We do not sell your data.
            </p>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50"
            >
              {submitting ? 'Submitting…' : 'Submit application'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
