import { Metadata } from 'next';
import { SettingsPage } from '@/components/pages/SettingsPage';

export const metadata: Metadata = {
  title: 'Settings - Solar Calculator',
  description: 'Configure application settings and preferences',
};

export default function Settings() {
  return <SettingsPage />;
}
