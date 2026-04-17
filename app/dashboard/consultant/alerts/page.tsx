'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, ArrowLeft, FileText, MessageSquare } from 'lucide-react';
import PaginationControls from '@/components/PaginationControls';
import { useNotifications } from '@/hooks/useNotifications';

type Notification = {
  id: number;
  type: 'assignment' | 'message';
  title: string;
  message: string;
  link: string;
  created_at: string;
  is_read: boolean;
};

export default function ConsultantAlertsPage() {
  const router = useRouter();
  const { markCategorySeen } = useNotifications('consultant');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('auth-token');
        const response = await fetch('/api/consultant/notifications', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (response.ok) {
          const data = await response.json();
          let readSet = new Set<string>();
          try {
            const raw = localStorage.getItem('consultant_notification_reads');
            const parsed = raw ? JSON.parse(raw) : [];
            readSet = new Set<string>(Array.isArray(parsed) ? parsed : []);
          } catch {}
          const normalized = (Array.isArray(data) ? data : []).map((n: Notification) =>
            readSet.has(String(n.id)) ? { ...n, is_read: true } : n
          );
          setNotifications(normalized);
        } else {
          setNotifications([]);
        }
      } catch (error) {
        console.error('Error fetching consultant notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const markLocalAsRead = (notification: Notification) => {
    setNotifications(prev =>
      prev.map(n => (n.id === notification.id ? { ...n, is_read: true } : n))
    );
    try {
      const raw = localStorage.getItem('consultant_notification_reads');
      const parsed = raw ? JSON.parse(raw) : [];
      const set = new Set<string>(Array.isArray(parsed) ? parsed : []);
      set.add(String(notification.id));
      localStorage.setItem('consultant_notification_reads', JSON.stringify(Array.from(set)));
    } catch {}
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const filtered = filter === 'unread' ? notifications.filter((n) => !n.is_read) : notifications;
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, notifications]);

  const getIcon = (type: Notification['type']) => {
    if (type === 'message') return <MessageSquare className="text-green-600" size={22} />;
    if (type === 'appointment') return <Bell className="text-purple-600" size={22} />;
    return <FileText className="text-blue-600" size={22} />;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-gradient-to-r from-emerald-600 to-teal-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push('/dashboard/consultant')} className="text-white hover:text-emerald-100 p-2">
                <ArrowLeft size={22} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">Consultant Alerts</h1>
                <p className="text-emerald-100 text-sm">{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}</p>
              </div>
            </div>
            <Bell className="text-white" size={24} />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-4 flex gap-2">
          <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg font-semibold ${filter === 'all' ? 'bg-emerald-600 text-white' : 'bg-white border'}`}>
            All ({notifications.length})
          </button>
          <button onClick={() => setFilter('unread')} className={`px-4 py-2 rounded-lg font-semibold ${filter === 'unread' ? 'bg-emerald-600 text-white' : 'bg-white border'}`}>
            Unread ({unreadCount})
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-600">Loading alerts...</div>
        ) : paginated.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-500">No notifications found.</div>
        ) : (
          <div className="space-y-3">
            {paginated.map((n) => (
              <button
                key={`${n.id}-${n.created_at}`}
                onClick={() => {
                  if (!n.is_read) {
                    markLocalAsRead(n);
                    if (n.type === 'message') markCategorySeen('messages');
                    if (n.type === 'assignment') markCategorySeen('assignments');
                    if (n.type === 'appointment') markCategorySeen('appointments');
                  }
                  router.push(n.link);
                }}
                className={`w-full text-left bg-white rounded-lg shadow-sm p-4 border-l-4 transition-shadow hover:shadow-md ${n.is_read ? 'border-gray-300' : 'border-emerald-500'}`}
              >
                <div className="flex items-start gap-3">
                  {getIcon(n.type)}
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{n.title}</p>
                    <p className="text-sm text-gray-600">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                  </div>
                </div>
              </button>
            ))}
            <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        )}
      </main>
    </div>
  );
}
