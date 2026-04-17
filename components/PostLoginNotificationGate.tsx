'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Bell, ArrowRight } from 'lucide-react';

export const POST_LOGIN_GATE_KEY = 'medconsult_post_login_gate';

export type PostLoginGateRole = 'admin' | 'management' | 'consultant' | 'researcher' | 'accountant';

export interface PostLoginCounts {
  messages: number;
  appointments: number;
  assignments: number;
  donationInquiries: number;
  researchPosts: number;
  unreadAssignmentMessages: number;
  teamApplications: number;
  censusFieldApplications: number;
  directMessagesUnread: number;
  pendingResearchPapers: number;
}

type CountKey = keyof PostLoginCounts;

const LABELS: Record<CountKey, string> = {
  messages: 'Contact messages',
  appointments: 'Pending appointments',
  assignments: 'Assignment requests awaiting review',
  donationInquiries: 'Pending donation inquiries',
  researchPosts: 'Research drafts to review',
  unreadAssignmentMessages: 'Unread assignment conversations',
  teamApplications: 'Team applications to review',
  censusFieldApplications: 'Census / field applications',
  directMessagesUnread: 'Unread direct messages',
  pendingResearchPapers: 'Research papers pending approval',
};

function shouldSkipKey(role: PostLoginGateRole, key: CountKey): boolean {
  if ((role === 'admin' || role === 'management') && key === 'messages') {
    return true;
  }
  return false;
}

function hrefFor(role: PostLoginGateRole, key: CountKey): string {
  const base: Record<PostLoginGateRole, string> = {
    admin: '/dashboard/admin',
    management: '/dashboard/management',
    consultant: '/dashboard/consultant',
    researcher: '/dashboard/researcher',
    accountant: '/dashboard/accountant',
  };

  if (role === 'admin') {
    const map: Partial<Record<CountKey, string>> = {
      messages: '/dashboard/admin/messages',
      appointments: '/dashboard/admin/appointments',
      assignments: '/dashboard/admin/assignments',
      donationInquiries: '/dashboard/admin/donation-inquiries',
      researchPosts: '/dashboard/admin/research',
      unreadAssignmentMessages: '/dashboard/admin/assignments',
      teamApplications: '/dashboard/admin/team-applications',
      censusFieldApplications: '/dashboard/admin/census-field-applications',
      directMessagesUnread: '/dashboard/admin/direct-messages',
      pendingResearchPapers: '/dashboard/admin/research-approvals',
    };
    return map[key] || base.admin;
  }
  if (role === 'management') {
    const map: Partial<Record<CountKey, string>> = {
      messages: '/dashboard/management/messages',
      appointments: '/dashboard/management/appointments',
      assignments: '/dashboard/management/assignment-requests',
      donationInquiries: '/dashboard/management/donation-inquiries',
      researchPosts: '/dashboard/management/research',
      unreadAssignmentMessages: '/dashboard/management/assignment-requests',
      teamApplications: '/dashboard/management/team-applications',
      censusFieldApplications: '/dashboard/management/census-field-applications',
      directMessagesUnread: '/dashboard/management/direct-messages',
      pendingResearchPapers: '/dashboard/management/research-approvals',
    };
    return (map[key] ?? base.management) as string;
  }
  if (role === 'consultant') {
    const map: Partial<Record<CountKey, string>> = {
      appointments: '/dashboard/consultant/appointments',
      assignments: '/dashboard/consultant/assignments',
      donationInquiries: '/dashboard/consultant',
      researchPosts: '/dashboard/consultant/my-research',
      unreadAssignmentMessages: '/dashboard/consultant/assignments',
      directMessagesUnread: '/dashboard/consultant/messages',
    };
    return map[key] || base.consultant;
  }
  if (role === 'researcher') {
    const map: Partial<Record<CountKey, string>> = {
      assignments: '/dashboard/researcher/notifications',
      donationInquiries: '/dashboard/researcher/notifications',
      researchPosts: '/dashboard/researcher/my-research',
      directMessagesUnread: '/dashboard/researcher/messages',
    };
    return map[key] || base.researcher;
  }
  const map: Partial<Record<CountKey, string>> = {
    assignments: '/dashboard/accountant',
    donationInquiries: '/dashboard/accountant',
    directMessagesUnread: '/dashboard/accountant/direct-messages',
  };
  return map[key] || base.accountant;
}

function buildItems(role: PostLoginGateRole, counts: PostLoginCounts) {
  const keys = Object.keys(counts) as CountKey[];
  return keys
    .filter((k) => !shouldSkipKey(role, k))
    .filter((k) => Number(counts[k] || 0) > 0)
    .map((k) => ({
      key: k,
      label: LABELS[k],
      count: Number(counts[k] || 0),
      href: hrefFor(role, k),
    }));
}

function totalPending(role: PostLoginGateRole, counts: PostLoginCounts): number {
  return buildItems(role, counts).reduce((s, i) => s + i.count, 0);
}

interface PostLoginNotificationGateProps {
  role: PostLoginGateRole;
  loading: boolean;
  counts: PostLoginCounts;
}

export default function PostLoginNotificationGate({ role, loading, counts }: PostLoginNotificationGateProps) {
  const [gateArmed, setGateArmed] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      setGateArmed(sessionStorage.getItem(POST_LOGIN_GATE_KEY) === '1');
    } catch {
      setGateArmed(false);
    }
  }, []);

  const items = useMemo(() => buildItems(role, counts), [role, counts]);

  useEffect(() => {
    if (!gateArmed || loading) return;
    const n = totalPending(role, counts);
    if (n > 0) {
      setOpen(true);
    } else {
      try {
        sessionStorage.removeItem(POST_LOGIN_GATE_KEY);
      } catch {}
    }
  }, [gateArmed, loading, role, counts]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const dismiss = () => {
    try {
      sessionStorage.removeItem(POST_LOGIN_GATE_KEY);
    } catch {}
    setOpen(false);
  };

  if (!open || items.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="post-login-gate-title"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20">
              <Bell className="h-6 w-6" aria-hidden />
            </div>
            <div>
              <h2 id="post-login-gate-title" className="text-lg font-bold tracking-tight">
                While you were away
              </h2>
              <p className="text-sm text-emerald-100 mt-0.5">
                New items need your attention before you continue.
              </p>
            </div>
          </div>
        </div>

        <div className="max-h-[min(55vh,420px)] overflow-y-auto px-6 py-4">
          <ul className="space-y-2">
            {items.map((row) => (
              <li key={row.key}>
                <Link
                  href={row.href}
                  onClick={dismiss}
                  className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3 text-left transition hover:border-emerald-200 hover:bg-emerald-50/50"
                >
                  <span className="text-sm font-medium text-gray-800">{row.label}</span>
                  <span className="flex-shrink-0 rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-bold text-white">
                    {row.count > 99 ? '99+' : row.count}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-gray-100 bg-gray-50 px-6 py-4">
          <button
            type="button"
            onClick={dismiss}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-700"
          >
            Continue to dashboard
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
