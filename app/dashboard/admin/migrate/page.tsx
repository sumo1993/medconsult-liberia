'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function MigratePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const router = useRouter();

  const runMigration = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/admin/migrate-researcher-role', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Migration failed');
      }
    } catch (err) {
      setError('Network error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Database Migration: Add Researcher Role
          </h1>
          
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
            <p className="text-sm text-blue-700">
              <strong>What this does:</strong>
            </p>
            <ul className="list-disc list-inside text-sm text-blue-700 mt-2">
              <li>Adds 'researcher' to the users table role ENUM</li>
              <li>Updates user 429319lr@gmail.com to researcher role</li>
              <li>Fixes the "Failed to update user" error</li>
            </ul>
          </div>

          <button
            onClick={runMigration}
            disabled={loading}
            className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-colors ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {loading ? 'Running Migration...' : 'Run Migration Now'}
          </button>

          {error && (
            <div className="mt-6 bg-red-50 border-l-4 border-red-500 p-4">
              <p className="text-sm font-semibold text-red-700">Error:</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          )}

          {result && (
            <div className="mt-6 bg-green-50 border-l-4 border-green-500 p-4">
              <p className="text-sm font-semibold text-green-700">✅ Success!</p>
              <p className="text-sm text-green-600 mt-2">{result.message}</p>
              {result.updatedUser && (
                <div className="mt-4 bg-white p-3 rounded border border-green-200">
                  <p className="text-xs font-semibold text-gray-700">Updated User:</p>
                  <p className="text-sm text-gray-600 mt-1">
                    <strong>Email:</strong> {result.updatedUser.email}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Name:</strong> {result.updatedUser.full_name}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Role:</strong> <span className="px-2 py-1 bg-teal-100 text-teal-800 rounded">{result.updatedUser.role}</span>
                  </p>
                </div>
              )}
              <button
                onClick={() => router.push('/dashboard/admin/users')}
                className="mt-4 w-full py-2 px-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold"
              >
                Go to Users Page
              </button>
            </div>
          )}

          <div className="mt-6">
            <button
              onClick={() => router.push('/dashboard/admin')}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Admin Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
