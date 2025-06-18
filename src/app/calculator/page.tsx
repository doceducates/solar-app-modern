import { Metadata } from 'next';
import { CalculatorPage } from '@/components/pages/CalculatorPage';

export const metadata: Metadata = {
  title: 'Calculator - Solar Calculator',
  description: 'Configure and calculate solar panel system performance',
};

export default function Calculator() {
  return <CalculatorPage />;
}
