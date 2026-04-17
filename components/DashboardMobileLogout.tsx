'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

function isDashboardSubRoute(pathname: string) {
  return pathname.startsWith('/dashboard/');
}

export default function DashboardMobileLogout() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [host, setHost] = useState('medconsultliberia.com');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHost(window.location.hostname || 'medconsultliberia.com');
    }
  }, []);

  if (!isDashboardSubRoute(pathname)) return null;

  const performLogout = async () => {
    setOpen(false);
    try {
      localStorage.removeItem('auth-token');
      localStorage.removeItem('user');
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // still leave the app
    }
    router.push('/login');
  };

  return (
    <>
      <div className="pointer-events-none fixed left-0 right-0 top-0 z-[45] flex justify-end pr-3 pt-[max(0.5rem,env(safe-area-inset-top))] md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-red-600 shadow-md hover:bg-red-50"
          aria-label="Log out"
        >
          <LogOut className="h-5 w-5" strokeWidth={2.5} />
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm md:hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-logout-dialog-title"
        >
          <button
            type="button"
            className="absolute inset-0 h-full w-full cursor-default"
            aria-label="Dismiss"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-xl border border-[#3d2620] bg-[#2a1814] shadow-2xl">
            <div className="px-4 pb-2 pt-4">
              <p className="text-xs leading-snug text-white/90">
                {host} says
              </p>
              <p id="mobile-logout-dialog-title" className="mt-3 text-[15px] leading-snug text-white">
                Are you sure you want to log out?
              </p>
            </div>
            <div className="flex justify-end gap-2 px-4 pb-4 pt-1">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full bg-[#5c322a] px-5 py-2 text-sm font-medium text-white hover:bg-[#6e3d33]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={performLogout}
                className="rounded-full bg-[#f0c4b2] px-5 py-2 text-sm font-semibold text-gray-900 hover:bg-[#ffd4c4]"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
