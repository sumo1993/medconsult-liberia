'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, FileText, MessageSquare, Activity, Calendar, TrendingUp, DollarSign, Bell, Settings, Image as ImageIcon, Handshake, UserCog, Eye, EyeOff, X } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import NotificationBadge from '@/components/NotificationBadge';
import ProfileAvatar from '@/components/ProfileAvatar';
import { useSessionValidation } from '@/hooks/useSessionValidation';

export default function AdminDashboard() {
  const router = useRouter();
  const { counts, loading: notifLoading, refresh } = useNotifications('admin');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMessages: 0,
    totalAppointments: 0,
    totalResearch: 0,
    totalAssignments: 0,
  });
  const [earnings, setEarnings] = useState<any>(null);
  const [showEarnings, setShowEarnings] = useState(true);
  const [passwordRequests, setPasswordRequests] = useState<any[]>([]);
  const [showPasswordRequestModal, setShowPasswordRequestModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [toast, setToast] = useState<{show: boolean, message: string, type: 'success' | 'error'}>({show: false, message: '', type: 'success'});
  const [loading, setLoading] = useState(true);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  // Calculate total notifications
  const totalNotifications = counts.messages + counts.appointments + counts.assignments + counts.donationInquiries + counts.researchPosts;

  // Validate session continuously
  useSessionValidation();

  useEffect(() => {
    fetchStats();
    fetchEarnings();
    fetchPasswordRequests();
  }, []);

  const fetchPasswordRequests = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/password-change-request', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (response.ok) {
        const data = await response.json();
        setPasswordRequests(data);
      }
    } catch (error) {
      console.error('Error fetching password requests:', error);
    }
  };

  const handlePasswordRequestAction = async (requestId: number, action: 'approve' | 'reject') => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/password-change-request', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          requestId,
          action,
          adminNotes
        })
      });

      if (response.ok) {
        showToast(`Password change request ${action}d successfully! 🔐`, 'success');
        setShowPasswordRequestModal(false);
        setSelectedRequest(null);
        setAdminNotes('');
        fetchPasswordRequests();
      } else {
        showToast('Failed to process request', 'error');
      }
    } catch (error) {
      console.error('Error processing request:', error);
      showToast('Failed to process request', 'error');
    }
  };

  const fetchEarnings = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/my-earnings', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (response.ok) {
        const data = await response.json();
        setEarnings(data);
      }
    } catch (error) {
      console.error('Error fetching earnings:', error);
    }
  };

  const fetchStats = async () => {
    try {
      console.log('[Admin Dashboard] Fetching stats...');
      // Fetch statistics from API
      const response = await fetch('/api/admin/stats', {
        credentials: 'include',
      });
      console.log('[Admin Dashboard] Response status:', response.status);
      console.log('[Admin Dashboard] Response ok:', response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[Admin Dashboard] Stats received:', data);
        setStats(data);
      } else {
        const errorText = await response.text();
        console.error('[Admin Dashboard] Failed to fetch stats:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        
        // Try to parse as JSON
        try {
          const errorJson = JSON.parse(errorText);
          console.error('[Admin Dashboard] Error details:', errorJson);
        } catch (e) {
          console.error('[Admin Dashboard] Response is not JSON:', errorText);
        }
        
        // If unauthorized, redirect to login
        if (response.status === 401) {
          console.log('[Admin Dashboard] Unauthorized - redirecting to login');
          router.push('/login');
        }
      }
    } catch (error) {
      console.error('[Admin Dashboard] Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-blue-500',
      link: '/dashboard/admin/users',
    },
    {
      title: 'Contact Messages',
      value: stats.totalMessages,
      icon: MessageSquare,
      color: 'bg-green-500',
      link: '/dashboard/admin/messages',
    },
    {
      title: 'Appointments',
      value: stats.totalAppointments,
      icon: Calendar,
      color: 'bg-purple-500',
      link: '/dashboard/admin/appointments',
    },
    {
      title: 'Research Posts',
      value: stats.totalResearch,
      icon: FileText,
      color: 'bg-orange-500',
      link: '/dashboard/admin/research',
    },
    {
      title: 'Assignment Requests',
      value: stats.totalAssignments,
      icon: TrendingUp,
      color: 'bg-pink-500',
      link: '/dashboard/admin/assignments',
    },
    {
      title: 'Activity Logs',
      value: '—',
      icon: Activity,
      color: 'bg-indigo-500',
      link: '/dashboard/admin/logs',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex justify-between items-center gap-2">
            <div className="flex-shrink-0">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Admin Dashboard</h1>
              <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Welcome back, Administrator</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
              <div className="relative">
                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <Bell className="text-gray-600 hover:text-gray-900" size={20} />
                  {totalNotifications > 0 && (
                    <NotificationBadge 
                      count={totalNotifications} 
                      className="absolute -top-1 -right-1"
                    />
                  )}
                </button>
              </div>
              <button
                onClick={() => router.push('/')}
                className="hidden md:inline-flex items-center text-sm text-gray-600 hover:text-gray-900 font-medium"
              >
                Home
              </button>
              <ProfileAvatar 
                onClick={() => router.push('/dashboard/admin/profile')}
                size="sm"
              />
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all shadow-md hover:shadow-lg text-xs sm:text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* My Earnings Card */}
        {earnings && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">My Earnings (IT Specialist)</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowEarnings(!showEarnings)}
                  className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                  title={showEarnings ? "Hide earnings" : "Show earnings"}
                >
                  {showEarnings ? <Eye className="text-blue-600" size={24} /> : <EyeOff className="text-gray-400" size={24} />}
                </button>
                <DollarSign className="text-blue-600" size={32} />
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 shadow">
                <p className="text-sm text-gray-600 mb-1">Total Earned</p>
                <p className="text-2xl font-bold text-blue-600">
                  {showEarnings ? `$${earnings.totalEarned?.toFixed(2) || '0.00'}` : '••••••'}
                </p>
                <p className="text-xs text-gray-500 mt-1">25% of team share</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow">
                <p className="text-sm text-gray-600 mb-1">Total Paid</p>
                <p className="text-2xl font-bold text-green-600">
                  {showEarnings ? `$${earnings.totalPaid?.toFixed(2) || '0.00'}` : '••••••'}
                </p>
                {earnings.lastPaymentDate && (
                  <p className="text-xs text-gray-500 mt-1">Last: {new Date(earnings.lastPaymentDate).toLocaleDateString()}</p>
                )}
              </div>
              <div className="bg-white rounded-lg p-4 shadow">
                <p className="text-sm text-gray-600 mb-1">Unpaid</p>
                <p className="text-2xl font-bold text-orange-600">
                  {showEarnings ? `$${earnings.unpaid?.toFixed(2) || '0.00'}` : '••••••'}
                </p>
                <div className="mt-2">
                  {earnings.paymentStatus === 'paid' && <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">✓ Paid</span>}
                  {earnings.paymentStatus === 'partial' && <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold">Partial</span>}
                  {earnings.paymentStatus === 'unpaid' && <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">Unpaid</span>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Password Change Requests Alert */}
        {passwordRequests.filter(r => r.status === 'pending').length > 0 && (
          <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-300 rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-full">
                  <Bell className="text-orange-600" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    🔐 Password Change Requests
                  </h3>
                  <p className="text-sm text-gray-600">
                    {passwordRequests.filter(r => r.status === 'pending').length} pending request(s) require your attention
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPasswordRequestModal(true)}
                className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold shadow-md"
              >
                Review Requests
              </button>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
          {statCards.map((stat, index) => (
            <div
              key={index}
              onClick={() => router.push(stat.link)}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 overflow-hidden group"
            >
              <div className="p-4 sm:p-5 md:p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-2 font-medium">{stat.title}</p>
                    <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
                      {loading ? '...' : stat.value}
                    </p>
                  </div>
                  <div className={`${stat.color} p-2 sm:p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className="text-white" size={20} />
                  </div>
                </div>
                <div className="h-1 bg-gradient-to-r from-gray-200 to-transparent rounded-full"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="w-1 h-6 bg-gradient-to-b from-emerald-600 to-teal-600 rounded-full mr-3"></span>
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            <button
              onClick={() => router.push('/dashboard/admin/users')}
              className="px-3 py-2.5 sm:px-4 sm:py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-xs sm:text-sm font-medium"
            >
              <Users size={16} className="inline mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Manage </span>Users
            </button>
            <button
              onClick={() => router.push('/dashboard/admin/team-applications')}
              className="px-3 py-2.5 sm:px-4 sm:py-3 bg-gradient-to-r from-cyan-600 to-cyan-700 text-white rounded-lg hover:from-cyan-700 hover:to-cyan-800 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-xs sm:text-sm font-medium"
            >
              <UserCog size={16} className="inline mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Team </span>Apps
            </button>
            <button
              onClick={() => router.push('/dashboard/admin/researchers')}
              className="px-3 py-2.5 sm:px-4 sm:py-3 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-700 hover:to-teal-800 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-xs sm:text-sm font-medium"
            >
              <Users size={16} className="inline mr-1 sm:mr-2" />
              Researchers
            </button>
            <button
              onClick={() => router.push('/dashboard/admin/research-approvals')}
              className="px-3 py-2.5 sm:px-4 sm:py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-xs sm:text-sm font-medium"
            >
              <FileText size={16} className="inline mr-1 sm:mr-2" />
              Research Approvals
            </button>
            <button
              onClick={() => router.push('/dashboard/admin/messages')}
              className="px-3 py-2.5 sm:px-4 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 relative text-xs sm:text-sm font-medium"
            >
              <MessageSquare size={16} className="inline mr-1 sm:mr-2" />
              Messages
              {counts.messages > 0 && (
                <NotificationBadge count={counts.messages} className="absolute -top-2 -right-2" />
              )}
            </button>
            <button
              onClick={() => router.push('/dashboard/admin/donation-inquiries')}
              className="px-3 py-2.5 sm:px-4 sm:py-3 bg-gradient-to-r from-yellow-600 to-yellow-700 text-white rounded-lg hover:from-yellow-700 hover:to-yellow-800 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 relative text-xs sm:text-sm font-medium"
            >
              <DollarSign size={16} className="inline mr-1" />
              <span className="hidden sm:inline">Donations</span>
              <span className="sm:hidden">Donate</span>
              {counts.donationInquiries > 0 && (
                <NotificationBadge count={counts.donationInquiries} className="absolute -top-2 -right-2" />
              )}
            </button>
            <button
              onClick={() => router.push('/dashboard/admin/payment-settings')}
              className="px-3 py-2.5 sm:px-4 sm:py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-xs sm:text-sm font-medium"
            >
              <DollarSign size={16} className="inline mr-1 sm:mr-2" />
              Payment
            </button>
            <button
              onClick={() => router.push('/dashboard/admin/research')}
              className="px-3 py-2.5 sm:px-4 sm:py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-xs sm:text-sm font-medium"
            >
              <FileText size={16} className="inline mr-1 sm:mr-2" />
              Research
            </button>
            <button
              onClick={() => router.push('/dashboard/admin/logs')}
              className="px-3 py-2.5 sm:px-4 sm:py-3 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-lg hover:from-gray-800 hover:to-gray-900 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-xs sm:text-sm font-medium"
            >
              <Activity size={16} className="inline mr-1 sm:mr-2" />
              Logs
            </button>
            <button
              onClick={() => router.push('/dashboard/admin/site-settings')}
              className="px-3 py-2.5 sm:px-4 sm:py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-xs sm:text-sm font-medium"
            >
              <Settings size={16} className="inline mr-1 sm:mr-2" />
              Settings
            </button>
            <button
              onClick={() => router.push('/dashboard/admin/hero-settings')}
              className="px-3 py-2.5 sm:px-4 sm:py-3 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-700 hover:to-teal-800 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-xs sm:text-sm font-medium"
            >
              <ImageIcon size={16} className="inline mr-1 sm:mr-2" />
              Hero
            </button>
            <button
              onClick={() => router.push('/dashboard/admin/statistics')}
              className="px-3 py-2.5 sm:px-4 sm:py-3 bg-gradient-to-r from-pink-600 to-pink-700 text-white rounded-lg hover:from-pink-700 hover:to-pink-800 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-xs sm:text-sm font-medium"
            >
              <TrendingUp size={16} className="inline mr-1 sm:mr-2" />
              Stats
            </button>
            <button
              onClick={() => router.push('/dashboard/admin/partnerships')}
              className="px-3 py-2.5 sm:px-4 sm:py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-xs sm:text-sm font-medium"
            >
              <Handshake size={16} className="inline mr-1 sm:mr-2" />
              Partnerships
            </button>
            <button
              onClick={() => router.push('/dashboard/admin/team')}
              className="px-3 py-2.5 sm:px-4 sm:py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-xs sm:text-sm font-medium"
            >
              <UserCog size={16} className="inline mr-1 sm:mr-2" />
              Team
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="w-1 h-6 bg-gradient-to-b from-emerald-600 to-teal-600 rounded-full mr-3"></span>
            Recent Activity
          </h2>
          <div className="text-gray-600 text-center py-8 sm:py-12">
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Activity className="text-gray-400" size={32} />
            </div>
            <p className="text-sm sm:text-base">Activity monitoring coming soon...</p>
          </div>
        </div>
      </main>

      {/* Password Change Requests Modal */}
      {showPasswordRequestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Password Change Requests</h2>
              <button 
                onClick={() => {
                  setShowPasswordRequestModal(false);
                  setSelectedRequest(null);
                  setAdminNotes('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              {passwordRequests.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg">No password change requests</p>
                </div>
              ) : (
                passwordRequests.map((request) => (
                  <div 
                    key={request.id}
                    className={`border-2 rounded-lg p-4 ${
                      request.status === 'pending' ? 'border-orange-300 bg-orange-50' :
                      request.status === 'approved' ? 'border-green-300 bg-green-50' :
                      'border-red-300 bg-red-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-gray-900">{request.requester_name}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            request.status === 'pending' ? 'bg-orange-200 text-orange-800' :
                            request.status === 'approved' ? 'bg-green-200 text-green-800' :
                            'bg-red-200 text-red-800'
                          }`}>
                            {request.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{request.user_email} • {request.user_role}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Requested: {new Date(request.requested_at).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-4 mb-3">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Reason:</p>
                      <p className="text-sm text-gray-600">{request.reason}</p>
                    </div>

                    {request.status !== 'pending' && (
                      <div className="bg-white rounded-lg p-4 mb-3">
                        <p className="text-sm font-semibold text-gray-700 mb-2">
                          {request.status === 'approved' ? 'Approved' : 'Rejected'} by: {request.reviewer_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(request.reviewed_at).toLocaleString()}
                        </p>
                        {request.admin_notes && (
                          <p className="text-sm text-gray-600 mt-2">Notes: {request.admin_notes}</p>
                        )}
                      </div>
                    )}

                    {request.status === 'pending' && (
                      <div className="mt-4">
                        {selectedRequest?.id === request.id ? (
                          <div className="space-y-3">
                            <textarea
                              value={adminNotes}
                              onChange={(e) => setAdminNotes(e.target.value)}
                              className="w-full px-4 py-2 border rounded-lg"
                              rows={3}
                              placeholder="Add notes (optional)..."
                            />
                            <div className="flex gap-3">
                              <button
                                onClick={() => handlePasswordRequestAction(request.id, 'approve')}
                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                              >
                                ✓ Approve
                              </button>
                              <button
                                onClick={() => handlePasswordRequestAction(request.id, 'reject')}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
                              >
                                ✕ Reject
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedRequest(null);
                                  setAdminNotes('');
                                }}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setSelectedRequest(request)}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                          >
                            Review Request
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modern Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-8 right-8 z-50 animate-slide-up">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl ${
            toast.type === 'success' 
              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' 
              : 'bg-gradient-to-r from-red-500 to-red-600'
          } text-white min-w-[300px]`}>
            <div className="text-2xl">
              {toast.type === 'success' ? '✓' : '✕'}
            </div>
            <div className="flex-1 font-medium">{toast.message}</div>
            <button 
              onClick={() => setToast({ show: false, message: '', type: 'success' })}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
