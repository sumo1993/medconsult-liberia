'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const roleDashboardMap: Record<string, string> = {
  admin: '/dashboard/admin',
  management: '/dashboard/management',
  accountant: '/dashboard/accountant',
  consultant: '/dashboard/consultant',
  researcher: '/dashboard/researcher',
  client: '/dashboard/client',
  census: '/dashboard/field',
};

/** Shared census reports UI — researchers, admins, and management (CEO) use the same URL. */
const CENSUS_REPORTS_PATH = /^\/dashboard\/researcher\/census-reports(\/|$)/;

function inferExpectedRole(pathname: string): string | null {
  const parts = pathname.split('/').filter(Boolean);
  if (parts[0] !== 'dashboard') return null;
  let roleSegment = parts[1] || '';
  /** Field-worker UI lives under `/dashboard/field`; DB role remains `census`. */
  if (roleSegment === 'field') roleSegment = 'census';
  return roleDashboardMap[roleSegment] ? roleSegment : null;
}

export default function DashboardAccessGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const expectedRole = useMemo(() => inferExpectedRole(pathname), [pathname]);

  useEffect(() => {
    let cancelled = false;

    async function validateSession() {
      try {
        const token = localStorage.getItem('auth-token');
        if (!token) {
          setHasAccess(false);
          router.replace('/login');
          return;
        }

        // Allow dashboard to render immediately while we verify in background.
        setHasAccess(true);
        setChecking(false);

        const response = await fetch('/api/auth/validate-session', {
          cache: 'no-store',
          credentials: 'include',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401 || response.status === 403) {
          if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('auth-token');
            localStorage.removeItem('user');
          }
          setHasAccess(false);
          router.replace('/login');
          return;
        }

        // For transient server issues, keep user on page and avoid logout loops.
        if (!response.ok) {
          return;
        }

        const data = await response.json();
        const actualRole = data?.user?.role;

        if (!expectedRole || !actualRole) {
          setHasAccess(true);
          return;
        }

        if (CENSUS_REPORTS_PATH.test(pathname) && ['researcher', 'admin', 'management'].includes(actualRole)) {
          setHasAccess(true);
          return;
        }

        if (expectedRole !== actualRole) {
          setHasAccess(false);
          router.replace(roleDashboardMap[actualRole] || '/login');
        } else {
          setHasAccess(true);
        }
      } catch {
        // Network/dev transient - do not force logout.
        setHasAccess(true);
      } finally {
        if (!cancelled) {
          setChecking(false);
        }
      }
    }

    validateSession();

    return () => {
      cancelled = true;
    };
  }, [expectedRole, router, pathname]);

  if (checking || !hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-4 border-emerald-200 border-t-emerald-700 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
