'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, TrendingUp, BarChart3, PieChart, Activity, 
  Calendar, MapPin, Target, Award, Zap
} from 'lucide-react';
import ProfileAvatar from '@/components/ProfileAvatar';

interface AnalyticsData {
  submissionsByDay: { date: string; count: number }[];
  submissionsByType: { type: string; count: number }[];
  submissionsByLocation: { location: string; count: number }[];
  weeklyProgress: number;
  monthlyProgress: number;
  streak: number;
  totalDataPoints: number;
  approvalRate: number;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    submissionsByDay: [],
    submissionsByType: [],
    submissionsByLocation: [],
    weeklyProgress: 0,
    monthlyProgress: 0,
    streak: 0,
    totalDataPoints: 0,
    approvalRate: 0,
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/researcher/analytics', {
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const maxDayCount = Math.max(...analytics.submissionsByDay.map(d => d.count), 1);
  const maxTypeCount = Math.max(...analytics.submissionsByType.map(d => d.count), 1);
  const maxLocationCount = Math.max(...analytics.submissionsByLocation.map(d => d.count), 1);

  const typeColors: { [key: string]: string } = {
    survey: 'bg-blue-500',
    observation: 'bg-green-500',
    sample: 'bg-purple-500',
    interview: 'bg-orange-500',
    measurement: 'bg-pink-500',
    other: 'bg-gray-500',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard/researcher')}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Analytics Dashboard</h1>
                <p className="text-sm text-gray-600">Track your research progress</p>
              </div>
            </div>
            <ProfileAvatar onClick={() => router.push('/dashboard/researcher/profile')} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading analytics...</p>
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-5 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={20} />
                  <span className="text-sm opacity-80">Current Streak</span>
                </div>
                <p className="text-3xl font-bold">{analytics.streak} days</p>
                <p className="text-xs opacity-70 mt-1">Keep it going! 🔥</p>
              </div>
              
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-5 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <Target size={20} />
                  <span className="text-sm opacity-80">Weekly Progress</span>
                </div>
                <p className="text-3xl font-bold">{analytics.weeklyProgress}%</p>
                <div className="w-full bg-white/30 rounded-full h-2 mt-2">
                  <div 
                    className="bg-white h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(analytics.weeklyProgress, 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-5 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <Activity size={20} />
                  <span className="text-sm opacity-80">Total Data Points</span>
                </div>
                <p className="text-3xl font-bold">{analytics.totalDataPoints.toLocaleString()}</p>
              </div>
              
              <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-5 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <Award size={20} />
                  <span className="text-sm opacity-80">Approval Rate</span>
                </div>
                <p className="text-3xl font-bold">{analytics.approvalRate}%</p>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* Submissions Over Time */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="text-emerald-600" size={20} />
                  <h3 className="text-lg font-semibold text-gray-900">Submissions (Last 7 Days)</h3>
                </div>
                <div className="h-48 flex items-end gap-2">
                  {analytics.submissionsByDay.map((day, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center gap-1">
                      <div 
                        className="w-full bg-emerald-500 rounded-t transition-all hover:bg-emerald-600"
                        style={{ 
                          height: `${(day.count / maxDayCount) * 100}%`,
                          minHeight: day.count > 0 ? '8px' : '2px',
                          backgroundColor: day.count === 0 ? '#e5e7eb' : undefined
                        }}
                      ></div>
                      <span className="text-xs text-gray-500">{day.date}</span>
                      <span className="text-xs font-semibold text-gray-700">{day.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submissions by Type */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <PieChart className="text-blue-600" size={20} />
                  <h3 className="text-lg font-semibold text-gray-900">By Data Type</h3>
                </div>
                <div className="space-y-3">
                  {analytics.submissionsByType.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No data yet</p>
                  ) : (
                    analytics.submissionsByType.map((item, index) => (
                      <div key={index}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600 capitalize">{item.type}</span>
                          <span className="font-semibold text-gray-900">{item.count}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className={`h-3 rounded-full transition-all ${typeColors[item.type] || 'bg-gray-500'}`}
                            style={{ width: `${(item.count / maxTypeCount) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Location Map */}
            <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="text-purple-600" size={20} />
                <h3 className="text-lg font-semibold text-gray-900">Top Locations</h3>
              </div>
              {analytics.submissionsByLocation.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No location data yet</p>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analytics.submissionsByLocation.slice(0, 6).map((loc, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <MapPin className="text-purple-600" size={18} />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{loc.location}</p>
                        <p className="text-sm text-gray-500">{loc.count} submissions</p>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-purple-600">
                          {Math.round((loc.count / maxLocationCount) * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Achievement Badges */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Award className="text-yellow-600" size={20} />
                <h3 className="text-lg font-semibold text-gray-900">Achievements</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`p-4 rounded-lg text-center ${analytics.totalDataPoints >= 10 ? 'bg-yellow-50 border-2 border-yellow-300' : 'bg-gray-50 opacity-50'}`}>
                  <div className="text-3xl mb-2">🎯</div>
                  <p className="font-semibold text-gray-900">First 10</p>
                  <p className="text-xs text-gray-500">Submit 10 data points</p>
                </div>
                <div className={`p-4 rounded-lg text-center ${analytics.streak >= 3 ? 'bg-yellow-50 border-2 border-yellow-300' : 'bg-gray-50 opacity-50'}`}>
                  <div className="text-3xl mb-2">🔥</div>
                  <p className="font-semibold text-gray-900">On Fire</p>
                  <p className="text-xs text-gray-500">3-day streak</p>
                </div>
                <div className={`p-4 rounded-lg text-center ${analytics.totalDataPoints >= 50 ? 'bg-yellow-50 border-2 border-yellow-300' : 'bg-gray-50 opacity-50'}`}>
                  <div className="text-3xl mb-2">⭐</div>
                  <p className="font-semibold text-gray-900">Data Star</p>
                  <p className="text-xs text-gray-500">Submit 50 data points</p>
                </div>
                <div className={`p-4 rounded-lg text-center ${analytics.approvalRate >= 90 ? 'bg-yellow-50 border-2 border-yellow-300' : 'bg-gray-50 opacity-50'}`}>
                  <div className="text-3xl mb-2">💎</div>
                  <p className="font-semibold text-gray-900">Quality Pro</p>
                  <p className="text-xs text-gray-500">90%+ approval rate</p>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}


