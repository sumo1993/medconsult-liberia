'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [devResetLink, setDevResetLink] = useState('');
  const [emailSent, setEmailSent] = useState<boolean | null>(null);
  const [deliveryError, setDeliveryError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setDevResetLink(data.devResetLink || '');
        setEmailSent(typeof data.emailSent === 'boolean' ? data.emailSent : null);
        setDeliveryError(data.deliveryError || '');
        setSuccess(true);
      } else {
        setError(data.error || 'Failed to send reset instructions');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <Link href="/" className="inline-block">
              <div className="relative w-32 h-32">
                <Image
                  src="/logo.svg"
                  alt="MedConsult Liberia Logo"
                  width={128}
                  height={128}
                  className="object-contain"
                  priority
                />
              </div>
            </Link>
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Reset your password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email address and we&apos;ll help you reset your password
          </p>
        </div>

        {success ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                {emailSent === false ? 'Reset link generated' : 'Check your email'}
              </h3>
              <p className="text-sm text-green-800 mb-4">
                {emailSent === false ? (
                  <>
                    We couldn&apos;t deliver email right now. Use the reset link below for <strong>{email}</strong>.
                  </>
                ) : (
                  <>
                    We&apos;ve sent password reset instructions to <strong>{email}</strong>
                  </>
                )}
              </p>
              {emailSent === false && deliveryError && (
                <p className="text-xs text-amber-800 mb-3 text-left">
                  Email delivery error: {deliveryError}
                </p>
              )}
              {emailSent === false && deliveryError && (
                <div className="text-xs text-gray-700 mb-4 space-y-2 text-left rounded-md bg-white/80 border border-amber-200 p-3">
                  <p className="font-semibold text-gray-900">Fix Gmail SMTP (535 / wrong password)</p>
                  <p className="text-gray-600 mb-2">
                    <strong>SMTP_USER</strong> must be the <em>exact</em> Gmail you were logged into when you created the App
                    Password. If that was a different address than in <code className="bg-gray-100 px-1 rounded">.env.local</code>,
                    Gmail returns “Username and Password not accepted.”
                  </p>
                  <ol className="list-decimal list-inside space-y-1.5">
                    <li>
                      Turn on 2-Step Verification, then create a new{' '}
                      <strong>App Password</strong> for “Mail” at{' '}
                      <a
                        href="https://myaccount.google.com/apppasswords"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-700 underline"
                      >
                        myaccount.google.com/apppasswords
                      </a>
                      . Put the 16 characters in <code className="bg-gray-100 px-1 rounded">SMTP_PASS</code> (spaces optional).
                    </li>
                    <li>
                      If Google blocked a login: in the <strong>same browser</strong>, sign in first as your sending
                      account (e.g. medconsultliberia@gmail.com), then open{' '}
                      <a
                        href="https://accounts.google.com/DisplayUnlockCaptcha"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-700 underline break-all"
                      >
                        accounts.google.com/DisplayUnlockCaptcha
                      </a>{' '}
                      — do <strong>not</strong> use the <code className="bg-gray-100 px-1 rounded">/b/0/</code> variant
                      (that often shows only “Sign in”). Alternative:{' '}
                      <a
                        href="https://www.google.com/accounts/DisplayUnlockCaptcha"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-700 underline break-all"
                      >
                        google.com/accounts/DisplayUnlockCaptcha
                      </a>
                      . Click Continue if prompted.
                    </li>
                    <li>
                      <code className="bg-gray-100 px-1 rounded">SMTP_USER</code> must be the full sending address
                      (e.g. medconsultliberia@gmail.com). Restart <code className="bg-gray-100 px-1 rounded">npm run dev</code>{' '}
                      after saving <code className="bg-gray-100 px-1 rounded">.env.local</code>. Run{' '}
                      <code className="bg-gray-100 px-1 rounded">npm run verify:smtp</code> to test credentials without
                      using the forgot-password form.
                    </li>
                  </ol>
                </div>
              )}
              <p className="text-xs text-green-700 mb-4">
                If you don&apos;t see the email, check your spam folder or contact support.
              </p>
              {devResetLink && (
                <div className="mb-4 rounded-md border border-green-300 bg-white p-3 text-left">
                  <p className="text-xs font-semibold text-green-900 mb-1">Local development reset link:</p>
                  <a
                    href={devResetLink}
                    className="break-all text-xs text-emerald-700 hover:text-emerald-600 underline"
                  >
                    {devResetLink}
                  </a>
                </div>
              )}
              <Link
                href="/login"
                className="inline-flex items-center text-sm font-medium text-green-700 hover:text-green-600"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to login
              </Link>
            </div>

          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
            >
              {isLoading ? 'Sending...' : 'Send reset instructions'}
            </button>

            <div className="text-center">
              <Link
                href="/login"
                className="inline-flex items-center text-sm text-gray-600 hover:text-emerald-700"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to login
              </Link>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
