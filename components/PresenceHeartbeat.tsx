'use client';

import { useEffect } from 'react';

export default function PresenceHeartbeat() {
  useEffect(() => {
    let stopped = false;

    const ping = async () => {
      if (stopped) return;
      try {
        const token = localStorage.getItem('auth-token');
        if (!token) return;
        await fetch('/api/presence', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
          keepalive: true,
        });
      } catch {}
    };

    ping();
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        ping();
      }
    }, 30000);

    const handleVisible = () => {
      if (document.visibilityState === 'visible') {
        ping();
      }
    };

    document.addEventListener('visibilitychange', handleVisible);
    window.addEventListener('focus', handleVisible);

    return () => {
      stopped = true;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisible);
      window.removeEventListener('focus', handleVisible);
    };
  }, []);

  return null;
}
