import CensusFieldDashboardGate from '@/components/CensusFieldDashboardGate';

export default function FieldDashboardLayout({ children }: { children: React.ReactNode }) {
  return <CensusFieldDashboardGate>{children}</CensusFieldDashboardGate>;
}
