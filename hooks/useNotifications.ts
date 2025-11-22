import { useState, useEffect, useRef } from 'react';

interface NotificationCounts {
  messages: number;
  appointments: number;
  assignments: number;
  donationInquiries: number;
  researchPosts: number;
  unreadAssignmentMessages: number;
}

export function useNotifications(role: 'admin' | 'management' | 'client' | 'consultant' | 'researcher') {
  const [counts, setCounts] = useState<NotificationCounts>({
    messages: 0,
    appointments: 0,
    assignments: 0,
    donationInquiries: 0,
    researchPosts: 0,
    unreadAssignmentMessages: 0,
  });
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/notifications', {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCounts(data.counts);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch immediately
    fetchNotifications();

    // Poll for updates every 10 seconds (more real-time)
    intervalRef.current = setInterval(fetchNotifications, 10000);

    // Pause polling when tab is hidden, resume when visible
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab is hidden, clear interval
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        // Tab is visible, fetch immediately and restart interval
        fetchNotifications();
        if (!intervalRef.current) {
          intervalRef.current = setInterval(fetchNotifications, 10000);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [role]);

  return { counts, loading, refresh: fetchNotifications };
}
