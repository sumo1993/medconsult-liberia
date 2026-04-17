import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Hook to continuously check if the user's account is still active
 * If account is suspended/blocked, automatically logout and redirect
 */
export function useAccountStatus() {
  const router = useRouter();
  const checkingRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    let failureCount = 0;
    const MAX_FAILURES = 2; // Allow 2 failures before logging out
    const controller = new AbortController();

    const checkAccountStatus = async () => {
      if (!isMountedRef.current) return;
      // Prevent multiple simultaneous checks
      if (checkingRef.current) return;
      checkingRef.current = true;

      try {
        const token = localStorage.getItem('auth-token');
        if (!token) {
          // No token, but don't redirect immediately (might be loading)
          console.log('[Account Status] No token found');
          checkingRef.current = false;
          return;
        }

        const response = await fetch('/api/profile', {
          signal: controller.signal,
          cache: 'no-store',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.status === 401 || response.status === 403) {
          // Unauthorized/forbidden - token invalid, expired, or account blocked
          failureCount++;
          console.log(`[Account Status] Unauthorized/Forbidden (attempt ${failureCount}/${MAX_FAILURES})`);
          
          if (failureCount >= MAX_FAILURES) {
            console.log('[Account Status] Multiple auth failures - logging out');
            handleLogout();
          }
        } else if (response.ok) {
          const data = await response.json();
          failureCount = 0; // Reset failure count on success
          
          // Check if account is suspended or inactive
          if (data.status && data.status !== 'active') {
            console.log(`[Account Status] Account is ${data.status} - logging out`);
            alert(`Your account has been ${data.status}. Please contact support for assistance.`);
            handleLogout();
          }
        } else {
          // Other errors (500, etc.) - don't logout immediately
          console.log('[Account Status] Server error:', response.status);
        }
      } catch (error: unknown) {
        // Ignore abort and transient network errors (e.g. dev server restart / temporary disconnection)
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        if (error instanceof TypeError) {
          console.warn('[Account Status] Network check skipped:', error.message);
          return;
        }
        console.error('[Account Status] Error checking status:', error);
      } finally {
        checkingRef.current = false;
      }
    };

    const handleLogout = () => {
      localStorage.removeItem('auth-token');
      localStorage.removeItem('user');
      router.push('/login');
    };

    // Check immediately on mount, then every 10 seconds for faster detection
    checkAccountStatus();
    const interval = setInterval(checkAccountStatus, 10000);

    return () => {
      isMountedRef.current = false;
      controller.abort();
      clearInterval(interval);
    };
  }, [router]);
}
