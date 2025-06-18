'use client';

import { AlertTriangle, Zap, Plus, Combine } from 'lucide-react';
import { ConfigurationResults, PanelSpecifications, SystemConfiguration, SafetyChecks } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ConfigurationTabsProps {
  activeTab: 'series' | 'parallel' | 'combined';
  onTabChange: (tab: 'series' | 'parallel' | 'combined') => void;
  results: ConfigurationResults | null;
  panelSpecs: PanelSpecifications;
  systemConfig: SystemConfiguration;
  safetyChecks: SafetyChecks;
}

export default function ConfigurationTabs({
  activeTab,
  onTabChange,
  results,
  panelSpecs,
  systemConfig,
  safetyChecks
}: ConfigurationTabsProps) {
  const tabs = [
    {
      id: 'series' as const,
      label: 'Series Configuration',
      icon: Link,
      description: 'Panels connected in a chain - voltage adds up',
      diagram: 'Panel 1 → Panel 2 → Panel 3 → Panel 4',
      color: 'blue'
    },
    {
      id: 'parallel' as const,
      label: 'Parallel Configuration',
      icon: Merge,
      description: 'Panels connected side by side - current adds up',
      diagram: 'Panel 1 ║ Panel 2 ║ Panel 3 ║ Panel 4',
      color: 'green'
    },
    {
      id: 'combined' as const,
      label: 'Series-Parallel Configuration',
      icon: ArrowRight,
      description: 'Mixed configuration for optimal balance',
      diagram: `${systemConfig.seriesGroups} groups × ${systemConfig.panelsPerGroup} panels`,
      color: 'purple'
    }
  ];
  const getTabSafety = (tabId: string) => {
    const safety = safetyChecks[tabId as keyof SafetyChecks];
    if (!safety) return { status: 'unknown', issues: [] };
    
    const issues = (safety.warnings?.length || 0) + (safety.errors?.length || 0);
    if (safety.errors && safety.errors.length > 0) return { status: 'error', issues };
    if (safety.warnings && safety.warnings.length > 0) return { status: 'warning', issues };
    return { status: 'safe', issues: 0 };
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      {/* Tab Headers */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const safety = getTabSafety(tab.id);
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex-1 px-4 py-4 text-left transition-all duration-200',
                'hover:bg-gray-50 dark:hover:bg-gray-700',
                isActive && 'bg-blue-50 dark:bg-blue-900/20 border-b-2 border-blue-500'
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  'p-2 rounded-lg flex-shrink-0',
                  tab.color === 'blue' && 'bg-blue-100 dark:bg-blue-900/30',
                  tab.color === 'green' && 'bg-green-100 dark:bg-green-900/30',
                  tab.color === 'purple' && 'bg-purple-100 dark:bg-purple-900/30'
                )}>
                  <Icon className={cn(
                    'w-5 h-5',
                    tab.color === 'blue' && 'text-blue-600 dark:text-blue-400',
                    tab.color === 'green' && 'text-green-600 dark:text-green-400',
                    tab.color === 'purple' && 'text-purple-600 dark:text-purple-400'
                  )} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={cn(
                      'font-semibold text-sm truncate',
                      isActive ? 'text-blue-700 dark:text-blue-300' : 'text-gray-800 dark:text-white'
                    )}>
                      {tab.label}
                    </h3>
                    
                    {/* Safety Indicator */}
                    {safety.status === 'safe' && (
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    )}
                    {safety.status === 'warning' && (
                      <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                    )}
                    {safety.status === 'error' && (
                      <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    {tab.description}
                  </p>
                  
                  <div className="font-mono text-xs text-gray-500 dark:text-gray-500">
                    {tab.diagram}
                  </div>
                  
                  {/* Power Output Preview */}
                  {results && (
                    <div className="mt-2 text-xs">
                      <span className="text-gray-500 dark:text-gray-400">Power: </span>
                      <span className={cn(
                        'font-semibold',
                        isActive ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'
                      )}>
                        {results[tab.id].power.toFixed(1)}W
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Tab Content */}
      <div className="p-6">
        {activeTab === 'series' && (
          <div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
              Series Configuration Details
            </h4>
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <p>
                In series configuration, panels are connected end-to-end like a chain. 
                The positive terminal of one panel connects to the negative terminal of the next.
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <p><strong>Characteristics:</strong></p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Voltage adds up: {systemConfig.panels} × {panelSpecs.voltage}V = {(systemConfig.panels * panelSpecs.voltage).toFixed(1)}V</li>
                  <li>Current stays the same: {panelSpecs.current}A</li>
                  <li>If one panel fails, the entire string stops working</li>
                  <li>Best for high voltage systems and long wire runs</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'parallel' && (
          <div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
              Parallel Configuration Details
            </h4>
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <p>
                In parallel configuration, all positive terminals connect together and all 
                negative terminals connect together, like branches on a tree.
              </p>
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                <p><strong>Characteristics:</strong></p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Current adds up: {systemConfig.panels} × {panelSpecs.current}A = {(systemConfig.panels * panelSpecs.current).toFixed(1)}A</li>
                  <li>Voltage stays the same: {panelSpecs.voltage}V</li>
                  <li>If one panel fails, others continue working</li>
                  <li>Better for shaded conditions and system reliability</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'combined' && (
          <div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
              Series-Parallel Configuration Details
            </h4>
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <p>
                Combined configuration uses both series and parallel connections to optimize 
                voltage and current for your specific system needs.
              </p>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                <p><strong>Your Configuration:</strong></p>
                <ul className="list-disc list-inside mt-1 space-y-1">                  <li>{systemConfig.seriesGroups || 1} parallel groups</li>
                  <li>{systemConfig.panelsPerGroup || 1} panels in series per group</li>
                  <li>Group voltage: {systemConfig.panelsPerGroup || 1} × {panelSpecs.voltage}V = {((systemConfig.panelsPerGroup || 1) * panelSpecs.voltage).toFixed(1)}V</li>
                  <li>Total current: {systemConfig.seriesGroups || 1} × {panelSpecs.current}A = {((systemConfig.seriesGroups || 1) * panelSpecs.current).toFixed(1)}A</li>
                </ul>
              </div>
            </div>
          </div>
        )}        {/* Safety Warnings */}
        {safetyChecks[activeTab] && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            {safetyChecks[activeTab]?.errors && safetyChecks[activeTab]?.errors!.length > 0 && (
              <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <h5 className="font-semibold text-red-800 dark:text-red-200 flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  Safety Errors
                </h5>
                <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                  {safetyChecks[activeTab]?.errors!.map((error: string, index: number) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {safetyChecks[activeTab]?.warnings && safetyChecks[activeTab]?.warnings!.length > 0 && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <h5 className="font-semibold text-yellow-800 dark:text-yellow-200 flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  Safety Warnings
                </h5>
                <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                  {safetyChecks[activeTab]?.warnings!.map((warning: string, index: number) => (
                    <li key={index}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
