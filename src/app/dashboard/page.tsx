import { Metadata } from 'next';
import { DashboardPage } from '@/components/pages/DashboardPage';

export const metadata: Metadata = {
  title: 'Dashboard - Solar Calculator',
  description: 'Solar panel system overview and quick insights',
};

export default function Dashboard() {
  return <DashboardPage />;
}
