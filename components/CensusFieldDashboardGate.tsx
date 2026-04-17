'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useRoleRedirect } from '@/hooks/useRoleRedirect';

export default function CensusFieldDashboardGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthorized, isLoading: roleLoading } = useRoleRedirect('census');
  const [checking, setChecking] = useState(true);

  const onBlockedPage = Boolean(pathname?.startsWith('/dashboard/field/blocked'));

  useEffect(() => {
    if (roleLoading || !isAuthorized) return;
    if (onBlockedPage) {
      setChecking(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const token = localStorage.getItem('auth-token');
        const res = await fetch('/api/census/field-access/me', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          cache: 'no-store',
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (data?.blocked === true) {
          router.replace('/dashboard/field/blocked');
          return;
        }
      } catch {
        /* keep dashboard usable on transient errors */
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthorized, roleLoading, onBlockedPage, router]);

  if (roleLoading || (!onBlockedPage && checking)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-4 border-emerald-200 border-t-emerald-700 animate-spin" />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-4 border-emerald-200 border-t-emerald-700 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
