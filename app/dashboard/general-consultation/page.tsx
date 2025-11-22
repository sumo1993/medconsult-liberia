'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, BookOpen, Calendar, ArrowLeft, Award, Target, TrendingUp } from 'lucide-react';

export default function GeneralConsultationDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    totalConsultations: 0,
    completedConsultations: 0,
    upcomingConsultations: 0,
    rating: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/my-profile', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        // Mock stats for now
        setStats({
          totalConsultations: 0,
          completedConsultations: 0,
          upcomingConsultations: 0,
          rating: 0
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">General Consultation Portal</h1>
              <p className="text-gray-600 mt-2">Welcome! Explore opportunities to join our team</p>
            </div>
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg shadow-lg">
              <p className="text-sm opacity-90">Status</p>
              <p className="text-xl font-bold">Prospective Member</p>
            </div>
          </div>
        </div>

        {/* Welcome Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-start gap-6">
            <div className="p-4 bg-blue-100 rounded-full">
              <Users className="text-blue-600" size={32} />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Welcome to MedConsult Liberia!</h2>
              <p className="text-gray-600 mb-4">
                Thank you for your interest in joining our team. This portal provides you with information about 
                consultation opportunities, team benefits, and the application process.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => router.push('/apply-team')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold shadow-md"
                >
                  Apply to Join Team
                </button>
                <button 
                  onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
                  className="px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-semibold"
                >
                  Learn More
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Award className="text-green-600" size={24} />
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-2">Team Members</p>
            <p className="text-3xl font-bold text-gray-900">50+</p>
            <p className="text-sm text-green-600 mt-2">Active Consultants</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <BookOpen className="text-blue-600" size={24} />
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-2">Consultations</p>
            <p className="text-3xl font-bold text-gray-900">100+</p>
            <p className="text-sm text-blue-600 mt-2">Completed This Year</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="text-purple-600" size={24} />
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-2">Earning Potential</p>
            <p className="text-3xl font-bold text-gray-900">Based on Research</p>
            <p className="text-sm text-purple-600 mt-2">Competitive Rates</p>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Why Join Our Team?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <div className="p-3 bg-emerald-100 rounded-lg h-fit">
                <Target className="text-emerald-600" size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Flexible Schedule</h3>
                <p className="text-gray-600 text-sm">Work on your own time and choose consultations that fit your schedule.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="p-3 bg-blue-100 rounded-lg h-fit">
                <Award className="text-blue-600" size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Competitive Earnings</h3>
                <p className="text-gray-600 text-sm">Earn competitive rates for each consultation with transparent payment structure.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="p-3 bg-purple-100 rounded-lg h-fit">
                <Users className="text-purple-600" size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Professional Growth</h3>
                <p className="text-gray-600 text-sm">Develop your skills and expand your professional network.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="p-3 bg-orange-100 rounded-lg h-fit">
                <TrendingUp className="text-orange-600" size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Career Advancement</h3>
                <p className="text-gray-600 text-sm">Opportunities to grow into leadership roles within the organization.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Application Process */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Application Process</h2>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Submit Application</h3>
                <p className="text-gray-600 text-sm">Fill out the application form with your qualifications and experience.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Review Process</h3>
                <p className="text-gray-600 text-sm">Our team will review your application and credentials (typically 3-5 business days).</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Interview</h3>
                <p className="text-gray-600 text-sm">If selected, you'll be invited for an interview with our team.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Onboarding</h3>
                <p className="text-gray-600 text-sm">Complete orientation and training to start your journey with us.</p>
              </div>
            </div>
          </div>

          <div className="mt-8 p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
            <p className="text-center text-gray-700">
              <strong>Ready to get started?</strong> Click the "Apply to Join Team" button above to begin your application.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
