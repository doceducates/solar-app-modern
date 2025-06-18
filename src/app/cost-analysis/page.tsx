import { Metadata } from 'next';
import { CostAnalysisPage } from '@/components/pages/CostAnalysisPage';

export const metadata: Metadata = {
  title: 'Cost Analysis - Solar Calculator',
  description: 'Analyze costs, savings, and ROI for solar panel systems',
};

export default function CostAnalysis() {
  return <CostAnalysisPage />;
}
