'use client';

import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { Wifi, WifiOff, CloudOff, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function OnlineStatusIndicator() {
  const { isOnline, wasOffline } = useOnlineStatus();
  const [showSyncMessage, setShowSyncMessage] = useState(false);
  const [pendingItems, setPendingItems] = useState(0);

  useEffect(() => {
    // Check for pending items in localStorage
    const checkPending = () => {
      try {
        const pending = localStorage.getItem('pendingSubmissions');
        if (pending) {
          const items = JSON.parse(pending);
          setPendingItems(Array.isArray(items) ? items.length : 0);
        }
      } catch {
        setPendingItems(0);
      }
    };

    checkPending();
    window.addEventListener('storage', checkPending);
    return () => window.removeEventListener('storage', checkPending);
  }, []);

  useEffect(() => {
    if (isOnline && wasOffline) {
      setShowSyncMessage(true);
      setTimeout(() => setShowSyncMessage(false), 3000);
    }
  }, [isOnline, wasOffline]);

  if (isOnline && !showSyncMessage && pendingItems === 0) {
    return null;
  }

  return (
    <div className={`fixed bottom-20 md:bottom-4 left-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg text-sm font-medium transition-all ${
      !isOnline 
        ? 'bg-red-100 text-red-800 border border-red-200' 
        : showSyncMessage 
          ? 'bg-green-100 text-green-800 border border-green-200'
          : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
    }`}>
      {!isOnline ? (
        <>
          <WifiOff size={18} />
          <span>Offline - Data will sync when connected</span>
          {pendingItems > 0 && (
            <span className="bg-red-200 px-2 py-0.5 rounded-full text-xs">
              {pendingItems} pending
            </span>
          )}
        </>
      ) : showSyncMessage ? (
        <>
          <RefreshCw size={18} className="animate-spin" />
          <span>Back online - Syncing data...</span>
        </>
      ) : pendingItems > 0 ? (
        <>
          <CloudOff size={18} />
          <span>{pendingItems} items pending sync</span>
        </>
      ) : null}
    </div>
  );
}


