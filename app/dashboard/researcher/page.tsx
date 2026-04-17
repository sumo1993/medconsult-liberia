'use client';

import { useEffect, useEffectEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, MessageSquare, Bell, Database, MapPin,
  ClipboardList, Users, Upload, Download,
  CheckCircle, Clock, TrendingUp, Folder, Globe,
  Activity, ChevronRight, Eye, Send, FileSpreadsheet,
  PieChart
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import NotificationBadge from '@/components/NotificationBadge';
import ProfileAvatar from '@/components/ProfileAvatar';
import OnlineStatusIndicator from '@/components/OnlineStatusIndicator';
import { useSessionValidation } from '@/hooks/useSessionValidation';
import { useAccountStatus } from '@/hooks/useAccountStatus';
import { useRoleRedirect } from '@/hooks/useRoleRedirect';
import PostLoginNotificationGate from '@/components/PostLoginNotificationGate';

interface ResearchProject {
  id: number;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'pending';
  location: string;
  deadline: string;
  data_collected: number;
  target_samples: number;
}

interface DataSubmission {
  id: number;
  project_title: string;
  submitted_at: string;
  status: 'pending' | 'approved' | 'rejected';
  data_points: number;
}

export default function ResearcherDashboard() {
  const router = useRouter();
  const { isAuthorized, isLoading: roleLoading } = useRoleRedirect('researcher');
  const { counts, loading: notifLoading } = useNotifications('researcher');
  
  const [stats, setStats] = useState({
    activeProjects: 0,
    dataSubmissions: 0,
    pendingReview: 0,
    completedProjects: 0,
    totalDataPoints: 0,
    thisMonthSubmissions: 0,
  });

  const [profile, setProfile] = useState<{
    full_name: string;
    role?: string;
    specialization?: string;
  } | null>(null);

  const [activeProjects, setActiveProjects] = useState<ResearchProject[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<DataSubmission[]>([]);

  const totalNotifications = counts.assignments + counts.researchPosts + counts.donationInquiries + counts.directMessagesUnread;

  useSessionValidation();
  useAccountStatus();

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      if (!token) return;
      const response = await fetch('/api/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setProfile({
          full_name: data.full_name || 'Researcher',
          role: data.role || 'researcher',
          specialization: data.specialization || '',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      if (!token) return;
      const response = await fetch('/api/researcher/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchActiveProjects = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      if (!token) return;
      const response = await fetch('/api/researcher/projects', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setActiveProjects(data);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchRecentSubmissions = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      if (!token) return;
      const response = await fetch('/api/researcher/submissions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setRecentSubmissions(data);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
  };

  const fetchAllData = useEffectEvent(async () => {
    await Promise.all([
      fetchProfile(),
      fetchStats(),
      fetchActiveProjects(),
      fetchRecentSubmissions(),
    ]);
  });

  useEffect(() => {
    if (!isAuthorized) return;
    fetchAllData();
    const interval = setInterval(fetchAllData, 30000);
    return () => clearInterval(interval);
  }, [isAuthorized]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    localStorage.removeItem('auth-token');
    router.push('/login');
  };

  const quickActions = [
    {
      title: 'Submit Data',
      description: 'Upload research data',
      icon: Upload,
      href: '/dashboard/researcher/submit-data',
      color: 'bg-emerald-500',
    },
    {
      title: 'My Projects',
      description: 'View research projects',
      icon: Folder,
      href: '/dashboard/researcher/projects',
      color: 'bg-blue-500',
    },
    {
      title: 'Data Collection',
      description: 'Enter field data with GPS',
      icon: ClipboardList,
      href: '/dashboard/researcher/data-entry',
      color: 'bg-purple-500',
    },
    {
      title: 'Analytics',
      description: 'Charts & progress',
      icon: PieChart,
      href: '/dashboard/researcher/analytics',
      color: 'bg-pink-500',
    },
    {
      title: 'My Submissions',
      description: 'View submissions',
      icon: Send,
      href: '/dashboard/researcher/submissions',
      color: 'bg-amber-500',
    },
    {
      title: 'My Entries',
      description: 'View data entries',
      icon: Eye,
      href: '/dashboard/researcher/my-entries',
      color: 'bg-cyan-500',
    },
    {
      title: 'Export Data',
      description: 'Download CSV/Excel',
      icon: Download,
      href: '/dashboard/researcher/export',
      color: 'bg-rose-500',
    },
    {
      title: 'Notifications',
      description: 'Alerts & reminders',
      icon: Bell,
      href: '/dashboard/researcher/notifications',
      color: 'bg-yellow-500',
    },
    {
      title: 'Reports',
      description: 'Research reports',
      icon: FileSpreadsheet,
      href: '/dashboard/researcher/reports',
      color: 'bg-orange-500',
    },
    {
      title: 'Field Reports',
      description: 'Census worker submissions',
      icon: Globe,
      href: '/dashboard/researcher/census-reports',
      color: 'bg-lime-600',
    },
    {
      title: 'Messages',
      description: 'Team communication',
      icon: MessageSquare,
      href: '/dashboard/researcher/messages',
      color: 'bg-indigo-500',
    },
    {
      title: 'Resources',
      description: 'Guidelines & templates',
      icon: FileText,
      href: '/dashboard/researcher/resources',
      color: 'bg-teal-500',
    },
    {
      title: 'Profile',
      description: 'Your profile',
      icon: Users,
      href: '/dashboard/researcher/profile',
      color: 'bg-gray-500',
    },
  ];

  // Show loading while checking role
  if (roleLoading || !isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50">
      <PostLoginNotificationGate role="researcher" loading={notifLoading} counts={counts} />

      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Research Portal</h1>
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
                  Researcher
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">
                Data Collection & Field Research
              </p>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => {
                  router.push('/dashboard/researcher/notifications');
                }}
                className="relative p-2 hover:bg-gray-100 rounded-lg"
                title="View notifications"
                aria-label="View notifications"
              >
                <Bell className="text-gray-600" size={20} />
                {totalNotifications > 0 && (
                  <NotificationBadge 
                    count={totalNotifications} 
                    className="absolute -top-1 -right-1"
                  />
                )}
              </button>
              <ProfileAvatar 
                onClick={() => router.push('/dashboard/researcher/profile')}
                className="w-8 h-8 sm:w-10 sm:h-10"
              />
              <button
                onClick={handleLogout}
                className="hidden sm:block px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20 sm:pb-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 mb-6 text-white">
          <h2 className="text-2xl font-bold mb-2">
            Welcome back, {profile?.full_name || 'Researcher'}! 👋
          </h2>
          <p className="text-emerald-100">
            You&apos;re contributing to important research in Liberia. Keep up the great work!
          </p>
          {profile?.specialization && (
            <p className="text-sm mt-2 text-emerald-200">
              Specialization: {profile.specialization}
            </p>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Folder className="text-blue-500" size={20} />
              <span className="text-xs text-gray-500">Active Projects</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.activeProjects}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Database className="text-emerald-500" size={20} />
              <span className="text-xs text-gray-500">Data Points</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalDataPoints}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Upload className="text-purple-500" size={20} />
              <span className="text-xs text-gray-500">Submissions</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.dataSubmissions}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="text-orange-500" size={20} />
              <span className="text-xs text-gray-500">Pending Review</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.pendingReview}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="text-green-500" size={20} />
              <span className="text-xs text-gray-500">Completed</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.completedProjects}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="text-teal-500" size={20} />
              <span className="text-xs text-gray-500">This Month</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.thisMonthSubmissions}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 mb-8">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => router.push(action.href)}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-emerald-200 transition-all text-left group"
            >
              <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <action.icon className="text-white" size={20} />
              </div>
              <h4 className="font-semibold text-gray-900 text-sm">{action.title}</h4>
              <p className="text-xs text-gray-500 mt-1">{action.description}</p>
            </button>
          ))}
        </div>

        {/* Active Projects */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Projects Section */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Globe className="text-emerald-600" size={20} />
                Active Research Projects
              </h3>
              <button 
                onClick={() => router.push('/dashboard/researcher/projects')}
                className="text-emerald-600 hover:text-emerald-700 text-sm flex items-center gap-1"
              >
                View All <ChevronRight size={16} />
              </button>
            </div>
            
            {activeProjects.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Folder className="mx-auto mb-2 text-gray-300" size={40} />
                <p>No active projects assigned yet</p>
                <p className="text-sm mt-1">Projects will appear here when assigned</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeProjects.slice(0, 3).map((project) => {
                  const progressPercent =
                    project.target_samples > 0
                      ? Math.min(100, Math.max(0, (project.data_collected / project.target_samples) * 100))
                      : 0;
                  return (
                  <div 
                    key={project.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-emerald-300 transition-colors cursor-pointer"
                    onClick={() => router.push(`/dashboard/researcher/projects/${project.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{project.title}</h4>
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <MapPin size={14} /> {project.location}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        project.status === 'active' ? 'bg-green-100 text-green-800' :
                        project.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {project.status}
                      </span>
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Data Collected</span>
                        <span>{project.data_collected} / {project.target_samples}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-emerald-500 h-2 rounded-full transition-all"
                          style={{ width: `${progressPercent}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Submissions */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Activity className="text-purple-600" size={20} />
                Recent Submissions
              </h3>
              <button 
                onClick={() => router.push('/dashboard/researcher/submissions')}
                className="text-emerald-600 hover:text-emerald-700 text-sm flex items-center gap-1"
              >
                View All <ChevronRight size={16} />
              </button>
            </div>
            
            {recentSubmissions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Upload className="mx-auto mb-2 text-gray-300" size={40} />
                <p>No submissions yet</p>
                <p className="text-sm mt-1">Your data submissions will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentSubmissions.slice(0, 5).map((submission) => (
                  <div 
                    key={submission.id}
                    className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{submission.project_title}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(submission.submitted_at).toLocaleDateString()} • {submission.data_points} data points
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      submission.status === 'approved' ? 'bg-green-100 text-green-800' :
                      submission.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {submission.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Online Status Indicator */}
      <OnlineStatusIndicator />

    </div>
  );
}
