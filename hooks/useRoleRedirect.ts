'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

// Map roles to their correct dashboard paths
const roleDashboardMap: Record<string, string> = {
  admin: '/dashboard/admin',
  management: '/dashboard/management',
  accountant: '/dashboard/accountant',
  consultant: '/dashboard/consultant',
  researcher: '/dashboard/researcher',
  client: '/dashboard/client',
};

export function useRoleRedirect(expectedRole: string | string[]) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkRole = async () => {
      try {
        const token = localStorage.getItem('auth-token');
        if (!token) {
          router.push('/login');
          return;
        }

        // Fetch current user role from API
        const response = await fetch('/api/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          router.push('/login');
          return;
        }

        const data = await response.json();
        const currentRole = data.role;

        // Check if current role matches expected role(s)
        const expectedRoles = Array.isArray(expectedRole) ? expectedRole : [expectedRole];
        
        if (expectedRoles.includes(currentRole)) {
          setIsAuthorized(true);
        } else {
          // User's role has changed - redirect to correct dashboard
          const correctDashboard = roleDashboardMap[currentRole];
          if (correctDashboard) {
            console.log(`Role mismatch: expected ${expectedRole}, got ${currentRole}. Redirecting to ${correctDashboard}`);
            router.replace(correctDashboard);
          } else {
            router.push('/login');
          }
        }
      } catch (error) {
        console.error('Role check error:', error);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkRole();
  }, [expectedRole, router, pathname]);

  return { isAuthorized, isLoading };
}


