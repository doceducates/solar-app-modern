'use client';

import { FullScreenCircuitSimulator } from '@/components/FullScreenCircuitSimulator';

export default function CircuitSimulatorPage() {
  return (
    <div className="fixed inset-0 z-50 bg-background">
      <FullScreenCircuitSimulator />
    </div>
  );
}
