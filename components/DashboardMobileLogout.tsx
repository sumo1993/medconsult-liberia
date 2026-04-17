'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import BrowserStyleConfirmDialog from '@/components/BrowserStyleConfirmDialog';

function isDashboardSubRoute(pathname: string) {
  return pathname.startsWith('/dashboard/');
}

export default function DashboardMobileLogout() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

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

      <BrowserStyleConfirmDialog
        open={open}
        message="Are you sure you want to log out?"
        onCancel={() => setOpen(false)}
        onConfirm={performLogout}
        overlayClassName="z-[60] md:hidden"
      />
    </>
  );
}
