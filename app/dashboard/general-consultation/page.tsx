'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users, BookOpen, Award, Target, TrendingUp, MapPin, ClipboardList } from 'lucide-react';
import { useSessionValidation } from '@/hooks/useSessionValidation';

export default function GeneralConsultationDashboard() {
  const router = useRouter();
  useSessionValidation();
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">General Consultation Portal</h1>
              <p className="text-gray-600 mt-2">
                {profile?.full_name ? (
                  <>
                    Welcome back, <span className="font-semibold text-gray-800">{profile.full_name}</span>. Explore
                    ways to join MedConsult Liberia.
                  </>
                ) : (
                  <>Welcome! Explore opportunities to join our team.</>
                )}
              </p>
            </div>
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg shadow-lg shrink-0">
              <p className="text-sm opacity-90">Status</p>
              <p className="text-xl font-bold">Prospective Member</p>
            </div>
          </div>
          <p className="mt-3 text-sm text-gray-500">
            <Link href="/" className="text-blue-700 hover:underline">
              Back to site home
            </Link>
          </p>
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
                Thank you for your interest in joining our team. This portal highlights consultation opportunities,
                team benefits, and how to apply—whether you want a <strong>research / consultant</strong> role or{' '}
                <strong>field / census data collection</strong>.
              </p>
              <div className="flex flex-wrap gap-3 sm:gap-4">
                <button 
                  onClick={() => router.push('/apply-team')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold shadow-md"
                >
                  Apply to Join Team
                </button>
                <button 
                  onClick={() => router.push('/apply-census')}
                  className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-semibold shadow-md inline-flex items-center gap-2"
                >
                  <MapPin size={18} />
                  Apply as Field / Census
                </button>
                <button 
                  onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
                  className="px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-semibold"
                >
                  Learn More
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-4">
                Already applied? Check status:{' '}
                <Link href="/apply-team/status" className="text-blue-700 font-semibold hover:underline">
                  team application
                </Link>{' '}
                ·{' '}
                <Link href="/apply-census/status" className="text-teal-700 font-semibold hover:underline">
                  field / census
                </Link>
                .
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <p className="text-xs text-gray-500 mb-2 text-center md:text-left">Figures below are illustrative, not live counts.</p>
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

        {/* Application Process — two paths */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Application paths</h2>
          <p className="text-gray-600 text-sm mb-8">
            Choose the path that matches your interest. Each has its own form and status page.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
            <div className="rounded-xl border-2 border-blue-100 bg-blue-50/50 p-6">
              <div className="flex items-center gap-2 mb-4">
                <ClipboardList className="text-blue-600" size={22} />
                <h3 className="text-lg font-bold text-gray-900">Consultants & researchers</h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                For clinicians, researchers, and specialists who want to consult or publish research with us. Resume
                upload optional.
              </p>
              <ol className="space-y-3 text-sm text-gray-700 list-decimal list-inside">
                <li>Submit the team application with your qualifications.</li>
                <li>We review (often within a few business days).</li>
                <li>If selected, we may invite you for follow-up; then onboarding.</li>
              </ol>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => router.push('/apply-team')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
                >
                  Apply — team
                </button>
                <Link
                  href="/apply-team/status"
                  className="px-4 py-2 border border-blue-600 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-50 inline-flex items-center"
                >
                  Status
                </Link>
              </div>
            </div>

            <div className="rounded-xl border-2 border-teal-100 bg-teal-50/50 p-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="text-teal-700" size={22} />
                <h3 className="text-lg font-bold text-gray-900">Field / census data collectors</h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                For people who want to collect surveys and field data in assigned areas. Approved applicants receive a{' '}
                <strong>census field</strong> account for the field dashboard.
              </p>
              <ol className="space-y-3 text-sm text-gray-700 list-decimal list-inside">
                <li>Submit the field application (region, experience, motivation).</li>
                <li>Management reviews your fit for current projects.</li>
                <li>If approved, you get login instructions by email.</li>
              </ol>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => router.push('/apply-census')}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700"
                >
                  Apply — field / census
                </button>
                <Link
                  href="/apply-census/status"
                  className="px-4 py-2 border border-teal-600 text-teal-800 rounded-lg text-sm font-semibold hover:bg-teal-50 inline-flex items-center"
                >
                  Status
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
