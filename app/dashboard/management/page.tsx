'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, MessageSquare, Calendar, BookOpen, Users, Bell, Info, DollarSign, Star,
  TrendingUp, Clock, CheckCircle, AlertCircle, Target, Activity, BarChart3,
  Wallet, CreditCard, ArrowUp, ArrowDown, Filter, Search, ChevronRight, Eye, EyeOff
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import NotificationBadge from '@/components/NotificationBadge';
import ProfileAvatar from '@/components/ProfileAvatar';
import { useSessionValidation } from '@/hooks/useSessionValidation';
import { useAccountStatus } from '@/hooks/useAccountStatus';

export default function ManagementDashboardEnhanced() {
  const router = useRouter();
  const { counts, refresh } = useNotifications('management');
  
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

  const totalNotifications = counts.messages + counts.appointments + counts.assignments + counts.donationInquiries;

  useSessionValidation();
  useAccountStatus();

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAllData = async () => {
    await Promise.all([
      fetchProfile(),
      fetchStats(),
      fetchRatingStats(),
      fetchRecentActivity(),
      fetchUpcomingDeadlines(),
      fetchClients(),
      fetchEarnings(),
      fetchMyEarnings(),
    ]);
  };

  const fetchMyEarnings = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/my-earnings', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (response.ok) {
        const data = await response.json();
        setMyEarnings(data);
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
          full_name: data.full_name || 'Consultant',
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

  const fetchRatingStats = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/profile', {
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      if (response.ok) {
        const data = await response.json();
        setRatingStats({
          averageRating: parseFloat(data.average_rating || 0),
          totalRatings: parseInt(data.total_ratings || 0),
        });
      }
    } catch (error) {
      console.error('Error fetching rating stats:', error);
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
              <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Management Portal</p>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => setSelectedTab('notifications')}
                className="relative p-2 hover:bg-gray-100 rounded-lg"
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
            Welcome back, {profile?.full_name || 'Consultant'}! 👋
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
              <span className="text-xs text-green-600 font-semibold">+12%</span>
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
            <button
              onClick={() => router.push('/dashboard/management/earnings')}
              className="text-emerald-600 hover:text-emerald-700 text-sm font-medium flex items-center gap-1"
            >
              View All <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="border border-gray-200 rounded-lg p-3 sm:p-4">
              <div className="text-xs sm:text-sm text-gray-600 mb-1">This Month</div>
              <div className="text-xl sm:text-2xl font-bold text-emerald-600">{formatCurrency(earnings.thisMonth)}</div>
              <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
                <ArrowUp size={12} />
                <span>+{((earnings.thisMonth - earnings.lastMonth) / earnings.lastMonth * 100).toFixed(0)}%</span>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-3 sm:p-4">
              <div className="text-xs sm:text-sm text-gray-600 mb-1">Last Month</div>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">{formatCurrency(earnings.lastMonth)}</div>
            </div>

            <div className="border border-gray-200 rounded-lg p-3 sm:p-4">
              <div className="text-xs sm:text-sm text-gray-600 mb-1">Pending</div>
              <div className="text-xl sm:text-2xl font-bold text-yellow-600">{formatCurrency(earnings.pending)}</div>
            </div>

            <div className="border border-gray-200 rounded-lg p-3 sm:p-4">
              <div className="text-xs sm:text-sm text-gray-600 mb-1">Total Earned</div>
              <div className="text-xl sm:text-2xl font-bold text-blue-600">{formatCurrency(earnings.total)}</div>
            </div>
          </div>
        </div>

        {/* Work Progress Tracker */}
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
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
            <div className="text-center py-8 text-gray-500">
              <Target className="mx-auto mb-2 text-gray-300" size={48} />
              <p className="text-sm">No assignments in progress</p>
            </div>
          )}
        </div>

        {/* Calendar/Schedule View */}
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
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
            <div className="text-center py-8 text-gray-500">
              <Calendar className="mx-auto mb-2 text-gray-300" size={48} />
              <p className="text-sm">No upcoming deadlines</p>
            </div>
          )}
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
              className="bg-white rounded-lg shadow border border-gray-200 p-3 sm:p-6 hover:shadow-lg hover:border-emerald-500 transition-all cursor-pointer relative"
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
              <div className="bg-purple-500 w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-2 sm:mb-4">
                <FileText className="text-white" size={20} />
              </div>
              <h3 className="text-sm sm:text-lg font-bold text-gray-900 mb-1 sm:mb-2">Research Posts</h3>
              <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Create and manage research articles</p>
            </div>

            {/* Research Approvals */}
            <div
              onClick={() => router.push('/dashboard/admin/research-approvals')}
              className="bg-white rounded-lg shadow border border-gray-200 p-3 sm:p-6 hover:shadow-lg hover:border-emerald-500 transition-all cursor-pointer relative"
            >
              <div className="bg-orange-500 w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-2 sm:mb-4">
                <CheckCircle className="text-white" size={20} />
              </div>
              <h3 className="text-sm sm:text-lg font-bold text-gray-900 mb-1 sm:mb-2">Research Approvals</h3>
              <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Review and approve pending research papers</p>
            </div>

            {/* Researchers */}
            <div
              onClick={() => router.push('/dashboard/admin/researchers')}
              className="bg-white rounded-lg shadow border border-gray-200 p-3 sm:p-6 hover:shadow-lg hover:border-emerald-500 transition-all cursor-pointer relative"
            >
              <div className="bg-indigo-500 w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-2 sm:mb-4">
                <Users className="text-white" size={20} />
              </div>
              <h3 className="text-sm sm:text-lg font-bold text-gray-900 mb-1 sm:mb-2">Researchers</h3>
              <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">View and manage all researchers/consultants</p>
            </div>

            {/* Assignment Requests */}
            <div
              onClick={() => router.push('/dashboard/management/assignment-requests')}
              className="bg-white rounded-lg shadow border border-gray-200 p-3 sm:p-6 hover:shadow-lg hover:border-emerald-500 transition-all cursor-pointer relative"
            >
              {counts.unreadAssignmentMessages > 0 && (
                <div className="absolute top-2 right-2 sm:top-4 sm:right-4">
                  <NotificationBadge count={counts.unreadAssignmentMessages} className="text-xs sm:text-base px-2 sm:px-3 py-0.5 sm:py-1" />
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

      {/* Mobile Bottom Navigation */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="grid grid-cols-5 gap-1">
          <button
            onClick={() => router.push('/dashboard/management')}
            className="flex flex-col items-center py-2 px-1 text-emerald-600"
          >
            <BarChart3 size={20} />
            <span className="text-xs mt-1">Dashboard</span>
          </button>
          <button
            onClick={() => router.push('/dashboard/management/assignment-requests')}
            className="flex flex-col items-center py-2 px-1 text-gray-600 relative"
          >
            <FileText size={20} />
            <span className="text-xs mt-1">Assignments</span>
            {counts.assignments > 0 && (
              <span className="absolute top-1 right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {counts.assignments}
              </span>
            )}
          </button>
          <button
            onClick={() => router.push('/dashboard/management/messages')}
            className="flex flex-col items-center py-2 px-1 text-gray-600 relative"
          >
            <MessageSquare size={20} />
            <span className="text-xs mt-1">Messages</span>
            {counts.messages > 0 && (
              <span className="absolute top-1 right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {counts.messages}
              </span>
            )}
          </button>
          <button
            onClick={() => setSelectedTab('notifications')}
            className="flex flex-col items-center py-2 px-1 text-gray-600 relative"
          >
            <Bell size={20} />
            <span className="text-xs mt-1">Alerts</span>
            {totalNotifications > 0 && (
              <span className="absolute top-1 right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {totalNotifications}
              </span>
            )}
          </button>
          <button
            onClick={() => router.push('/dashboard/management/profile')}
            className="flex flex-col items-center py-2 px-1 text-gray-600"
          >
            <Users size={20} />
            <span className="text-xs mt-1">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
