import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useSessionValidation() {
  const router = useRouter();

  useEffect(() => {
    const validateSession = async () => {
      try {
        const token = localStorage.getItem('auth-token');
        if (!token) {
          // Let DashboardAccessGuard handle redirects when token is absent.
          return;
        }

        console.log('[Client] Validating session...');
        const response = await fetch('/api/auth/validate-session', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          console.log('[Client] ❌ Session invalid, redirecting to login');
          if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('auth-token');
            router.replace('/login');
          }
          return;
        } else {
          console.log('[Client] ✅ Session valid');
        }
      } catch (error) {
        console.error('[Client] Session validation error:', error);
      }
    };

    // Validate immediately
    validateSession();

    // Validate every 10 seconds
    const interval = setInterval(validateSession, 10000);

    return () => clearInterval(interval);
  }, [router]);

  return null;
}
