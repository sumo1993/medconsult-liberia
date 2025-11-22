'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, MessageSquare, Calendar, BookOpen, Users, Bell, Info, DollarSign, Star } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import NotificationBadge from '@/components/NotificationBadge';
import ProfileAvatar from '@/components/ProfileAvatar';
import { useSessionValidation } from '@/hooks/useSessionValidation';
import { useAccountStatus } from '@/hooks/useAccountStatus';

export default function ManagementDashboard() {
  const router = useRouter();
  const { counts, refresh } = useNotifications('management');
  const [stats, setStats] = useState({
    totalMessages: 0,
    pendingAppointments: 0,
    totalResearch: 0,
    pendingAssignments: 0,
  });
  const [ratingStats, setRatingStats] = useState({
    averageRating: 0,
    totalRatings: 0,
  });
  const [profile, setProfile] = useState<{
    full_name: string;
    date_of_birth: string | null;
  } | null>(null);

  // Calculate total notifications
  const totalNotifications = counts.messages + counts.appointments + counts.assignments + counts.donationInquiries;

  // Validate session continuously
  useSessionValidation();
  
  // Check account status (will auto-logout if suspended)
  useAccountStatus();

  useEffect(() => {
    fetchStats();
    fetchProfile();
    fetchRatingStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(() => {
      fetchStats();
      fetchRatingStats();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch('/api/profile', { headers });
      if (response.ok) {
        const data = await response.json();
        setProfile({
          full_name: data.full_name || 'Doctor',
          date_of_birth: data.date_of_birth || null,
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // Fetch assignments
      const assignmentsRes = await fetch('/api/management/assignments', { headers });
      if (assignmentsRes.ok) {
        const assignmentsData = await assignmentsRes.json();
        const pending = assignmentsData.assignments.filter((a: any) => a.status === 'pending').length;
        setStats(prev => ({ ...prev, pendingAssignments: pending }));
      }

      // Fetch appointments
      const appointmentsRes = await fetch('/api/appointments', { headers });
      if (appointmentsRes.ok) {
        const appointmentsData = await appointmentsRes.json();
        const pending = appointmentsData.appointments.filter((a: any) => a.status === 'pending').length;
        setStats(prev => ({ ...prev, pendingAppointments: pending }));
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchRatingStats = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch('/api/profile', { headers });
      if (response.ok) {
        const data = await response.json();
        console.log('Profile data for ratings:', {
          average_rating: data.average_rating,
          total_ratings: data.total_ratings
        });
        setRatingStats({
          averageRating: parseFloat(data.average_rating || 0),
          totalRatings: parseInt(data.total_ratings || 0),
        });
      } else {
        console.error('Failed to fetch profile for ratings:', response.status);
      }
    } catch (error) {
      console.error('Error fetching rating stats:', error);
    }
  };

  const calculateAge = (dateOfBirth: string | null): number | null => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const menuItems = [
    {
      title: 'Contact Messages',
      description: 'View and respond to contact form submissions',
      icon: MessageSquare,
      color: 'bg-blue-500',
      link: '/dashboard/management/messages',
      badge: counts.messages,
    },
    {
      title: 'Appointments',
      description: 'Manage appointment requests',
      icon: Calendar,
      color: 'bg-green-500',
      link: '/dashboard/management/appointments',
      badge: counts.appointments,
    },
    {
      title: 'Research Posts',
      description: 'Create and manage research articles',
      icon: FileText,
      color: 'bg-purple-500',
      link: '/dashboard/management/research',
      badge: counts.researchPosts,
    },
    {
      title: 'Assignment Requests',
      description: 'Review, price, negotiate & verify payments',
      icon: DollarSign,
      color: 'bg-emerald-500',
      link: '/dashboard/management/assignment-requests',
      badge: counts.unreadAssignmentMessages,
    },
    {
      title: 'Study Materials',
      description: 'Upload and organize study materials',
      icon: Users,
      color: 'bg-pink-500',
      link: '/dashboard/management/materials',
      badge: 0,
    },
    {
      title: 'Donation Inquiries',
      description: 'View and manage donation requests',
      icon: DollarSign,
      color: 'bg-yellow-500',
      link: '/dashboard/management/donation-inquiries',
      badge: counts.donationInquiries,
    },
    {
      title: 'About Me',
      description: 'Edit your public "About Dr." section',
      icon: Info,
      color: 'bg-cyan-500',
      link: '/dashboard/management/about-me',
      badge: 0,
    },
    {
      title: 'My Profile',
      description: 'Update your professional profile',
      icon: Users,
      color: 'bg-gray-500',
      link: '/dashboard/management/profile',
      badge: 0,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Management Dashboard</h1>
              <p className="text-sm text-gray-600">Consultant Portal</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Bell className="text-gray-600 hover:text-gray-900 cursor-pointer" size={24} />
                {totalNotifications > 0 && (
                  <NotificationBadge 
                    count={totalNotifications} 
                    className="absolute -top-2 -right-2"
                  />
                )}
              </div>
              <button
                onClick={() => router.push('/')}
                className="text-gray-600 hover:text-gray-900"
              >
                Home
              </button>
              <div className="flex items-center space-x-3">
                <ProfileAvatar 
                  onClick={() => router.push('/dashboard/management/profile')}
                />
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Message */}
        <div className="bg-emerald-700 text-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-2xl font-bold mb-2">
            Welcome, {profile?.full_name || 'Consultant'}!
            {profile?.date_of_birth && calculateAge(profile.date_of_birth) && (
              <span className="ml-3 text-lg font-normal text-emerald-100">
                ({calculateAge(profile.date_of_birth)} years old)
              </span>
            )}
          </h2>
          <p className="text-emerald-100">
            Manage your research, review assignments, and communicate with clients from this dashboard.
          </p>
        </div>

        {/* Rating Stats Card */}
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center space-x-2">
                <Star className="fill-white" size={24} />
                <span>Your Rating</span>
              </h3>
              <div className="flex items-center space-x-4">
                <div>
                  <div className="text-4xl font-bold">
                    {ratingStats.averageRating > 0 ? ratingStats.averageRating.toFixed(1) : 'N/A'}
                  </div>
                  <div className="text-sm text-yellow-100">Average Rating</div>
                </div>
                <div className="border-l border-yellow-200 pl-4">
                  <div className="text-3xl font-bold">{ratingStats.totalRatings}</div>
                  <div className="text-sm text-yellow-100">
                    {ratingStats.totalRatings === 1 ? 'Review' : 'Reviews'}
                  </div>
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={32}
                    className={
                      star <= Math.round(ratingStats.averageRating)
                        ? 'fill-white text-white'
                        : 'fill-yellow-200 text-yellow-200'
                    }
                  />
                ))}
              </div>
              <p className="text-sm text-yellow-100 mt-2 text-center">
                {ratingStats.averageRating >= 4.5 && '⭐ Excellent!'}
                {ratingStats.averageRating >= 4.0 && ratingStats.averageRating < 4.5 && '👍 Very Good!'}
                {ratingStats.averageRating >= 3.5 && ratingStats.averageRating < 4.0 && '✓ Good'}
                {ratingStats.averageRating >= 3.0 && ratingStats.averageRating < 3.5 && 'Fair'}
                {ratingStats.averageRating > 0 && ratingStats.averageRating < 3.0 && 'Keep improving'}
                {ratingStats.averageRating === 0 && 'No ratings yet'}
              </p>
            </div>
          </div>
          {ratingStats.totalRatings > 0 && (
            <button
              onClick={() => router.push('/dashboard/management/ratings')}
              className="mt-4 px-4 py-2 bg-white text-orange-600 rounded-lg hover:bg-yellow-50 transition-colors font-semibold text-sm"
            >
              View All Reviews
            </button>
          )}
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item, index) => (
            <div
              key={index}
              onClick={() => router.push(item.link)}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer relative"
            >
              {/* Notification Badge */}
              {item.badge > 0 && (
                <div className="absolute top-4 right-4">
                  <NotificationBadge count={item.badge} className="text-base px-3 py-1" />
                </div>
              )}
              
              <div className={`${item.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                <item.icon className="text-white" size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-600">{item.description}</p>
              
              {/* Badge Text */}
              {item.badge > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-sm font-semibold text-red-600">
                    {item.badge} pending request{item.badge > 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
          <div className="text-gray-600 text-center py-8">
            <p>No recent activity</p>
          </div>
        </div>
      </main>
    </div>
  );
}
