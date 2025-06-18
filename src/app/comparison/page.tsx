import { Metadata } from 'next';
import { ComparisonPage } from '@/components/pages/ComparisonPage';

export const metadata: Metadata = {
  title: 'Comparison - Solar Calculator',
  description: 'Compare different solar panel configurations and their performance',
};

export default function Comparison() {
  return <ComparisonPage />;
}
