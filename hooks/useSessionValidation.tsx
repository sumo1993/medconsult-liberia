import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function useSessionValidation() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const validateSession = async () => {
      try {
        const token = localStorage.getItem('auth-token');
        if (!token) {
          console.log('[Client] No token found, redirecting to login');
          localStorage.clear();
          router.push('/login');
          return;
        }

        console.log('[Client] Validating session...');
        const response = await fetch('/api/auth/validate-session', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          console.log('[Client] ❌ Session invalid, showing lock modal');
          // Session invalid, show modern modal
          setShowModal(true);
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

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  // Render modern modal
  if (showModal) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm animate-fadeIn">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-slideUp">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-white bg-opacity-20 rounded-full p-2">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white">Account Locked</h3>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            <p className="text-gray-700 text-base leading-relaxed mb-2">
              Your account has been locked or your session has expired.
            </p>
            <p className="text-gray-600 text-sm">
              Please contact support if you believe this is an error.
            </p>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex justify-end">
            <button
              onClick={handleLogout}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              OK
            </button>
          </div>
        </div>

        <style jsx>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          @keyframes slideUp {
            from {
              transform: translateY(20px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
          .animate-fadeIn {
            animation: fadeIn 0.2s ease-out;
          }
          .animate-slideUp {
            animation: slideUp 0.3s ease-out;
          }
        `}</style>
      </div>
    );
  }

  return null;
}
