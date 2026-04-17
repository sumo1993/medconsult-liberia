'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, User, MessageSquare, Briefcase, DollarSign, Shield, FlaskConical, Bell, ClipboardList, X } from 'lucide-react';

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

const roleNavMap: Record<string, NavItem[]> = {
  admin: [
    { href: '/dashboard/admin', label: 'Home', icon: Home },
    { href: '/dashboard/admin/users', label: 'Users', icon: Shield },
    { href: '/dashboard/admin/messages', label: 'Messages', icon: MessageSquare },
    { href: '/dashboard/admin/profile', label: 'Profile', icon: User },
  ],
  management: [
    { href: '/dashboard/management', label: 'Home', icon: Home },
    { href: '/dashboard/management/assignments', label: 'Tasks', icon: Briefcase },
    { href: '/dashboard/management/messages', label: 'Messages', icon: MessageSquare },
    { href: '/dashboard/management/profile', label: 'Profile', icon: User },
  ],
  client: [
    { href: '/dashboard/client', label: 'Home', icon: Home },
    { href: '/dashboard/client/assignments', label: 'Tasks', icon: Briefcase },
    { href: '/dashboard/client/inbox', label: 'Inbox', icon: MessageSquare },
    { href: '/dashboard/client/profile', label: 'Profile', icon: User },
  ],
  consultant: [
    { href: '/dashboard/consultant', label: 'Home', icon: Home },
    { href: '/dashboard/consultant/assignments', label: 'Tasks', icon: Briefcase },
    { href: '/dashboard/consultant/messages', label: 'Messages', icon: MessageSquare },
    { href: '/dashboard/consultant/profile', label: 'Profile', icon: User },
  ],
  accountant: [
    { href: '/dashboard/accountant', label: 'Home', icon: Home },
    { href: '/dashboard/accountant', label: 'Finance', icon: DollarSign },
    { href: '/dashboard/accountant/messages', label: 'Messages', icon: MessageSquare },
    { href: '/dashboard/accountant/profile', label: 'Profile', icon: User },
  ],
  researcher: [
    { href: '/dashboard/researcher', label: 'Home', icon: Home },
    { href: '/dashboard/researcher/projects', label: 'Projects', icon: FlaskConical },
    { href: '/dashboard/researcher/messages', label: 'Messages', icon: MessageSquare },
    { href: '/dashboard/researcher/profile', label: 'Profile', icon: User },
  ],
  census: [
    { href: '/dashboard/field', label: 'Home', icon: Home },
    { href: '/dashboard/field/submissions', label: 'Reports', icon: ClipboardList },
    { href: '/dashboard/field/submit', label: 'Submit', icon: MessageSquare },
    { href: '/dashboard/field/profile', label: 'Profile', icon: User },
  ],
};

const roleSecondaryMap: Record<string, NavItem[]> = {
  admin: [
    { href: '/dashboard/admin/research-approvals', label: 'Approvals', icon: Briefcase },
    { href: '/dashboard/admin/partnerships', label: 'Partners', icon: Briefcase },
    { href: '/dashboard/admin/team', label: 'Team', icon: User },
    { href: '/dashboard/admin/direct-messages', label: 'Direct Messages', icon: MessageSquare },
  ],
  management: [
    { href: '/dashboard/management/assignment-requests', label: 'Requests', icon: Briefcase },
    { href: '/dashboard/management/clients', label: 'Clients', icon: User },
    { href: '/dashboard/management/materials', label: 'Materials', icon: Briefcase },
    { href: '/dashboard/management/direct-messages', label: 'Direct Messages', icon: MessageSquare },
  ],
  client: [
    { href: '/dashboard/client/alerts', label: 'Alerts', icon: Bell },
    { href: '/dashboard/client/payments', label: 'Payments', icon: DollarSign },
    { href: '/dashboard/client/settings', label: 'Settings', icon: User },
  ],
  consultant: [
    { href: '/dashboard/consultant/alerts', label: 'Alerts', icon: Bell },
    { href: '/dashboard/consultant/appointments', label: 'Appointments', icon: Briefcase },
    { href: '/dashboard/consultant/earnings', label: 'Earnings', icon: DollarSign },
  ],
  accountant: [
    { href: '/dashboard/accountant/profile', label: 'Profile', icon: User },
  ],
  researcher: [
    { href: '/dashboard/researcher/submissions', label: 'Submissions', icon: Briefcase },
    { href: '/dashboard/researcher/notifications', label: 'Alerts', icon: Bell },
    { href: '/dashboard/researcher/resources', label: 'Resources', icon: FlaskConical },
  ],
  census: [
    { href: '/dashboard/field/submit', label: 'Submit Report', icon: ClipboardList },
  ],
};

function inferRole(pathname: string): string | null {
  const parts = pathname.split('/').filter(Boolean);
  if (parts[0] !== 'dashboard') return null;
  let roleSegment = parts[1] || '';
  /** Field-worker routes use `/dashboard/field`; nav config key is still `census`. */
  if (roleSegment === 'field') roleSegment = 'census';
  if (roleSegment && roleNavMap[roleSegment]) {
    return roleSegment;
  }
  return null;
}

