'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, FileText, MessageSquare, ClipboardList, LogOut, User, Upload, Search, Bell, Calendar, Inbox, CheckCircle, TrendingUp, Clock, Award, Zap, HelpCircle, DollarSign, ArrowRight, Activity, Target, RefreshCw, BarChart3, Users } from 'lucide-react';
import ProfileAvatar from '@/components/ProfileAvatar';
import { useSessionValidation } from '@/hooks/useSessionValidation';
import { useNotifications } from '@/hooks/useNotifications';
import { useAccountStatus } from '@/hooks/useAccountStatus';

interface DashboardStats {
  myAssignments: number;
  availableResearch: number;
  unreadMessages: number;
  studyMaterials: number;
  assignmentsWithFeedback: number;
  completedAssignments: number;
}

interface RecentActivity {
  id: number;
  type: 'assignment' | 'feedback' | 'message' | 'research';
  title: string;
  description: string;
  time: string;
  icon: any;
  color: string;
}

interface ProfileCompletion {
  percentage: number;
  missingFields: string[];
}

// In Progress Assignments Component
function InProgressAssignments() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInProgressAssignments();
  }, []);

  const fetchInProgressAssignments = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/client/assignments-in-progress', {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAssignments(data);
      }
    } catch (error) {
      console.error('Error fetching in-progress assignments:', error);
    } finally {
      setLoading(false);
    }
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

  const getProgressPercentage = (status: string) => {
    switch (status) {
      case 'accepted':
      case 'payment_uploaded':
        return 25;
      case 'payment_verified':
        return 50;
      case 'in_progress':
        return 75;
      default:
        return 0;
    }
  };

  if (loading) return null;
  if (assignments.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-6">
      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Target className="text-emerald-600" size={24} />
        In Progress Assignments
      </h3>

      <div className="space-y-3">
        {assignments.map((assignment: any) => (
          <div 
            key={assignment.id} 
            className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:border-emerald-500 transition-colors cursor-pointer"
            onClick={() => router.push(`/dashboard/client/assignments/${assignment.id}`)}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 text-sm sm:text-base">{assignment.title}</h4>
                <p className="text-xs sm:text-sm text-gray-600">
                  Status: <span className="font-medium text-emerald-600">{assignment.status_label}</span>
                </p>
              </div>
              {assignment.deadline && (
                <span className={`text-xs font-semibold px-2 py-1 rounded ${
                  assignment.days_left > 2 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {getTimeUntilDeadline(assignment.deadline)}
                </span>
              )}
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div 
                className="bg-emerald-600 h-2 rounded-full transition-all"
                style={{ width: `${getProgressPercentage(assignment.status)}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>{getProgressPercentage(assignment.status)}% complete</span>
              {assignment.consultant_name && (
                <span className="text-emerald-600">Consultant: {assignment.consultant_name}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ClientDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    myAssignments: 0,
    availableResearch: 0,
    unreadMessages: 0,
    studyMaterials: 0,
    assignmentsWithFeedback: 0,
    completedAssignments: 0,
  });
  const [userName, setUserName] = useState('Student');
  const [dateOfBirth, setDateOfBirth] = useState<string>('');
  const [age, setAge] = useState<number | null>(null);
  const [showAge, setShowAge] = useState(true);
  const [birthdayInfo, setBirthdayInfo] = useState<{ message: string; type: 'birthday' | 'pre-birthday' | null }>({ message: '', type: null });
  const [profileCompletion, setProfileCompletion] = useState<ProfileCompletion>({ percentage: 0, missingFields: [] });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [lastLogin, setLastLogin] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [studyStreak, setStudyStreak] = useState(0);

  // Validate session continuously
  useSessionValidation();
  
  // Check account status (will auto-logout if suspended)
  useAccountStatus();
  
  // Get notification counts
  const { counts: notificationCounts } = useNotifications('client');

  useEffect(() => {
    // Load age visibility preference from localStorage
    const ageVisibility = localStorage.getItem('showAge');
    if (ageVisibility !== null) {
      setShowAge(ageVisibility === 'true');
    }
    
    fetchProfile();
    fetchStats();
    // Refresh stats every 2 minutes (reduced from 30 seconds)
    const interval = setInterval(fetchStats, 120000);
    return () => clearInterval(interval);
  }, []);

  const toggleAgeVisibility = () => {
    const newValue = !showAge;
    setShowAge(newValue);
    localStorage.setItem('showAge', newValue.toString());
  };

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/profile', {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        // Set user name from profile
        if (data.full_name) {
          setUserName(data.full_name);
        }
        
        // Set birthday info
        if (data.date_of_birth) {
          setDateOfBirth(data.date_of_birth);
          const calculatedAge = calculateAge(data.date_of_birth);
          setAge(calculatedAge);
          const birthday = getBirthdayMessage(data.date_of_birth);
          setBirthdayInfo(birthday);
        }

        // Calculate profile completion
        calculateProfileCompletion(data);

        // Set last login
        if (data.last_login) {
          setLastLogin(formatLastLogin(data.last_login));
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const calculateProfileCompletion = (profile: any) => {
    const fields = [
      { name: 'full_name', label: 'Full Name' },
      { name: 'date_of_birth', label: 'Date of Birth' },
      { name: 'gender', label: 'Gender' },
      { name: 'city', label: 'City' },
      { name: 'county', label: 'County' },
      { name: 'phone_number', label: 'Phone Number' },
      { name: 'educational_level', label: 'Education Level' },
      { name: 'bio', label: 'Bio' },
    ];

    const filledFields = fields.filter(field => profile[field.name] && profile[field.name] !== '');
    const percentage = Math.round((filledFields.length / fields.length) * 100);
    const missingFields = fields.filter(field => !profile[field.name] || profile[field.name] === '').map(f => f.label);

    setProfileCompletion({ percentage, missingFields });
  };

  const formatLastLogin = (lastLogin: string): string => {
    const date = new Date(lastLogin);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchProfile(), fetchStats()]);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const calculateAge = (birthDate: string): number | null => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const getBirthdayMessage = (birthDate: string): { message: string; type: 'birthday' | 'pre-birthday' | null } => {
    if (!birthDate) return { message: '', type: null };
    
    const today = new Date();
    const birth = new Date(birthDate);
    const currentYear = today.getFullYear();
    
    const thisYearBirthday = new Date(currentYear, birth.getMonth(), birth.getDate());
    const timeDiff = thisYearBirthday.getTime() - today.getTime();
    const daysUntilBirthday = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (today.getDate() === birth.getDate() && today.getMonth() === birth.getMonth()) {
      const age = calculateAge(birthDate);
      return { 
        message: `🎉 Happy Birthday ${userName}! You are ${age} years old today! 🎂`, 
        type: 'birthday' 
      };
    }
    
    if (daysUntilBirthday > 0 && daysUntilBirthday <= 30) {
      return { 
        message: `🎈 Happy Pre-Birthday! Your birthday is in ${daysUntilBirthday} day${daysUntilBirthday > 1 ? 's' : ''}! 🎊`, 
        type: 'pre-birthday' 
      };
    }
    
    return { message: '', type: null };
  };

  const fetchStats = async () => {
    try {
      console.log('[Client Dashboard] Fetching stats...');
      const token = localStorage.getItem('auth-token');
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // Allow browser caching for better performance
      const response = await fetch('/api/client/stats', { 
        headers
      });
      console.log('[Client Dashboard] Stats response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[Client Dashboard] Stats received:', data);
        setStats(data);
      } else {
        console.error('[Client Dashboard] Stats fetch failed:', await response.text());
      }
    } catch (error) {
      console.error('[Client Dashboard] Error fetching stats:', error);
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem('auth-token');
    localStorage.removeItem('user');
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const menuItems = [
    {
      title: 'Request Assignment Help',
      description: 'Submit assignments and get help from consultants',
      icon: Upload,
      href: '/dashboard/client/assignments/request',
      color: 'bg-blue-500',
      stat: stats.myAssignments,
      statLabel: 'Active',
    },
    {
      title: 'My Assignments',
      description: 'View your submitted assignments and feedback',
      icon: ClipboardList,
      href: '/dashboard/client/assignments',
      color: 'bg-indigo-500',
      stat: stats.myAssignments,
      statLabel: 'Total',
      badge: notificationCounts.unreadAssignmentMessages > 0 ? notificationCounts.unreadAssignmentMessages : stats.assignmentsWithFeedback,
    },
    {
      title: 'Research Library',
      description: 'Access medical research and articles',
      icon: BookOpen,
      href: '/dashboard/client/research',
      color: 'bg-green-500',
      stat: stats.availableResearch,
      statLabel: 'Available',
    },
    {
      title: 'Study Materials',
      description: 'Download study materials and resources',
      icon: FileText,
      href: '/dashboard/client/materials',
      color: 'bg-purple-500',
      stat: stats.studyMaterials,
      statLabel: 'Files',
    },
    {
      title: 'My Inbox',
      description: 'View messages and consultant replies',
      icon: Inbox,
      href: '/dashboard/client/inbox',
      color: 'bg-indigo-500',
      stat: stats.unreadMessages,
      statLabel: 'Unread',
    },
    {
      title: 'Contact Consultant',
      description: 'Send messages and ask questions',
      icon: MessageSquare,
      href: '/dashboard/client/messages',
      color: 'bg-orange-500',
    },
    {
      title: 'My Profile',
      description: 'Update your profile and settings',
      icon: User,
      href: '/dashboard/client/profile',
      color: 'bg-gray-500',
      link: '/dashboard/client/messages',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* Simple Top Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Dashboard</h1>
            </div>
            <div className="flex items-center gap-3">
              {/* Profile Avatar */}
              <ProfileAvatar 
                onClick={() => router.push('/dashboard/client/profile')}
                className="w-8 h-8 sm:w-10 sm:h-10"
              />
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Birthday Banner */}
        {birthdayInfo.type && (
          <div className={`mb-6 rounded-lg shadow-lg p-6 text-center ${
            birthdayInfo.type === 'birthday' 
              ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500' 
              : 'bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400'
          }`}>
            <p className="text-2xl md:text-3xl font-bold text-white animate-pulse">
              {birthdayInfo.message}
            </p>
            {birthdayInfo.type === 'birthday' && (
              <p className="text-white mt-2 text-lg">
                Wishing you a wonderful day filled with joy and happiness! 🎁
              </p>
            )}
          </div>
        )}

        {/* Enhanced Welcome Section */}
        <div className="bg-gradient-to-r from-emerald-700 to-emerald-900 rounded-xl shadow-lg p-4 sm:p-6 md:p-8 mb-6 text-white relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-24 -translate-x-24"></div>
          </div>

          <div className="relative z-10">
            {/* Top Row - Welcome & Refresh */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-2xl sm:text-3xl font-bold">Welcome back, {userName}!</h2>
                  <button
                    onClick={handleRefresh}
                    className={`p-1.5 hover:bg-white/20 rounded-lg transition-all ${isRefreshing ? 'animate-spin' : ''}`}
                    title="Refresh dashboard"
                  >
                    <RefreshCw size={18} />
                  </button>
                </div>
                <p className="text-emerald-100 text-sm sm:text-base">Ready to continue your learning journey?</p>
                {lastLogin && (
                  <p className="text-emerald-200 text-xs mt-1 flex items-center gap-1">
                    <Clock size={12} />
                    Last login: {lastLogin}
                  </p>
                )}
              </div>
            </div>

            {/* Profile Completion Bar */}
            {profileCompletion.percentage < 100 && (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Target size={16} />
                    <span className="text-sm font-semibold">Profile Completion</span>
                  </div>
                  <span className="text-sm font-bold">{profileCompletion.percentage}%</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2 mb-2">
                  <div 
                    className="bg-yellow-400 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${profileCompletion.percentage}%` }}
                  ></div>
                </div>
                {profileCompletion.missingFields.length > 0 && (
                  <div className="flex items-start gap-2">
                    <p className="text-xs text-emerald-100">
                      Missing: {profileCompletion.missingFields.slice(0, 3).join(', ')}
                      {profileCompletion.missingFields.length > 3 && ` +${profileCompletion.missingFields.length - 3} more`}
                    </p>
                    <button
                      onClick={() => router.push('/dashboard/client/profile')}
                      className="text-xs text-yellow-300 hover:text-yellow-100 font-semibold flex items-center gap-1"
                    >
                      Complete <ArrowRight size={12} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {age !== null && (
                <div className="bg-white/20 backdrop-blur-sm px-3 py-2 rounded-lg relative group">
                  <button
                    onClick={toggleAgeVisibility}
                    className="absolute top-1 right-1 bg-white text-emerald-700 rounded-full w-4 h-4 flex items-center justify-center text-[10px] hover:bg-emerald-100 transition-all shadow-sm"
                    title={showAge ? "Hide age" : "Show age"}
                  >
                    {showAge ? '👁️' : '🙈'}
                  </button>
                  <p className="text-xs text-emerald-100">Age</p>
                  <p className="text-xl font-bold">
                    {showAge ? `🎂 ${age}` : '🎂 ***'}
                  </p>
                </div>
              )}
              
              {studyStreak > 0 && (
                <div className="bg-white/20 backdrop-blur-sm px-3 py-2 rounded-lg">
                  <p className="text-xs text-emerald-100">Study Streak</p>
                  <p className="text-xl font-bold flex items-center gap-1">
                    <Zap size={16} className="text-yellow-300" />
                    {studyStreak} days
                  </p>
                </div>
              )}

              {birthdayInfo.type && (
                <div className={`px-3 py-2 rounded-lg ${
                  birthdayInfo.type === 'birthday' 
                    ? 'bg-pink-500/90' 
                    : 'bg-yellow-400/90'
                }`}>
                  <p className="text-xs font-semibold">
                    {birthdayInfo.type === 'birthday' ? '🎉 Birthday!' : '🎈 Coming Soon'}
                  </p>
                  <p className="text-sm font-bold">
                    {birthdayInfo.type === 'birthday' 
                      ? 'Today!' 
                      : birthdayInfo.message.match(/\d+/)?.[0] + ' days'}
                  </p>
                </div>
              )}

              {/* Quick Actions */}
              <div className="col-span-2 sm:col-span-1 flex gap-2">
                <button
                  onClick={() => router.push('/dashboard/client/assignments/new')}
                  className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-3 py-2 rounded-lg transition-all flex items-center justify-center gap-2"
                  title="Submit Assignment"
                >
                  <Upload size={16} />
                  <span className="text-xs font-semibold hidden sm:inline">Submit</span>
                </button>
                <button
                  onClick={() => router.push('/dashboard/client/inbox')}
                  className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-3 py-2 rounded-lg transition-all flex items-center justify-center gap-2"
                  title="View Messages"
                >
                  <MessageSquare size={16} />
                  <span className="text-xs font-semibold hidden sm:inline">Messages</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats - Moved to Top */}
        <div className="mb-8 grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs sm:text-sm text-gray-600 font-medium">Total Assignments</p>
              <div className="bg-gray-100 p-1.5 sm:p-2 rounded-lg">
                <FileText className="text-gray-600" size={16} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.myAssignments}</p>
            <p className="text-[10px] sm:text-xs text-gray-500 mt-1">All your assignments</p>
          </div>
          <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs sm:text-sm text-gray-600 font-medium">With Feedback</p>
              <div className="bg-green-100 p-1.5 sm:p-2 rounded-lg">
                <MessageSquare className="text-green-600" size={16} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-green-600">{stats.assignmentsWithFeedback}</p>
            <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Reviewed by consultants</p>
          </div>
          <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs sm:text-sm text-gray-600 font-medium">Completed</p>
              <div className="bg-blue-100 p-1.5 sm:p-2 rounded-lg">
                <CheckCircle className="text-blue-600" size={16} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-blue-600">{stats.completedAssignments}</p>
            <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Finished assignments</p>
          </div>
        </div>

        {/* In Progress Assignments Tracker */}
        <InProgressAssignments />

        {/* Empty State for New Users */}
        {stats.myAssignments === 0 && stats.completedAssignments === 0 && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-md p-6 sm:p-8 mb-6 text-center border-2 border-dashed border-blue-200">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="text-blue-600" size={32} />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Ready to Start Your Learning Journey?</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Submit your first assignment and get personalized feedback from our expert consultants!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => router.push('/dashboard/client/assignments/new')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg"
              >
                <Upload size={20} />
                Submit Your First Assignment
              </button>
              <button
                onClick={() => router.push('/dashboard/client/research')}
                className="bg-white hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all shadow-md border border-gray-200"
              >
                <BookOpen size={20} />
                Browse Research Library
              </button>
            </div>
            <div className="mt-6 pt-6 border-t border-blue-200">
              <p className="text-sm text-gray-600 mb-3 font-semibold">📚 How to Get Started:</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left max-w-2xl mx-auto">
                <div className="bg-white p-3 rounded-lg">
                  <div className="text-2xl mb-1">1️⃣</div>
                  <p className="text-xs text-gray-700"><strong>Complete Profile</strong> - Add your details</p>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <div className="text-2xl mb-1">2️⃣</div>
                  <p className="text-xs text-gray-700"><strong>Submit Assignment</strong> - Upload your work</p>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <div className="text-2xl mb-1">3️⃣</div>
                  <p className="text-xs text-gray-700"><strong>Get Feedback</strong> - Learn from experts</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Links Section */}
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Zap className="text-emerald-600" size={20} />
            Quick Links
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={() => router.push('/dashboard/client/profile')}
              className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-gray-50 transition-all border border-gray-200 hover:border-emerald-500"
            >
              <User className="text-gray-600" size={24} />
              <span className="text-xs font-semibold text-gray-700">My Profile</span>
            </button>
            <button
              onClick={() => router.push('/dashboard/client/help')}
              className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-gray-50 transition-all border border-gray-200 hover:border-emerald-500"
            >
              <HelpCircle className="text-gray-600" size={24} />
              <span className="text-xs font-semibold text-gray-700">Help & FAQ</span>
            </button>
            <button
              onClick={() => router.push('/dashboard/client/payments')}
              className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-gray-50 transition-all border border-gray-200 hover:border-emerald-500"
            >
              <DollarSign className="text-gray-600" size={24} />
              <span className="text-xs font-semibold text-gray-700">Payments</span>
            </button>
            <button
              onClick={() => router.push('/dashboard/client/settings')}
              className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-gray-50 transition-all border border-gray-200 hover:border-emerald-500"
            >
              <Activity className="text-gray-600" size={24} />
              <span className="text-xs font-semibold text-gray-700">Activity</span>
            </button>
          </div>
        </div>

        {/* Recent Activity Section */}
        {(stats.myAssignments > 0 || stats.completedAssignments > 0) && (
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="text-emerald-600" size={20} />
              Recent Activity
            </h3>
            {recentActivities.length > 0 ? (
              <div className="space-y-3">
                {recentActivities.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-all border border-gray-100">
                    <div className={`${activity.color} p-2 rounded-lg flex-shrink-0`}>
                      <activity.icon className="text-white" size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{activity.title}</p>
                      <p className="text-xs text-gray-600 truncate">{activity.description}</p>
                      <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Activity className="mx-auto mb-2 text-gray-300" size={48} />
                <p className="text-sm">No recent activity yet</p>
                <p className="text-xs">Your activities will appear here</p>
              </div>
            )}
          </div>
        )}

        {/* Menu Grid */}
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="text-emerald-600" size={20} />
            Main Menu
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {menuItems.map((item, index) => (
            <div
              key={index}
              onClick={() => router.push(item.href)}
              className="bg-white rounded-lg shadow hover:shadow-xl transition-all cursor-pointer border border-gray-200 hover:border-emerald-500 p-4 sm:p-5 md:p-6 relative"
            >
              {/* Notification Badge - Top Right */}
              {item.badge && item.badge > 0 && (
                <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                  <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center shadow-lg animate-pulse">
                    {item.badge}
                  </span>
                </div>
              )}
              
              <div className={`${item.color} w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-3 sm:mb-4`}>
                <item.icon className="text-white" size={20} />
              </div>
              <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 mb-1 sm:mb-2">{item.title}</h3>
              <p className="text-xs sm:text-sm text-gray-600">{item.description}</p>
            </div>
          ))}
          </div>
        </div>
      </main>

      {/* Beautiful Bottom Navigation Bar - Mobile Only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gradient-to-r from-gray-800 to-gray-900 shadow-lg z-50 border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-2">
          <div className="flex items-center justify-around h-16">
            {/* Dashboard */}
            <button
              onClick={() => router.push('/dashboard/client')}
              className="flex flex-col items-center px-3 py-2 text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <BarChart3 size={24} />
              <span className="text-xs mt-1 font-medium">Dashboard</span>
            </button>

            {/* Assignments */}
            <button
              onClick={() => router.push('/dashboard/client/assignments')}
              className="flex flex-col items-center px-3 py-2 text-gray-300 hover:text-white transition-colors relative"
            >
              <FileText size={24} />
              <span className="text-xs mt-1 font-medium">Assignments</span>
              {stats.myAssignments > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {stats.myAssignments}
                </span>
              )}
            </button>

            {/* Messages */}
            <button
              onClick={() => router.push('/dashboard/client/inbox')}
              className="flex flex-col items-center px-3 py-2 text-gray-300 hover:text-white transition-colors relative"
            >
              <MessageSquare size={24} />
              <span className="text-xs mt-1 font-medium">Messages</span>
              {stats.unreadMessages > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {stats.unreadMessages}
                </span>
              )}
            </button>

            {/* Alerts */}
            <button
              onClick={() => router.push('/dashboard/client/alerts')}
              className="flex flex-col items-center px-3 py-2 text-gray-300 hover:text-white transition-colors relative"
            >
              <Bell size={24} />
              <span className="text-xs mt-1 font-medium">Alerts</span>
              {(notificationCounts.messages + notificationCounts.appointments + notificationCounts.assignments) > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {notificationCounts.messages + notificationCounts.appointments + notificationCounts.assignments}
                </span>
              )}
            </button>

            {/* Profile */}
            <button
              onClick={() => router.push('/dashboard/client/profile')}
              className="flex flex-col items-center px-3 py-2 text-gray-300 hover:text-white transition-colors"
            >
              <Users size={24} />
              <span className="text-xs mt-1 font-medium">Profile</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}
