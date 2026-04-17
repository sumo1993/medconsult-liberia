'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Bell, CheckCircle, Clock, AlertTriangle, 
  MessageSquare, FileText, Award, Target, Trash2, CheckCheck
} from 'lucide-react';
import ProfileAvatar from '@/components/ProfileAvatar';
import PaginationControls from '@/components/PaginationControls';
import { useNotifications } from '@/hooks/useNotifications';

interface Notification {
  id: number;
  type: 'success' | 'warning' | 'info' | 'achievement' | 'deadline' | 'message';
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
  action_url?: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { markCategorySeen } = useNotifications('researcher');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    fetchNotifications();
  }, []);

  const getNotificationKey = (n: Notification) =>
    n.id > 0 ? `id:${n.id}` : `${n.type}|${n.title}|${n.message}|${n.action_url || ''}`;

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/researcher/notifications', {
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      if (response.ok) {
        const data = await response.json();
        let readSet = new Set<string>();
        try {
          const raw = localStorage.getItem('researcher_notification_reads');
          const parsed = raw ? JSON.parse(raw) : [];
          readSet = new Set<string>(Array.isArray(parsed) ? parsed : []);
        } catch {}
        const normalized = (Array.isArray(data) ? data : []).map((n: Notification) =>
          readSet.has(getNotificationKey(n)) ? { ...n, is_read: true } : n
        );
        setNotifications(normalized);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      const token = localStorage.getItem('auth-token');
      await fetch(`/api/researcher/notifications/${id}/read`, {
        method: 'POST',
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markLocalAsRead = (notification: Notification) => {
    const key = getNotificationKey(notification);
    setNotifications(prev =>
      prev.map(n => (getNotificationKey(n) === key ? { ...n, is_read: true } : n))
    );
    try {
      const raw = localStorage.getItem('researcher_notification_reads');
      const parsed = raw ? JSON.parse(raw) : [];
      const set = new Set<string>(Array.isArray(parsed) ? parsed : []);
      set.add(key);
      localStorage.setItem('researcher_notification_reads', JSON.stringify(Array.from(set)));
    } catch {}
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      await fetch('/api/researcher/notifications/read-all', {
        method: 'POST',
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      try {
        const allKeys = notifications.map(getNotificationKey);
        localStorage.setItem('researcher_notification_reads', JSON.stringify(allKeys));
      } catch {}
      markCategorySeen('messages');
      markCategorySeen('appointments');
      markCategorySeen('assignments');
      markCategorySeen('researchPosts');
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="text-green-500" size={24} />;
      case 'warning': return <AlertTriangle className="text-yellow-500" size={24} />;
      case 'achievement': return <Award className="text-purple-500" size={24} />;
      case 'deadline': return <Clock className="text-red-500" size={24} />;
      case 'message': return <MessageSquare className="text-blue-500" size={24} />;
      default: return <Bell className="text-gray-500" size={24} />;
    }
  };

  const getBgColor = (type: string, isRead: boolean) => {
    if (isRead) return 'bg-white';
    switch (type) {
      case 'success': return 'bg-green-50';
      case 'warning': return 'bg-yellow-50';
      case 'achievement': return 'bg-purple-50';
      case 'deadline': return 'bg-red-50';
      case 'message': return 'bg-blue-50';
      default: return 'bg-gray-50';
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.is_read;
    return n.type === filter;
  });
  const sortedNotifications = [...filteredNotifications].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const totalPages = Math.max(1, Math.ceil(sortedNotifications.length / itemsPerPage));
  const paginatedNotifications = sortedNotifications.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    setCurrentPage(1);
  }, [notifications, filter]);

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
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  Notifications
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </h1>
                <p className="text-sm text-gray-600">Stay updated on your research</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="px-3 py-2 text-sm text-emerald-600 hover:bg-emerald-50 rounded-lg flex items-center gap-1"
                >
                  <CheckCheck size={16} />
                  Mark all read
                </button>
              )}
              <ProfileAvatar onClick={() => router.push('/dashboard/researcher/profile')} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { value: 'all', label: 'All' },
            { value: 'unread', label: 'Unread' },
            { value: 'success', label: 'Approvals' },
            { value: 'deadline', label: 'Deadlines' },
            { value: 'achievement', label: 'Achievements' },
            { value: 'message', label: 'Messages' },
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filter === tab.value
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading notifications...</p>
          </div>
        ) : sortedNotifications.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <Bell className="mx-auto mb-4 text-gray-300" size={64} />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Notifications</h3>
            <p className="text-gray-600">
              {filter === 'unread' 
                ? "You're all caught up! No unread notifications."
                : "You don't have any notifications yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {paginatedNotifications.map((notification) => (
              <div
                key={notification.id}
                onClick={async () => {
                  if (!notification.is_read) {
                    markLocalAsRead(notification);
                    if (notification.type === 'message') markCategorySeen('messages');
                    if (notification.type === 'deadline') markCategorySeen('appointments');
                    if (notification.type === 'info') markCategorySeen('researchPosts');
                    if (notification.type === 'success' || notification.type === 'achievement' || notification.type === 'warning') {
                      markCategorySeen('assignments');
                    }
                    if (notification.id > 0) {
                      await markAsRead(notification.id);
                    }
                  }
                  if (notification.action_url) router.push(notification.action_url);
                }}
                className={`${getBgColor(notification.type, notification.is_read)} rounded-xl p-4 shadow-sm cursor-pointer hover:shadow-md transition-all`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className={`font-semibold text-gray-900 ${!notification.is_read ? 'font-bold' : ''}`}>
                        {notification.title}
                      </h4>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {new Date(notification.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                    {notification.action_url && (
                      <p className="text-sm text-emerald-600 mt-2 flex items-center gap-1">
                        View details →
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </main>
    </div>
  );
}
