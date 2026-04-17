import { ReactNode } from 'react';
import DashboardMobileNav from '@/components/DashboardMobileNav';
import DashboardAccessGuard from '@/components/DashboardAccessGuard';
import PresenceHeartbeat from '@/components/PresenceHeartbeat';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="pb-20 md:pb-0">
      <DashboardAccessGuard>
        <PresenceHeartbeat />
        {children}
        <DashboardMobileNav />
      </DashboardAccessGuard>
    </div>
  );
}
