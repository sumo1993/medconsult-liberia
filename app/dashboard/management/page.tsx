'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, MessageSquare, MessageCircle, Calendar, BookOpen, Users, Bell, Info, DollarSign, Star,
  TrendingUp, Clock, CheckCircle, Target, Activity,
  Wallet, ArrowUp, ArrowDown, ChevronRight, Eye, EyeOff, LogOut, UserPlus, MapPin
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import NotificationBadge from '@/components/NotificationBadge';
import ProfileAvatar from '@/components/ProfileAvatar';
import { useSessionValidation } from '@/hooks/useSessionValidation';
import { useAccountStatus } from '@/hooks/useAccountStatus';
import { useRoleRedirect } from '@/hooks/useRoleRedirect';
import CensusReportsAccessPanel from '@/components/CensusReportsAccessPanel';

export default function ManagementDashboardEnhanced() {
  const router = useRouter();
  const { isAuthorized, isLoading: roleLoading } = useRoleRedirect('management');
  const { counts, rawCounts, refresh, markCategorySeen } = useNotifications('management');
  
  const [stats, setStats] = useState({
    totalAssignments: 0,
    pendingAssignments: 0,
    inProgressAssignments: 0,
    completedThisMonth: 0,
    totalEarnings: 0,
    pendingPayments: 0,
    averageResponseTime: 0,
    completionRate: 0,
    activeClients: 0,
  });

  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [earnings, setEarnings] = useState({
    thisMonth: 0,
    lastMonth: 0,
    total: 0,
    pending: 0,
  });
  const [myEarnings, setMyEarnings] = useState<any>(null);
  const [showMyEarnings, setShowMyEarnings] = useState(true);
  const [showEarningsOverview, setShowEarningsOverview] = useState(true);

  const [ratingStats, setRatingStats] = useState({
    averageRating: 0,
    totalRatings: 0,
  });

  const [profile, setProfile] = useState<{
    full_name: string;
    date_of_birth: string | null;
    role?: string;
  } | null>(null);

  const [selectedTab, setSelectedTab] = useState('overview');
  const [notificationFilter, setNotificationFilter] = useState('all');

  const totalNotifications =
    counts.unreadAssignmentMessages +
    counts.appointments +
    counts.messages +
    counts.donationInquiries +
    counts.assignments +
    counts.researchPosts +
    counts.teamApplications +
    counts.censusFieldApplications +
    counts.directMessagesUnread +
    counts.pendingResearchPapers;

  const assignmentRequestsBadge =
    counts.assignments + counts.unreadAssignmentMessages;

  // Build notification items from rawCounts so they always appear in the panel,
  // and mark each as "read" if the seen-subtracted count is 0.
  const managementNotifications = [
    rawCounts.unreadAssignmentMessages > 0
      ? {
          id: 'unread-assignment-messages',
          title: 'Assignment Messages Need Attention',
          message: `You have ${rawCounts.unreadAssignmentMessages} assignment conversation${rawCounts.unreadAssignmentMessages > 1 ? 's' : ''} with unread messages.`,
          link: '/dashboard/management/assignment-requests',
          is_read: counts.unreadAssignmentMessages === 0,
          created_at: new Date().toISOString(),
        }
      : null,
    rawCounts.appointments > 0
      ? {
          id: 'pending-appointments',
          title: 'Pending Appointments',
          message: `${rawCounts.appointments} appointment request${rawCounts.appointments > 1 ? 's' : ''} waiting for review.`,
          link: '/dashboard/management/appointments',
          is_read: counts.appointments === 0,
          created_at: new Date().toISOString(),
        }
      : null,
    rawCounts.messages > 0
      ? {
          id: 'contact-messages',
          title: 'Contact Messages',
          message: `${rawCounts.messages} contact message${rawCounts.messages > 1 ? 's' : ''} waiting for response.`,
          link: '/dashboard/management/messages',
          is_read: counts.messages === 0,
          created_at: new Date().toISOString(),
        }
      : null,
    rawCounts.donationInquiries > 0
      ? {
          id: 'donation-inquiries',
          title: 'Donation Inquiries',
          message: `${rawCounts.donationInquiries} donation inquir${rawCounts.donationInquiries > 1 ? 'ies are' : 'y is'} waiting for follow-up.`,
          link: '/dashboard/management/donation-inquiries',
          is_read: counts.donationInquiries === 0,
          created_at: new Date().toISOString(),
        }
      : null,
    rawCounts.assignments > 0
      ? {
          id: 'pending-assignments',
          title: 'Pending Assignment Requests',
          message: `${rawCounts.assignments} assignment request${rawCounts.assignments > 1 ? 's' : ''} pending review.`,
          link: '/dashboard/management/assignment-requests',
          is_read: counts.assignments === 0,
          created_at: new Date().toISOString(),
        }
      : null,
    rawCounts.researchPosts > 0
      ? {
          id: 'draft-research',
          title: 'Draft Research Posts',
          message: `${rawCounts.researchPosts} research post${rawCounts.researchPosts > 1 ? 's are' : ' is'} still in draft.`,
          link: '/dashboard/management/research',
          is_read: counts.researchPosts === 0,
          created_at: new Date().toISOString(),
        }
      : null,
    rawCounts.pendingResearchPapers > 0
      ? {
          id: 'pending-research-approvals',
          title: 'Research papers pending approval',
          message: `${rawCounts.pendingResearchPapers} research submission${rawCounts.pendingResearchPapers > 1 ? 's' : ''} need review.`,
          link: '/dashboard/management/research-approvals',
          is_read: counts.pendingResearchPapers === 0,
          created_at: new Date().toISOString(),
        }
      : null,
    rawCounts.teamApplications > 0
      ? {
          id: 'team-applications',
          title: 'Team applications',
          message: `${rawCounts.teamApplications} join-the-team application${rawCounts.teamApplications > 1 ? 's' : ''} need review.`,
          link: '/dashboard/management/team-applications',
          is_read: counts.teamApplications === 0,
          created_at: new Date().toISOString(),
        }
      : null,
    rawCounts.censusFieldApplications > 0
      ? {
          id: 'census-field-applications',
          title: 'Census / field applications',
          message: `${rawCounts.censusFieldApplications} field data application${rawCounts.censusFieldApplications > 1 ? 's' : ''} need review.`,
          link: '/dashboard/management/census-field-applications',
          is_read: counts.censusFieldApplications === 0,
          created_at: new Date().toISOString(),
        }
      : null,
    rawCounts.directMessagesUnread > 0
      ? {
          id: 'direct-messages-unread',
          title: 'Direct messages',
          message: `${rawCounts.directMessagesUnread} unread direct message${rawCounts.directMessagesUnread > 1 ? 's' : ''}.`,
          link: '/dashboard/management/direct-messages',
          is_read: counts.directMessagesUnread === 0,
          created_at: new Date().toISOString(),
        }
      : null,
  ].filter(Boolean) as Array<{
    id: string;
    title: string;
    message: string;
    link: string;
    is_read: boolean;
    created_at: string;
  }>;

  useSessionValidation();
  useAccountStatus();

  const fetchSlowData = async () => {
    await Promise.all([
      fetchProfile(),
      fetchClients(),
      fetchEarnings(),
      fetchMyEarnings(),
    ]);
  };

  const fetchFastData = async () => {
    await Promise.all([
      fetchStats(),
      fetchRecentActivity(),
      fetchUpcomingDeadlines(),
    ]);
  };

  useEffect(() => {
    if (!isAuthorized) return;

    fetchSlowData();
    fetchFastData();

    let intervalId: ReturnType<typeof setInterval> | null = null;

    const startPolling = () => {
      if (!intervalId) {
        intervalId = setInterval(fetchFastData, 60000);
      }
    };

    const stopPolling = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const handleVisibility = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        fetchFastData();
        startPolling();
      }
    };

    startPolling();
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isAuthorized]);

  const fetchMyEarnings = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/my-earnings', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setMyEarnings(data);
      } else if (response.status === 401 || response.status === 403) {
        setMyEarnings(null);
      }
    } catch (error) {
      console.error('Error fetching my earnings:', error);
    }
  };

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/profile', {
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      if (response.ok) {
        const data = await response.json();
        setProfile({
          full_name: data.full_name || 'CEO',
          date_of_birth: data.date_of_birth || null,
          role: data.role || 'management',
        });
        setRatingStats({
          averageRating: parseFloat(data.average_rating || 0),
          totalRatings: parseInt(data.total_ratings || 0),
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/management/dashboard-stats', {
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/management/recent-activity', {
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      if (response.ok) {
        const data = await response.json();
        // Map icon strings to actual components
        const iconMap: any = {
          'FileText': FileText,
          'DollarSign': DollarSign,
          'CheckCircle': CheckCircle,
          'MessageSquare': MessageSquare,
          'Bell': Bell,
        };
        const activitiesWithIcons = data.map((activity: any) => ({
          ...activity,
          icon: iconMap[activity.icon] || Activity,
        }));
        setRecentActivity(activitiesWithIcons);
      }
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };

  const fetchUpcomingDeadlines = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/management/upcoming-deadlines', {
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      if (response.ok) {
        const data = await response.json();
        setUpcomingDeadlines(data);
      }
    } catch (error) {
      console.error('Error fetching deadlines:', error);
    }
  };

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/management/clients', {
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      if (response.ok) {
        const data = await response.json();
        setClients(data);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchEarnings = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/management/earnings', {
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      if (response.ok) {
        const data = await response.json();
        setEarnings(data);
      }
    } catch (error) {
      console.error('Error fetching earnings:', error);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeUntilDeadline = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diff = deadlineDate.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    return 'Overdue';
  };

  // Show loading while checking role
  if (roleLoading || !isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-Optimized Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Dashboard</h1>
                {profile?.role && (
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {profile.role === 'management' ? 'CEO' : profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">
                {profile?.role === 'management' ? 'Management Portal' : 
                 profile?.role === 'consultant' ? 'Consultant Portal' :
                 profile?.role === 'researcher' ? 'Researcher Portal' :
                 profile?.role === 'admin' ? 'Admin Portal' :
                 profile?.role === 'accountant' ? 'Accountant Portal' :
                 `${profile?.role?.charAt(0).toUpperCase()}${profile?.role?.slice(1) || ''} Portal`}
              </p>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => {
                  setSelectedTab('notifications');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="relative p-2 hover:bg-gray-100 rounded-lg"
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
                onClick={() => router.push('/dashboard/management/profile')}
                className="w-8 h-8 sm:w-10 sm:h-10"
              />
              <button
                onClick={handleLogout}
                className="sm:hidden p-2 hover:bg-red-50 rounded-lg"
                title="Logout"
              >
                <LogOut className="text-red-600" size={20} />
              </button>
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 pb-20 sm:pb-8">
        {selectedTab === 'notifications' && (
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-4 sm:mb-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">Notifications</h3>
                <p className="text-sm text-gray-600">
                  {managementNotifications.length > 0 ? `${managementNotifications.length} item(s)` : 'No notifications'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setNotificationFilter('all')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium ${notificationFilter === 'all' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  All
                </button>
                <button
                  onClick={() => setNotificationFilter('unread')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium ${notificationFilter === 'unread' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  Unread
                </button>
                <button
                  onClick={() => {
                    markCategorySeen('unreadAssignmentMessages');
                    markCategorySeen('appointments');
                    markCategorySeen('messages');
                    markCategorySeen('donationInquiries');
                    markCategorySeen('assignments');
                    markCategorySeen('researchPosts');
                    markCategorySeen('teamApplications');
                    markCategorySeen('censusFieldApplications');
                    markCategorySeen('directMessagesUnread');
                    markCategorySeen('pendingResearchPapers');
                  }}
                  className="px-3 py-1 rounded-lg text-sm font-medium bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                >
                  Mark all read
                </button>
                <button
                  onClick={() => setSelectedTab('overview')}
                  className="px-3 py-1 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>

            {managementNotifications.filter((n) => notificationFilter === 'all' || !n.is_read).length === 0 ? (
              <div className="text-center py-8 text-gray-500">No notifications to show.</div>
            ) : (
              <div className="space-y-3">
                {managementNotifications
                  .filter((n) => notificationFilter === 'all' || !n.is_read)
                  .map((n) => (
                    <button
                      key={`${n.id}-${n.created_at}`}
                      onClick={() => {
                        if (n.id === 'unread-assignment-messages') markCategorySeen('unreadAssignmentMessages');
                        if (n.id === 'pending-appointments') markCategorySeen('appointments');
                        if (n.id === 'contact-messages') markCategorySeen('messages');
                        if (n.id === 'donation-inquiries') markCategorySeen('donationInquiries');
                        if (n.id === 'pending-assignments') markCategorySeen('assignments');
                        if (n.id === 'draft-research') markCategorySeen('researchPosts');
                        if (n.id === 'pending-research-approvals') markCategorySeen('pendingResearchPapers');
                        if (n.id === 'team-applications') markCategorySeen('teamApplications');
                        if (n.id === 'census-field-applications') markCategorySeen('censusFieldApplications');
                        if (n.id === 'direct-messages-unread') markCategorySeen('directMessagesUnread');
                        router.push(n.link);
                      }}
                      className={`w-full text-left rounded-lg p-4 border transition-colors ${
                        n.is_read
                          ? 'bg-white border-gray-100 opacity-70 hover:opacity-100'
                          : 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {!n.is_read && <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />}
                        <p className={`font-semibold ${n.is_read ? 'text-gray-500' : 'text-gray-900'}`}>{n.title}</p>
                      </div>
                      <p className={`text-sm mt-1 ${n.is_read ? 'text-gray-400' : 'text-gray-600'}`}>{n.message}</p>
                    </button>
                  ))}
              </div>
            )}
          </div>
        )}

        <CensusReportsAccessPanel role="management" />

        {/* My Earnings Card */}
        {myEarnings && (
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">My Total Earnings (CEO)</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowMyEarnings(!showMyEarnings)}
                  className="p-2 hover:bg-emerald-100 rounded-lg transition-colors"
                  title={showMyEarnings ? "Hide earnings" : "Show earnings"}
                >
                  {showMyEarnings ? <Eye className="text-emerald-600" size={24} /> : <EyeOff className="text-gray-400" size={24} />}
                </button>
                <DollarSign className="text-emerald-600" size={32} />
              </div>
            </div>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 shadow">
                <p className="text-sm text-gray-600 mb-1">Consultant Earnings</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {showMyEarnings ? `$${myEarnings.breakdown?.consultantEarnings?.toFixed(2) || '0.00'}` : '••••••'}
                </p>
                <p className="text-xs text-gray-500 mt-1">75% from assignments</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow">
                <p className="text-sm text-gray-600 mb-1">Team Share</p>
                <p className="text-2xl font-bold text-blue-600">
                  {showMyEarnings ? `$${myEarnings.breakdown?.teamShareEarned?.toFixed(2) || '0.00'}` : '••••••'}
                </p>
                <p className="text-xs text-gray-500 mt-1">40% of team share</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow">
                <p className="text-sm text-gray-600 mb-1">Total Paid</p>
                <p className="text-2xl font-bold text-green-600">
                  {showMyEarnings ? `$${myEarnings.totalPaid?.toFixed(2) || '0.00'}` : '••••••'}
                </p>
                {myEarnings.lastPaymentDate && (
                  <p className="text-xs text-gray-500 mt-1">Last: {new Date(myEarnings.lastPaymentDate).toLocaleDateString()}</p>
                )}
              </div>
              <div className="bg-white rounded-lg p-4 shadow">
                <p className="text-sm text-gray-600 mb-1">Unpaid Balance</p>
                <p className="text-2xl font-bold text-orange-600">
                  {showMyEarnings ? `$${myEarnings.unpaid?.toFixed(2) || '0.00'}` : '••••••'}
                </p>
                <div className="mt-2">
                  {myEarnings.paymentStatus === 'paid' && <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">✓ Paid</span>}
                  {myEarnings.paymentStatus === 'partial' && <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold">Partial</span>}
                  {myEarnings.paymentStatus === 'unpaid' && <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">Unpaid</span>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Welcome & Quick Stats */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold mb-2">
            Welcome back, {profile?.full_name || 'CEO'}! 👋
          </h2>
          <p className="text-emerald-100 text-sm sm:text-base mb-4">
            Here's your performance overview
          </p>
          
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white/10 backdrop-blur rounded-lg p-3">
              <div className="text-2xl sm:text-3xl font-bold">{stats.totalAssignments}</div>
              <div className="text-xs sm:text-sm text-emerald-100">Total Assignments</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-3">
              <div className="text-2xl sm:text-3xl font-bold">{stats.pendingAssignments}</div>
              <div className="text-xs sm:text-sm text-emerald-100">Pending</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-3">
              <div className="text-2xl sm:text-3xl font-bold">{stats.completionRate}%</div>
              <div className="text-xs sm:text-sm text-emerald-100">Completion Rate</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-3">
              <div className="text-2xl sm:text-3xl font-bold">{formatCurrency(earnings.thisMonth)}</div>
              <div className="text-xs sm:text-sm text-emerald-100">This Month</div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <Clock className="text-blue-600" size={24} />
              <TrendingUp className="text-green-500" size={16} />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.averageResponseTime}h</div>
            <div className="text-sm text-gray-600">Avg Response Time</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <Users className="text-purple-600" size={24} />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.activeClients}</div>
            <div className="text-sm text-gray-600">Active Clients</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <Star className="text-yellow-500 fill-yellow-500" size={24} />
              <span className="text-xs text-gray-600">{ratingStats.totalRatings} reviews</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {ratingStats.averageRating > 0 ? ratingStats.averageRating.toFixed(1) : 'N/A'}
            </div>
            <div className="text-sm text-gray-600">Rating</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="text-green-600" size={24} />
              <span className="text-xs text-green-600 font-semibold">This month</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.completedThisMonth}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
        </div>

        {/* Earnings & Payment Tracking */}
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
              <Wallet className="text-emerald-600" size={24} />
              Earnings Overview
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowEarningsOverview(!showEarningsOverview)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title={showEarningsOverview ? "Hide amounts" : "Show amounts"}
              >
                {showEarningsOverview ? <Eye className="text-emerald-600" size={20} /> : <EyeOff className="text-gray-400" size={20} />}
              </button>
              <button
                onClick={() => router.push('/dashboard/management/earnings')}
                className="text-emerald-600 hover:text-emerald-700 text-sm font-medium flex items-center gap-1"
              >
                View All <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="border border-gray-200 rounded-lg p-3 sm:p-4">
              <div className="text-xs sm:text-sm text-gray-600 mb-1">This Month</div>
              <div className="text-xl sm:text-2xl font-bold text-emerald-600">
                {showEarningsOverview ? formatCurrency(earnings.thisMonth) : '••••••'}
              </div>
              {showEarningsOverview && (() => {
                const pct = earnings.lastMonth > 0
                  ? ((earnings.thisMonth - earnings.lastMonth) / earnings.lastMonth) * 100
                  : earnings.thisMonth > 0 ? 100 : 0;
                const isUp = pct >= 0;
                return (
                  <div className={`text-xs flex items-center gap-1 mt-1 ${isUp ? 'text-green-600' : 'text-red-600'}`}>
                    {isUp ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                    <span>{Math.abs(pct).toFixed(0)}%</span>
                  </div>
                );
              })()}
            </div>

            <div className="border border-gray-200 rounded-lg p-3 sm:p-4">
              <div className="text-xs sm:text-sm text-gray-600 mb-1">Last Month</div>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">
                {showEarningsOverview ? formatCurrency(earnings.lastMonth) : '••••••'}
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-3 sm:p-4">
              <div className="text-xs sm:text-sm text-gray-600 mb-1">Pending</div>
              <div className="text-xl sm:text-2xl font-bold text-yellow-600">
                {showEarningsOverview ? formatCurrency(earnings.pending) : '••••••'}
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-3 sm:p-4">
              <div className="text-xs sm:text-sm text-gray-600 mb-1">Total Earned</div>
              <div className="text-xl sm:text-2xl font-bold text-blue-600">
                {showEarningsOverview ? formatCurrency(earnings.total) : '••••••'}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
          {/* Work Progress Tracker */}
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Target className="text-emerald-600" size={24} />
              In Progress Assignments
            </h3>

            {stats.inProgressAssignments > 0 ? (
              <div className="space-y-3">
                {upcomingDeadlines.slice(0, 3).map((assignment: any) => (
                  <div key={assignment.id} className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:border-emerald-500 transition-colors cursor-pointer"
                    onClick={() => router.push(`/dashboard/management/assignment-requests/${assignment.id}`)}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 text-sm sm:text-base">{assignment.title}</h4>
                        <p className="text-xs sm:text-sm text-gray-600">{assignment.client_name}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${
                        assignment.daysLeft > 2 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {getTimeUntilDeadline(assignment.deadline)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-emerald-600 h-2 rounded-full transition-all"
                        style={{ width: `${assignment.progress || 0}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">{assignment.progress || 0}% complete</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Target className="mx-auto mb-2 text-gray-300" size={40} />
                <p className="text-sm">No assignments in progress</p>
              </div>
            )}
          </div>

          {/* Calendar/Schedule View */}
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="text-emerald-600" size={24} />
              Upcoming Deadlines
            </h3>

            {upcomingDeadlines.length > 0 ? (
              <div className="space-y-2">
                {upcomingDeadlines.map((deadline: any) => (
                  <div key={deadline.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        deadline.urgent ? 'bg-red-500' : 'bg-green-500'
                      }`}></div>
                      <div>
                        <p className="font-semibold text-sm text-gray-900">{deadline.title}</p>
                        <p className="text-xs text-gray-600">{deadline.client_name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{formatDate(deadline.deadline)}</p>
                      <p className="text-xs text-gray-600">{getTimeUntilDeadline(deadline.deadline)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Calendar className="mx-auto mb-2 text-gray-300" size={40} />
                <p className="text-sm">No upcoming deadlines</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Access Menu - Original Menu Items */}
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="text-emerald-600" size={24} />
            Quick Access Menu
          </h3>
          
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {/* Contact Messages */}
            <div
              onClick={() => router.push('/dashboard/management/messages')}
              className="bg-white rounded-lg shadow border border-gray-200 p-3 sm:p-6 hover:shadow-lg hover:border-emerald-500 transition-all cursor-pointer relative focus:outline-none focus:ring-2 focus:ring-emerald-500"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && router.push('/dashboard/management/messages')}
            >
              {counts.messages > 0 && (
                <div className="absolute top-2 right-2 sm:top-4 sm:right-4">
                  <NotificationBadge count={counts.messages} className="text-xs sm:text-base px-2 sm:px-3 py-0.5 sm:py-1" />
                </div>
              )}
              <div className="bg-blue-500 w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-2 sm:mb-4">
                <MessageSquare className="text-white" size={20} />
              </div>
              <h3 className="text-sm sm:text-lg font-bold text-gray-900 mb-1 sm:mb-2">Contact Messages</h3>
              <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">View and respond to contact form submissions</p>
            </div>

            {/* Direct Messages */}
            <div
              onClick={() => router.push('/dashboard/management/direct-messages')}
              className="bg-white rounded-lg shadow border border-gray-200 p-3 sm:p-6 hover:shadow-lg hover:border-emerald-500 transition-all cursor-pointer relative focus:outline-none focus:ring-2 focus:ring-emerald-500"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && router.push('/dashboard/management/direct-messages')}
            >
              {counts.directMessagesUnread > 0 && (
                <div className="absolute top-2 right-2 sm:top-4 sm:right-4">
                  <NotificationBadge count={counts.directMessagesUnread} className="text-xs sm:text-base px-2 sm:px-3 py-0.5 sm:py-1" />
                </div>
              )}
              <div className="bg-violet-500 w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-2 sm:mb-4">
                <MessageCircle className="text-white" size={20} />
              </div>
              <h3 className="text-sm sm:text-lg font-bold text-gray-900 mb-1 sm:mb-2">Direct Messages</h3>
              <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Chat directly with consultants and admins</p>
            </div>

            {/* Appointments */}
            <div
              onClick={() => router.push('/dashboard/management/appointments')}
              className="bg-white rounded-lg shadow border border-gray-200 p-3 sm:p-6 hover:shadow-lg hover:border-emerald-500 transition-all cursor-pointer relative"
            >
              {counts.appointments > 0 && (
                <div className="absolute top-2 right-2 sm:top-4 sm:right-4">
                  <NotificationBadge count={counts.appointments} className="text-xs sm:text-base px-2 sm:px-3 py-0.5 sm:py-1" />
                </div>
              )}
              <div className="bg-green-500 w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-2 sm:mb-4">
                <Calendar className="text-white" size={20} />
              </div>
              <h3 className="text-sm sm:text-lg font-bold text-gray-900 mb-1 sm:mb-2">Appointments</h3>
              <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Manage appointment requests</p>
            </div>

            {/* Research Posts */}
            <div
              onClick={() => router.push('/dashboard/management/research')}
              className="bg-white rounded-lg shadow border border-gray-200 p-3 sm:p-6 hover:shadow-lg hover:border-emerald-500 transition-all cursor-pointer relative"
            >
              {counts.researchPosts > 0 && (
                <div className="absolute top-2 right-2 sm:top-4 sm:right-4">
                  <NotificationBadge count={counts.researchPosts} className="text-xs sm:text-base px-2 sm:px-3 py-0.5 sm:py-1" />
                </div>
              )}
              <div className="bg-purple-500 w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-2 sm:mb-4">
                <FileText className="text-white" size={20} />
              </div>
              <h3 className="text-sm sm:text-lg font-bold text-gray-900 mb-1 sm:mb-2">Research Posts</h3>
              <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Create and manage research articles</p>
            </div>

            {/* Research Approvals */}
            <div
              onClick={() => router.push('/dashboard/management/research-approvals')}
              className="bg-white rounded-lg shadow border border-gray-200 p-3 sm:p-6 hover:shadow-lg hover:border-emerald-500 transition-all cursor-pointer relative"
            >
              {counts.pendingResearchPapers > 0 && (
                <div className="absolute top-2 right-2 sm:top-4 sm:right-4">
                  <NotificationBadge count={counts.pendingResearchPapers} className="text-xs sm:text-base px-2 sm:px-3 py-0.5 sm:py-1" />
                </div>
              )}
              <div className="bg-orange-500 w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-2 sm:mb-4">
                <CheckCircle className="text-white" size={20} />
              </div>
              <h3 className="text-sm sm:text-lg font-bold text-gray-900 mb-1 sm:mb-2">Research Approvals</h3>
              <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Review and approve pending research papers</p>
            </div>

            {/* Researchers */}
            <div
              onClick={() => router.push('/dashboard/management/researchers')}
              className="bg-white rounded-lg shadow border border-gray-200 p-3 sm:p-6 hover:shadow-lg hover:border-emerald-500 transition-all cursor-pointer relative"
            >
              <div className="bg-indigo-500 w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-2 sm:mb-4">
                <Users className="text-white" size={20} />
              </div>
              <h3 className="text-sm sm:text-lg font-bold text-gray-900 mb-1 sm:mb-2">Researchers</h3>
              <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">View and manage all researchers/consultants</p>
            </div>

            {/* Team applications (public /apply-team) */}
            <div
              onClick={() => router.push('/dashboard/management/team-applications')}
              className="bg-white rounded-lg shadow border border-gray-200 p-3 sm:p-6 hover:shadow-lg hover:border-emerald-500 transition-all cursor-pointer relative focus:outline-none focus:ring-2 focus:ring-emerald-500"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && router.push('/dashboard/management/team-applications')}
            >
              {counts.teamApplications > 0 && (
                <div className="absolute top-2 right-2 sm:top-4 sm:right-4">
                  <NotificationBadge count={counts.teamApplications} className="text-xs sm:text-base px-2 sm:px-3 py-0.5 sm:py-1" />
                </div>
              )}
              <div className="bg-teal-600 w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-2 sm:mb-4">
                <UserPlus className="text-white" size={20} />
              </div>
              <h3 className="text-sm sm:text-lg font-bold text-gray-900 mb-1 sm:mb-2">Team Applications</h3>
              <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Review join-the-team applications from the public form</p>
            </div>

            {/* Census field applications (public /apply-census) */}
            <div
              onClick={() => router.push('/dashboard/management/census-field-applications')}
              className="bg-white rounded-lg shadow border border-gray-200 p-3 sm:p-6 hover:shadow-lg hover:border-emerald-500 transition-all cursor-pointer relative focus:outline-none focus:ring-2 focus:ring-emerald-500"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && router.push('/dashboard/management/census-field-applications')}
            >
              {counts.censusFieldApplications > 0 && (
                <div className="absolute top-2 right-2 sm:top-4 sm:right-4">
                  <NotificationBadge count={counts.censusFieldApplications} className="text-xs sm:text-base px-2 sm:px-3 py-0.5 sm:py-1" />
                </div>
              )}
              <div className="bg-teal-700 w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-2 sm:mb-4">
                <MapPin className="text-white" size={20} />
              </div>
              <h3 className="text-sm sm:text-lg font-bold text-gray-900 mb-1 sm:mb-2">Census Field Applications</h3>
              <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Review applications to collect field / census data</p>
            </div>

            {/* Assignment Requests */}
            <div
              onClick={() => router.push('/dashboard/management/assignment-requests')}
              className="bg-white rounded-lg shadow border border-gray-200 p-3 sm:p-6 hover:shadow-lg hover:border-emerald-500 transition-all cursor-pointer relative"
            >
              {assignmentRequestsBadge > 0 && (
                <div className="absolute top-2 right-2 sm:top-4 sm:right-4">
                  <NotificationBadge count={assignmentRequestsBadge} className="text-xs sm:text-base px-2 sm:px-3 py-0.5 sm:py-1" />
                </div>
              )}
              <div className="bg-emerald-500 w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-2 sm:mb-4">
                <DollarSign className="text-white" size={20} />
              </div>
              <h3 className="text-sm sm:text-lg font-bold text-gray-900 mb-1 sm:mb-2">Assignment Requests</h3>
              <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Review, price, negotiate & verify payments</p>
            </div>

            {/* Study Materials */}
            <div
              onClick={() => router.push('/dashboard/management/materials')}
              className="bg-white rounded-lg shadow border border-gray-200 p-3 sm:p-6 hover:shadow-lg hover:border-emerald-500 transition-all cursor-pointer relative"
            >
              <div className="bg-pink-500 w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-2 sm:mb-4">
                <BookOpen className="text-white" size={20} />
              </div>
              <h3 className="text-sm sm:text-lg font-bold text-gray-900 mb-1 sm:mb-2">Study Materials</h3>
              <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Upload and organize study materials</p>
            </div>

            {/* Donation Inquiries */}
            <div
              onClick={() => router.push('/dashboard/management/donation-inquiries')}
              className="bg-white rounded-lg shadow border border-gray-200 p-3 sm:p-6 hover:shadow-lg hover:border-emerald-500 transition-all cursor-pointer relative"
            >
              {counts.donationInquiries > 0 && (
                <div className="absolute top-2 right-2 sm:top-4 sm:right-4">
                  <NotificationBadge count={counts.donationInquiries} className="text-xs sm:text-base px-2 sm:px-3 py-0.5 sm:py-1" />
                </div>
              )}
              <div className="bg-yellow-500 w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-2 sm:mb-4">
                <DollarSign className="text-white" size={20} />
              </div>
              <h3 className="text-sm sm:text-lg font-bold text-gray-900 mb-1 sm:mb-2">Donation Inquiries</h3>
              <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">View and manage donation requests</p>
            </div>

            {/* About Me */}
            <div
              onClick={() => router.push('/dashboard/management/about-me')}
              className="bg-white rounded-lg shadow border border-gray-200 p-3 sm:p-6 hover:shadow-lg hover:border-emerald-500 transition-all cursor-pointer relative"
            >
              <div className="bg-cyan-500 w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-2 sm:mb-4">
                <Info className="text-white" size={20} />
              </div>
              <h3 className="text-sm sm:text-lg font-bold text-gray-900 mb-1 sm:mb-2">About Me</h3>
              <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Edit your public "About Consultant" section</p>
            </div>

            {/* My Profile */}
            <div
              onClick={() => router.push('/dashboard/management/profile')}
              className="bg-white rounded-lg shadow border border-gray-200 p-3 sm:p-6 hover:shadow-lg hover:border-emerald-500 transition-all cursor-pointer relative"
            >
              <div className="bg-gray-500 w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-2 sm:mb-4">
                <Users className="text-white" size={20} />
              </div>
              <h3 className="text-sm sm:text-lg font-bold text-gray-900 mb-1 sm:mb-2">My Profile</h3>
              <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Update your professional profile</p>
            </div>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="text-emerald-600" size={24} />
            Recent Activity
          </h3>

          {recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((activity: any, index: number) => (
                <div key={index} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className={`${activity.color} p-2 rounded-lg flex-shrink-0`}>
                    <activity.icon className="text-white" size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{activity.title}</p>
                    <p className="text-xs text-gray-600">{activity.description}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatDate(activity.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Activity className="mx-auto mb-2 text-gray-300" size={48} />
              <p className="text-sm">No recent activity</p>
            </div>
          )}
        </div>
      </main>

    </div>
  );
}
