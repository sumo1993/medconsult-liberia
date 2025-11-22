'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, TrendingUp, Save } from 'lucide-react';

interface Stats {
  research_projects: number;
  clinic_setups: number;
  rating: number;
  total_consultations: number;
  years_experience: number;
}

export default function StatisticsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    research_projects: 0,
    clinic_setups: 0,
    rating: 5.0,
    total_consultations: 0,
    years_experience: 0
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/statistics');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/statistics', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(stats),
      });

      if (response.ok) {
        showNotification('success', 'Statistics updated successfully!');
      } else {
        showNotification('error', 'Failed to update statistics');
      }
    } catch (error) {
      console.error('Error updating statistics:', error);
      showNotification('error', 'Failed to update statistics');
    } finally {
      setSaving(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleChange = (field: keyof Stats, value: string) => {
    const numValue = field === 'rating' ? parseFloat(value) : parseInt(value);
    setStats({ ...stats, [field]: numValue });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard/admin')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Dashboard
          </button>
          <div className="flex items-center space-x-3 mb-2">
            <TrendingUp className="text-emerald-600" size={32} />
            <h1 className="text-3xl font-bold text-gray-900">Statistics Management</h1>
          </div>
          <p className="text-gray-600">
            Update your track record and achievements displayed on the homepage
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Update Statistics</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Years of Experience */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Years of Experience
              </label>
              <input
                type="number"
                value={stats.years_experience}
                onChange={(e) => handleChange('years_experience', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                min="0"
              />
            </div>

            {/* Research Projects */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Research Projects Completed
              </label>
              <input
                type="number"
                value={stats.research_projects}
                onChange={(e) => handleChange('research_projects', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                min="0"
              />
            </div>

            {/* Clinic Setups */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Clinic Setups Completed
              </label>
              <input
                type="number"
                value={stats.clinic_setups}
                onChange={(e) => handleChange('clinic_setups', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                min="0"
              />
            </div>

            {/* Total Consultations */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Consultations
              </label>
              <input
                type="number"
                value={stats.total_consultations}
                onChange={(e) => handleChange('total_consultations', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                min="0"
              />
            </div>

            {/* Rating */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Overall Rating (out of 5.00)
              </label>
              <input
                type="number"
                value={stats.rating}
                onChange={(e) => handleChange('rating', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                min="0"
                max="5"
                step="0.01"
              />
              <p className="mt-1 text-sm text-gray-500">Enter a value between 0.00 and 5.00</p>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center space-x-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save size={20} />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-gradient-to-br from-emerald-700 to-emerald-900 rounded-lg p-8">
          <h3 className="text-2xl font-bold text-white mb-6 text-center">Preview</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-white mb-1">{stats.years_experience}+</div>
              <div className="text-emerald-100 text-sm">Years Experience</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-white mb-1">{stats.research_projects}+</div>
              <div className="text-emerald-100 text-sm">Research Projects</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-white mb-1">{stats.clinic_setups}+</div>
              <div className="text-emerald-100 text-sm">Clinic Setups</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-white mb-1">{stats.total_consultations}+</div>
              <div className="text-emerald-100 text-sm">Consultations</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-white mb-1">{stats.rating.toFixed(2)}</div>
              <div className="text-emerald-100 text-sm">Rating</div>
            </div>
          </div>
        </div>
      </div>

      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div
            className={`flex items-center space-x-3 px-6 py-4 rounded-lg shadow-lg ${
              notification.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}
          >
            <p className="font-medium">{notification.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
