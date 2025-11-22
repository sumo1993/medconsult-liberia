'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RatingsDebugPage() {
  const router = useRouter();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    const info: any = {
      timestamp: new Date().toISOString(),
      steps: [],
    };

    try {
      // Step 1: Check token
      const token = localStorage.getItem('auth-token');
      info.steps.push({
        step: 'Check Auth Token',
        status: token ? '✅ Found' : '❌ Missing',
        data: token ? 'Token exists' : 'No token',
      });

      // Step 2: Fetch profile
      try {
        const profileRes = await fetch('/api/profile', {
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
        });

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          info.steps.push({
            step: 'Fetch Profile',
            status: '✅ Success',
            data: {
              id: profileData.id,
              name: profileData.full_name,
              role: profileData.role,
              average_rating: profileData.average_rating,
              total_ratings: profileData.total_ratings,
            },
          });
          info.doctorId = profileData.id;
        } else {
          info.steps.push({
            step: 'Fetch Profile',
            status: '❌ Failed',
            data: `Status: ${profileRes.status}`,
          });
        }
      } catch (error: any) {
        info.steps.push({
          step: 'Fetch Profile',
          status: '❌ Error',
          data: error.message,
        });
      }

      // Step 3: Fetch ratings
      if (info.doctorId) {
        try {
          const ratingsRes = await fetch(`/api/ratings?doctorId=${info.doctorId}`, {
            headers: {
              ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            },
          });

          if (ratingsRes.ok) {
            const ratingsData = await ratingsRes.json();
            info.steps.push({
              step: 'Fetch Ratings',
              status: '✅ Success',
              data: {
                count: ratingsData.ratings?.length || 0,
                ratings: ratingsData.ratings || [],
              },
            });
          } else {
            const errorData = await ratingsRes.json();
            info.steps.push({
              step: 'Fetch Ratings',
              status: '❌ Failed',
              data: errorData,
            });
          }
        } catch (error: any) {
          info.steps.push({
            step: 'Fetch Ratings',
            status: '❌ Error',
            data: error.message,
          });
        }
      }

    } catch (error: any) {
      info.steps.push({
        step: 'General Error',
        status: '❌ Error',
        data: error.message,
      });
    }

    setDebugInfo(info);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">
              🔧 Rating System Diagnostics
            </h1>
            <button
              onClick={() => router.push('/dashboard/management')}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Back to Dashboard
            </button>
          </div>
          <p className="text-gray-600">
            This page helps diagnose why ratings might not be showing up.
          </p>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Running diagnostics...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Timestamp */}
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">
                <strong>Timestamp:</strong> {debugInfo.timestamp}
              </p>
            </div>

            {/* Steps */}
            {debugInfo.steps?.map((step: any, index: number) => (
              <div
                key={index}
                className={`bg-white rounded-lg shadow p-6 border-l-4 ${
                  step.status.includes('✅')
                    ? 'border-green-500'
                    : 'border-red-500'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Step {index + 1}: {step.step}
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      step.status.includes('✅')
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {step.status}
                  </span>
                </div>
                <div className="bg-gray-50 rounded p-4 overflow-auto">
                  <pre className="text-sm text-gray-700">
                    {JSON.stringify(step.data, null, 2)}
                  </pre>
                </div>
              </div>
            ))}

            {/* Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">
                📋 Summary
              </h3>
              <div className="space-y-2 text-sm text-blue-800">
                <p>
                  <strong>Total Steps:</strong> {debugInfo.steps?.length || 0}
                </p>
                <p>
                  <strong>Successful:</strong>{' '}
                  {debugInfo.steps?.filter((s: any) => s.status.includes('✅'))
                    .length || 0}
                </p>
                <p>
                  <strong>Failed:</strong>{' '}
                  {debugInfo.steps?.filter((s: any) => s.status.includes('❌'))
                    .length || 0}
                </p>
                {debugInfo.doctorId && (
                  <p>
                    <strong>Doctor ID:</strong> {debugInfo.doctorId}
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                🎯 Next Steps
              </h3>
              <div className="space-y-3">
                <button
                  onClick={runDiagnostics}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                >
                  🔄 Run Diagnostics Again
                </button>
                <button
                  onClick={() => router.push('/dashboard/management/ratings')}
                  className="w-full px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold"
                >
                  📊 View Ratings Page
                </button>
                <button
                  onClick={() => {
                    console.log('Debug Info:', debugInfo);
                    alert('Debug info logged to console. Press F12 to view.');
                  }}
                  className="w-full px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold"
                >
                  📋 Copy Debug Info to Console
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
