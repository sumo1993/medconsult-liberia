import { useState, useEffect, useRef, useCallback } from 'react';

interface NotificationCounts {
  messages: number;
  appointments: number;
  assignments: number;
  donationInquiries: number;
  researchPosts: number;
  unreadAssignmentMessages: number;
  /** Team (/apply-team) applications awaiting review */
  teamApplications: number;
  /** Census / field applications awaiting review */
  censusFieldApplications: number;
  /** Unread direct messages where current user is receiver */
  directMessagesUnread: number;
  /** Research papers submitted for approval (research_posts.status = pending) */
  pendingResearchPapers: number;
}

type NotificationKey = keyof NotificationCounts;

export function useNotifications(role: 'admin' | 'management' | 'client' | 'consultant' | 'researcher' | 'census' | 'accountant') {
  const storageKey = `notif_seen_snapshot_${role}`;
  const [rawCounts, setRawCounts] = useState<NotificationCounts>({
    messages: 0,
    appointments: 0,
    assignments: 0,
    donationInquiries: 0,
    researchPosts: 0,
    unreadAssignmentMessages: 0,
    teamApplications: 0,
    censusFieldApplications: 0,
    directMessagesUnread: 0,
    pendingResearchPapers: 0,
  });
  const [counts, setCounts] = useState<NotificationCounts>({
    messages: 0,
    appointments: 0,
    assignments: 0,
    donationInquiries: 0,
    researchPosts: 0,
    unreadAssignmentMessages: 0,
    teamApplications: 0,
    censusFieldApplications: 0,
    directMessagesUnread: 0,
    pendingResearchPapers: 0,
  });
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const rawCountsRef = useRef<NotificationCounts>({
    messages: 0,
    appointments: 0,
    assignments: 0,
    donationInquiries: 0,
    researchPosts: 0,
    unreadAssignmentMessages: 0,
    teamApplications: 0,
    censusFieldApplications: 0,
    directMessagesUnread: 0,
    pendingResearchPapers: 0,
  });
  const countsRef = useRef<NotificationCounts>({
    messages: 0,
    appointments: 0,
    assignments: 0,
    donationInquiries: 0,
    researchPosts: 0,
    unreadAssignmentMessages: 0,
    teamApplications: 0,
    censusFieldApplications: 0,
    directMessagesUnread: 0,
    pendingResearchPapers: 0,
  });
  const seenSnapshotRef = useRef<NotificationCounts>({
    messages: 0,
    appointments: 0,
    assignments: 0,
    donationInquiries: 0,
    researchPosts: 0,
    unreadAssignmentMessages: 0,
    teamApplications: 0,
    censusFieldApplications: 0,
    directMessagesUnread: 0,
    pendingResearchPapers: 0,
  });

  const persistSeenSnapshot = useCallback((seen: NotificationCounts) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(seen));
    } catch {}
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('notifications:seen-updated', { detail: { role } }));
    }
  }, [role, storageKey]);

  const clampSubtract = useCallback((current: NotificationCounts, seen: NotificationCounts): NotificationCounts => ({
    messages: Math.max(0, current.messages - seen.messages),
    appointments: Math.max(0, current.appointments - seen.appointments),
    assignments: Math.max(0, current.assignments - seen.assignments),
    donationInquiries: Math.max(0, current.donationInquiries - seen.donationInquiries),
    researchPosts: Math.max(0, current.researchPosts - seen.researchPosts),
    unreadAssignmentMessages: Math.max(0, current.unreadAssignmentMessages - seen.unreadAssignmentMessages),
    teamApplications: Math.max(0, current.teamApplications - seen.teamApplications),
    censusFieldApplications: Math.max(0, current.censusFieldApplications - seen.censusFieldApplications),
    directMessagesUnread: Math.max(0, current.directMessagesUnread - seen.directMessagesUnread),
    pendingResearchPapers: Math.max(0, current.pendingResearchPapers - seen.pendingResearchPapers),
  }), []);

  const loadSeenSnapshot = useCallback((): NotificationCounts => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) {
        return seenSnapshotRef.current;
      }
      const parsed = JSON.parse(saved);
      return {
        messages: Number(parsed.messages || 0),
        appointments: Number(parsed.appointments || 0),
        assignments: Number(parsed.assignments || 0),
        donationInquiries: Number(parsed.donationInquiries || 0),
        researchPosts: Number(parsed.researchPosts || 0),
        unreadAssignmentMessages: Number(parsed.unreadAssignmentMessages || 0),
        teamApplications: Number(parsed.teamApplications || 0),
        censusFieldApplications: Number(parsed.censusFieldApplications || 0),
        directMessagesUnread: Number(parsed.directMessagesUnread || 0),
        pendingResearchPapers: Number(parsed.pendingResearchPapers || 0),
      };
    } catch {
      return seenSnapshotRef.current;
    }
  }, [storageKey]);

  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth-token');
      if (!token) {
        setLoading(false);
        setRawCounts({
          messages: 0,
          appointments: 0,
          assignments: 0,
          donationInquiries: 0,
          researchPosts: 0,
          unreadAssignmentMessages: 0,
          teamApplications: 0,
          censusFieldApplications: 0,
          directMessagesUnread: 0,
          pendingResearchPapers: 0,
        });
        setCounts({
          messages: 0,
          appointments: 0,
          assignments: 0,
          donationInquiries: 0,
          researchPosts: 0,
          unreadAssignmentMessages: 0,
          teamApplications: 0,
          censusFieldApplications: 0,
          directMessagesUnread: 0,
          pendingResearchPapers: 0,
        });
        return;
      }
      const response = await fetch('/api/notifications', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const incoming: NotificationCounts = {
          messages: Number(data?.counts?.messages || 0),
          appointments: Number(data?.counts?.appointments || 0),
          assignments: Number(data?.counts?.assignments || 0),
          donationInquiries: Number(data?.counts?.donationInquiries || 0),
          researchPosts: Number(data?.counts?.researchPosts || 0),
          unreadAssignmentMessages: Number(data?.counts?.unreadAssignmentMessages || 0),
          teamApplications: Number(data?.counts?.teamApplications || 0),
          censusFieldApplications: Number(data?.counts?.censusFieldApplications || 0),
          directMessagesUnread: Number(data?.counts?.directMessagesUnread || 0),
          pendingResearchPapers: Number(data?.counts?.pendingResearchPapers || 0),
        };
        setRawCounts(incoming);
        rawCountsRef.current = incoming;
        const latestSeenSnapshot = loadSeenSnapshot();
        // Auto-correct: cap each seen value to the raw value so stale snapshots
        // (e.g. from a previous API that counted differently) don't suppress counts.
        const corrected: NotificationCounts = {
          messages: Math.min(latestSeenSnapshot.messages, incoming.messages),
          appointments: Math.min(latestSeenSnapshot.appointments, incoming.appointments),
          assignments: Math.min(latestSeenSnapshot.assignments, incoming.assignments),
          donationInquiries: Math.min(latestSeenSnapshot.donationInquiries, incoming.donationInquiries),
          researchPosts: Math.min(latestSeenSnapshot.researchPosts, incoming.researchPosts),
          unreadAssignmentMessages: Math.min(latestSeenSnapshot.unreadAssignmentMessages, incoming.unreadAssignmentMessages),
          teamApplications: Math.min(latestSeenSnapshot.teamApplications, incoming.teamApplications),
          censusFieldApplications: Math.min(latestSeenSnapshot.censusFieldApplications, incoming.censusFieldApplications),
          directMessagesUnread: Math.min(latestSeenSnapshot.directMessagesUnread, incoming.directMessagesUnread),
          pendingResearchPapers: Math.min(latestSeenSnapshot.pendingResearchPapers, incoming.pendingResearchPapers),
        };
        seenSnapshotRef.current = corrected;
        if (JSON.stringify(corrected) !== JSON.stringify(latestSeenSnapshot)) {
          persistSeenSnapshot(corrected);
        }
        const visibleCounts = clampSubtract(incoming, corrected);
        countsRef.current = visibleCounts;
        setCounts(visibleCounts);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [clampSubtract, loadSeenSnapshot]);

  useEffect(() => {
    seenSnapshotRef.current = loadSeenSnapshot();

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
  }, [role, fetchNotifications, loadSeenSnapshot]);

  useEffect(() => {
    rawCountsRef.current = rawCounts;
  }, [rawCounts]);

  useEffect(() => {
    countsRef.current = counts;
  }, [counts]);

  const markAllSeen = useCallback(() => {
    // Use the currently visible totals to avoid race conditions with async fetch state updates.
    const visibleCounts = countsRef.current;
    const seenNow: NotificationCounts = {
      messages: seenSnapshotRef.current.messages + visibleCounts.messages,
      appointments: seenSnapshotRef.current.appointments + visibleCounts.appointments,
      assignments: seenSnapshotRef.current.assignments + visibleCounts.assignments,
      donationInquiries: seenSnapshotRef.current.donationInquiries + visibleCounts.donationInquiries,
      researchPosts: seenSnapshotRef.current.researchPosts + visibleCounts.researchPosts,
      unreadAssignmentMessages: seenSnapshotRef.current.unreadAssignmentMessages + visibleCounts.unreadAssignmentMessages,
      teamApplications: seenSnapshotRef.current.teamApplications + visibleCounts.teamApplications,
      censusFieldApplications: seenSnapshotRef.current.censusFieldApplications + visibleCounts.censusFieldApplications,
      directMessagesUnread: seenSnapshotRef.current.directMessagesUnread + visibleCounts.directMessagesUnread,
      pendingResearchPapers: seenSnapshotRef.current.pendingResearchPapers + visibleCounts.pendingResearchPapers,
    };
    seenSnapshotRef.current = seenNow;
    countsRef.current = clampSubtract(seenNow, seenNow);
    persistSeenSnapshot(seenNow);
    setCounts(countsRef.current);
  }, [clampSubtract, persistSeenSnapshot]);

  const markCategorySeen = useCallback((category: NotificationKey, amount?: number) => {
    const visibleForCategory = countsRef.current[category];
    const increment = Math.max(
      0,
      Math.min(
        visibleForCategory,
        typeof amount === 'number' && Number.isFinite(amount) ? amount : visibleForCategory
      )
    );
    const seenNow: NotificationCounts = {
      ...seenSnapshotRef.current,
      [category]: seenSnapshotRef.current[category] + increment,
    };
    seenSnapshotRef.current = seenNow;
    persistSeenSnapshot(seenNow);
    const visibleCounts = clampSubtract(rawCountsRef.current, seenNow);
    countsRef.current = visibleCounts;
    setCounts(visibleCounts);
  }, [clampSubtract, persistSeenSnapshot]);

  return { counts, loading, refresh: fetchNotifications, markAllSeen, markCategorySeen, rawCounts };
}
