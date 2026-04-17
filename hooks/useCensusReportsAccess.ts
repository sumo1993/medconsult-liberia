'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Gate = 'loading' | 'ok' | 'blocked';

/** After role auth, verifies server-side census-reports access (admin/CEO blocks). */
export function useCensusReportsAccess(isAuthorized: boolean) {
  const router = useRouter();
  const [gate, setGate] = useState<Gate>('loading');
  const [navHome, setNavHome] = useState('/dashboard/researcher');
  const [navProfile, setNavProfile] = useState('/dashboard/researcher/profile');
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthorized) return;
    let cancelled = false;
    (async () => {
      try {
        const token = localStorage.getItem('auth-token');
        const res = await fetch('/api/census-reports/access', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          cache: 'no-store',
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setGate('blocked');
          router.replace('/dashboard/researcher');
          return;
        }
        if (data.blocked_for_me) {
          setGate('blocked');
          router.replace(String(data.home_dashboard || '/dashboard/researcher'));
          return;
        }
        setNavHome(String(data.home_dashboard || '/dashboard/researcher'));
        setNavProfile(String(data.profile_path || '/dashboard/researcher/profile'));
        setRole(typeof data.role === 'string' ? data.role : null);
        setGate('ok');
      } catch {
        if (!cancelled) {
          setGate('blocked');
          router.replace('/dashboard/researcher');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthorized, router]);

  return { gate, navHome, navProfile, role };
}