export default function DashboardMobileNav() {
  const pathname = usePathname();
  const role = inferRole(pathname);
  const [messageBadgeCount, setMessageBadgeCount] = useState(0);
  const [showMoreSheet, setShowMoreSheet] = useState(false);
  const roleSafe = role || '';
  const items = role ? roleNavMap[role] : [];
  const secondaryItems = role ? roleSecondaryMap[role] || [] : [];

  useEffect(() => {
    let ignore = false;

    async function loadBadge() {
      try {
        const token = localStorage.getItem('auth-token');
        if (!token) {
          if (!ignore) setMessageBadgeCount(0);
          return;
        }
        const headers: HeadersInit = { Authorization: `Bearer ${token}` };
        const response = await fetch('/api/notifications', { headers, cache: 'no-store' });
        if (response.status === 401) {
          if (!ignore) setMessageBadgeCount(0);
          return;
        }
        if (!response.ok) return;
        const data = await response.json();
        const counts = data?.counts || {};
        const seenSnapshot = (() => {
          try {
            const raw = localStorage.getItem(`notif_seen_snapshot_${role}`);
            return raw ? JSON.parse(raw) : {};
          } catch {
            return {};
          }
        })();
        const visible = {
          unreadAssignmentMessages: Math.max(0, Number(counts.unreadAssignmentMessages || 0) - Number(seenSnapshot.unreadAssignmentMessages || 0)),
          messages: Math.max(0, Number(counts.messages || 0) - Number(seenSnapshot.messages || 0)),
          appointments: Math.max(0, Number(counts.appointments || 0) - Number(seenSnapshot.appointments || 0)),
          assignments: Math.max(0, Number(counts.assignments || 0) - Number(seenSnapshot.assignments || 0)),
          donationInquiries: Math.max(0, Number(counts.donationInquiries || 0) - Number(seenSnapshot.donationInquiries || 0)),
          researchPosts: Math.max(0, Number(counts.researchPosts || 0) - Number(seenSnapshot.researchPosts || 0)),
          teamApplications: Math.max(0, Number(counts.teamApplications || 0) - Number(seenSnapshot.teamApplications || 0)),
          censusFieldApplications: Math.max(0, Number(counts.censusFieldApplications || 0) - Number(seenSnapshot.censusFieldApplications || 0)),
          directMessagesUnread: Math.max(0, Number(counts.directMessagesUnread || 0) - Number(seenSnapshot.directMessagesUnread || 0)),
          pendingResearchPapers: Math.max(0, Number(counts.pendingResearchPapers || 0) - Number(seenSnapshot.pendingResearchPapers || 0)),
        };
        const total =
          visible.unreadAssignmentMessages +
          visible.messages +
          visible.appointments +
          visible.assignments +
          visible.donationInquiries +
          visible.researchPosts +
          visible.teamApplications +
          visible.censusFieldApplications +
          visible.directMessagesUnread +
          visible.pendingResearchPapers;
        if (!ignore) {
          setMessageBadgeCount(total);
        }
      } catch {
        if (!ignore) setMessageBadgeCount(0);
      }
    }

    loadBadge();
    const interval = setInterval(loadBadge, 15000);
    const handleSeenUpdated = () => {
      loadBadge();
    };
    window.addEventListener('notifications:seen-updated', handleSeenUpdated as EventListener);
    window.addEventListener('storage', handleSeenUpdated);
    return () => {
      ignore = true;
      clearInterval(interval);
      window.removeEventListener('notifications:seen-updated', handleSeenUpdated as EventListener);
      window.removeEventListener('storage', handleSeenUpdated);
    };
  }, [roleSafe, role]);

  const badgeMatcher = useMemo(() => /(messages|inbox|alerts|notifications)/, []);

  if (!role) return null;

  return (
    <>
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white/95 backdrop-blur-sm">
      <div className="grid grid-cols-5">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          const showBadge = messageBadgeCount > 0 && (badgeMatcher.test(item.href) || badgeMatcher.test(item.label.toLowerCase()));

          return (
            <Link
              key={`${role}-${item.label}`}
              href={item.href}
              className={`relative flex flex-col items-center justify-center py-2.5 ${
                active ? 'text-emerald-700' : 'text-gray-500'
              }`}
            >
              <Icon size={20} />
              <span className="mt-1 text-[11px] font-medium leading-none">{item.label}</span>
              {showBadge && (
                <span className="absolute top-1.5 right-5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] leading-4 text-center font-semibold">
                  {messageBadgeCount > 99 ? '99+' : messageBadgeCount}
                </span>
              )}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setShowMoreSheet(true)}
          className="flex flex-col items-center justify-center py-2.5 text-gray-600"
        >
          <Bell size={20} />
          <span className="mt-1 text-[11px] font-medium leading-none">More</span>
        </button>
      </div>
    </nav>
    {showMoreSheet && (
      <div className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px]">
        <button
          type="button"
          aria-label="Close"
          className="absolute inset-0 w-full h-full"
          onClick={() => setShowMoreSheet(false)}
        />
        <div className="absolute bottom-0 left-0 right-0 rounded-t-2xl bg-white p-4 shadow-2xl">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">More</h3>
            <button
              type="button"
              onClick={() => setShowMoreSheet(false)}
              className="rounded-full p-1 text-gray-500 hover:bg-gray-100"
            >
              <X size={18} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 pb-4">
            {secondaryItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={`${role}-more-${item.label}`}
                  href={item.href}
                  onClick={() => setShowMoreSheet(false)}
                  className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700"
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    )}
    </>
  );
}
