import { ReactNode } from 'react';
import DashboardMobileNav from '@/components/DashboardMobileNav';
import DashboardMobileLogout from '@/components/DashboardMobileLogout';
import DashboardAccessGuard from '@/components/DashboardAccessGuard';
import PresenceHeartbeat from '@/components/PresenceHeartbeat';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="pb-20 md:pb-0">
      <DashboardAccessGuard>
        <PresenceHeartbeat />
        {children}
        <DashboardMobileLogout />
        <DashboardMobileNav />
      </DashboardAccessGuard>
    </div>
  );
}
