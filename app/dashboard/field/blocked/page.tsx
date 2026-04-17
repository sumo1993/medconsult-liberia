'use client';

import { useRouter } from 'next/navigation';
import { ShieldOff } from 'lucide-react';
import { useRoleRedirect } from '@/hooks/useRoleRedirect';

export default function CensusFieldBlockedPage() {
  const router = useRouter();
  const { isAuthorized, isLoading } = useRoleRedirect('census');

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  if (isLoading || !isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-4 border-emerald-200 border-t-emerald-700 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
        <div className="mx-auto w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mb-4">
          <ShieldOff className="w-8 h-8 text-amber-700" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Field dashboard access disabled</h1>
        <p className="text-sm text-gray-600 mb-6">
          An administrator has blocked access to the census field worker dashboard for your account (or for all field
          accounts). You cannot submit or view surveys until access is restored.
        </p>
        <button
          type="button"
          onClick={logout}
          className="w-full px-4 py-3 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
