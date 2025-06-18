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
  const getConfigIcon = (config: string) => {
    switch (config) {
      case 'series': return <Zap className="w-4 h-4" />;
      case 'parallel': return <Plus className="w-4 h-4" />;
      case 'combined': return <Combine className="w-4 h-4" />;
      default: return <Zap className="w-4 h-4" />;
    }
  };
  const getSafetyBadge = (configType: 'series' | 'parallel' | 'combined') => {
    const safety = safetyChecks[configType];
    if (!safety) return null;

    const errorCount = safety.errors?.length || 0;
    const warningCount = safety.warnings?.length || 0;
    const totalIssues = errorCount + warningCount;
    
    if (totalIssues === 0) {
      return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Safe</Badge>;
    } else {
      return <Badge variant="destructive">{totalIssues} Warning{totalIssues > 1 ? 's' : ''}</Badge>;
    }
  };

  if (!results) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-500 dark:text-gray-400 text-center">
            Enter panel specifications to see configuration options
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as 'series' | 'parallel' | 'combined')}>
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="series" className="flex items-center gap-2">
          {getConfigIcon('series')}
          Series
          {getSafetyBadge('series')}
        </TabsTrigger>
        <TabsTrigger value="parallel" className="flex items-center gap-2">
          {getConfigIcon('parallel')}
          Parallel
          {getSafetyBadge('parallel')}
        </TabsTrigger>
        <TabsTrigger value="combined" className="flex items-center gap-2">
          {getConfigIcon('combined')}
          Combined
          {getSafetyBadge('combined')}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="series">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-500" />
              Series Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {results.series.voltage.toFixed(1)}V
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Voltage</p>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {results.series.current.toFixed(1)}A
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Current</p>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {results.series.power.toFixed(0)}W
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Power</p>
              </div>
            </div>
            
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p>• Voltage adds up: {systemConfig.panels} panels × {panelSpecs.voltage}V = {results.series.voltage}V</p>
              <p>• Current stays the same: {panelSpecs.current}A</p>
              <p>• Best for: Long cable runs, high system voltage requirements</p>
            </div>            {safetyChecks.series && (
              <div className="mt-4">
                {safetyChecks.series.errors?.map((error, index) => (
                  <div key={`error-${index}`} className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    {error}
                  </div>
                ))}
                {safetyChecks.series.warnings?.map((warning, index) => (
                  <div key={`warning-${index}`} className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    {warning}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="parallel">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-green-500" />
              Parallel Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {results.parallel.voltage.toFixed(1)}V
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Voltage</p>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {results.parallel.current.toFixed(1)}A
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Current</p>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {results.parallel.power.toFixed(0)}W
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Power</p>
              </div>
            </div>
            
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p>• Voltage stays the same: {panelSpecs.voltage}V</p>
              <p>• Current adds up: {systemConfig.panels} panels × {panelSpecs.current}A = {results.parallel.current}A</p>
              <p>• Best for: Low voltage systems, better shading tolerance</p>
            </div>            {safetyChecks.parallel && (
              <div className="mt-4">
                {safetyChecks.parallel.errors?.map((error, index) => (
                  <div key={`error-${index}`} className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    {error}
                  </div>
                ))}
                {safetyChecks.parallel.warnings?.map((warning, index) => (
                  <div key={`warning-${index}`} className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    {warning}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="combined">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Combine className="w-5 h-5 text-purple-500" />
              Combined Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {results.combined.voltage.toFixed(1)}V
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Voltage</p>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {results.combined.current.toFixed(1)}A
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Current</p>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {results.combined.power.toFixed(0)}W
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Power</p>
              </div>
            </div>
            
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p>• Configuration: {systemConfig.seriesGroups} strings of {systemConfig.panelsPerGroup || 2} panels each</p>
              <p>• Voltage per string: {systemConfig.panelsPerGroup || 2} × {panelSpecs.voltage}V = {((systemConfig.panelsPerGroup || 2) * panelSpecs.voltage).toFixed(1)}V</p>
              <p>• Current per string: {panelSpecs.current}A</p>
              <p>• Total current: {systemConfig.seriesGroups} × {panelSpecs.current}A = {results.combined.current}A</p>
              <p>• Best for: Optimal balance of voltage and current</p>
            </div>            {safetyChecks.combined && (
              <div className="mt-4">
                {safetyChecks.combined.errors?.map((error, index) => (
                  <div key={`error-${index}`} className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    {error}
                  </div>
                ))}
                {safetyChecks.combined.warnings?.map((warning, index) => (
                  <div key={`warning-${index}`} className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    {warning}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
