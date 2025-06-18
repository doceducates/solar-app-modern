'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { AlertTriangle, CheckCircle, Zap, Settings, Calculator, TrendingUp } from 'lucide-react';
import { usePanelPresets, useInverterPresets } from '@/hooks/useDatabase';
import { PanelPreset, InverterPreset } from '@/types';
import { 
  calculateSystemParameters, 
  validateSystemCompatibility,
  calculateMixedPanelSystem,
  StringConfiguration,
  MixedSystemConfiguration
} from '@/lib/calculations';

interface SystemDesignState {
  selectedPanel: PanelPreset | null;
  selectedInverter: InverterPreset | null;
  numPanels: number;
  numInverters: number;
  seriesConfig: number;
  parallelConfig: number;
  systemEfficiency: number;
  // Mixed panel configuration support
  mixedPanelMode: boolean;
  stringConfigurations: StringConfiguration[];
}

export default function SystemDesignPage() {
  const { presets: panels, loading: panelsLoading } = usePanelPresets();
  const { inverters, loading: invertersLoading } = useInverterPresets();
    const [systemConfig, setSystemConfig] = useState<SystemDesignState>({
    selectedPanel: null,
    selectedInverter: null,
    numPanels: 20,
    numInverters: 1,
    seriesConfig: 10,
    parallelConfig: 2,
    systemEfficiency: 85,
    mixedPanelMode: false,
    stringConfigurations: []
  });

  const [activeTab, setActiveTab] = useState('design');  // Calculate comprehensive system configuration and compatibility
  const systemAnalysis = useMemo(() => {
    if (!systemConfig.selectedInverter) {
      return null;
    }

    const inverter = systemConfig.selectedInverter;
    
    // Handle mixed panel configurations
    if (systemConfig.mixedPanelMode && systemConfig.stringConfigurations.length > 0) {
      const mixedConfig: MixedSystemConfiguration = {
        strings: systemConfig.stringConfigurations,
        numInverters: systemConfig.numInverters,
        systemEfficiency: systemConfig.systemEfficiency
      };
      
      const systemCalc = calculateMixedPanelSystem(inverter, mixedConfig);
      const compatibility = validateSystemCompatibility(
        systemConfig.stringConfigurations[0]?.panelPreset || systemConfig.selectedPanel!,
        inverter,
        systemCalc
      );

      return {
        ...systemCalc,
        isCompatible: compatibility.isCompatible,
        issues: compatibility.issues,
        warnings: [...compatibility.warnings, ...systemCalc.mixedPanelWarnings],
        recommendations: compatibility.recommendations,
        compatibilityScore: compatibility.compatibilityScore,
        // Legacy fields for backward compatibility
        totalInverterCapacity: systemConfig.numInverters * inverter.ratedPower,
        powerPerInverter: systemCalc.totalSystemPower / systemConfig.numInverters,
        voltageCompatible: systemCalc.totalSystemVoltage >= inverter.mpptVoltageRange.min && 
                         systemCalc.totalSystemVoltage <= inverter.mpptVoltageRange.max,
        currentCompatible: systemCalc.perInverterBreakdown.every(inv => inv.current <= inverter.maxSolarCurrent),
        powerCompatible: systemCalc.perInverterBreakdown.every(inv => inv.power <= inverter.maxPvPower),
        vocSafety: systemCalc.totalSystemVoc <= inverter.maxSolarVoltage
      };
    }
    
    // Handle uniform panel configurations
    if (!systemConfig.selectedPanel) {
      return null;    }

    const panel = systemConfig.selectedPanel;
    
    // Use enhanced calculations
    const systemCalc = calculateSystemParameters(
      panel,
      inverter,
      systemConfig.seriesConfig,
      systemConfig.parallelConfig,
      systemConfig.numInverters,
      systemConfig.systemEfficiency
    );

    // Validate compatibility with detailed analysis
    const compatibility = validateSystemCompatibility(panel, inverter, systemCalc);

    // Legacy compatibility for existing UI
    return {
      ...systemCalc,
      isCompatible: compatibility.isCompatible,
      issues: compatibility.issues,
      warnings: compatibility.warnings,
      recommendations: compatibility.recommendations,
      compatibilityScore: compatibility.compatibilityScore,
      // Legacy fields for backward compatibility
      stringVoltage: systemCalc.stringVoltage,
      stringCurrent: systemCalc.stringCurrent,
      stringPower: systemCalc.stringPower,
      totalSystemPower: systemCalc.totalSystemPower,
      totalInverterCapacity: systemConfig.numInverters * inverter.ratedPower,
      powerPerInverter: systemCalc.stringPower * systemCalc.stringsPerInverter,
      voltageCompatible: systemCalc.stringVoltage >= inverter.mpptVoltageRange.min && 
                       systemCalc.stringVoltage <= inverter.mpptVoltageRange.max,      currentCompatible: (systemCalc.stringCurrent * systemCalc.stringsPerInverter) <= inverter.maxSolarCurrent,
      powerCompatible: (systemCalc.stringPower * systemCalc.stringsPerInverter) <= inverter.maxPvPower,
      vocSafety: systemCalc.stringVoc <= inverter.maxSolarVoltage
    };
  }, [systemConfig]);

  const handlePanelChange = (panelId: string) => {
    const panel = panels.find((p: PanelPreset) => p.id === panelId);
    setSystemConfig(prev => ({ ...prev, selectedPanel: panel || null }));
  };

  const handleInverterChange = (inverterId: string) => {
    const inverter = inverters.find((i: InverterPreset) => i.id === inverterId);
    setSystemConfig(prev => ({ ...prev, selectedInverter: inverter || null }));
  };

  const suggestOptimalConfiguration = () => {
    if (!systemConfig.selectedPanel || !systemConfig.selectedInverter) return;
    
    const panel = systemConfig.selectedPanel;
    const inverter = systemConfig.selectedInverter;
    
    // Find optimal series configuration
    let optimalSeries = 1;
    for (let series = 1; series <= 25; series++) {
      const voltage = series * panel.voltage;
      const voc = series * panel.voc;
      
      if (voltage >= inverter.mpptVoltageRange.min && 
          voltage <= inverter.mpptVoltageRange.max &&
          voc <= inverter.maxSolarVoltage) {
        optimalSeries = series;
      }
    }
    
    // Calculate optimal parallel strings
    const maxPowerPerInverter = inverter.maxPvPower * 1.3; // Allow 30% oversizing
    const powerPerString = optimalSeries * panel.power;
    const maxStrings = Math.floor(maxPowerPerInverter / powerPerString);
    const optimalParallel = Math.min(maxStrings, Math.floor(inverter.maxSolarCurrent / panel.current));
    
    setSystemConfig(prev => ({
      ...prev,
      seriesConfig: optimalSeries,
      parallelConfig: optimalParallel,
      numPanels: optimalSeries * optimalParallel * systemConfig.numInverters
    }));
  };

  if (panelsLoading || invertersLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading system components...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            ⚡ System Design Studio
          </h1>
          <p className="text-lg text-gray-600">
            Design complete solar PV systems with automatic compatibility validation
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="design" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              System Design
            </TabsTrigger>
            <TabsTrigger value="validation" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Validation
            </TabsTrigger>
            <TabsTrigger value="calculations" className="flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              Calculations
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Analysis
            </TabsTrigger>
          </TabsList>

          {/* System Design Tab */}
          <TabsContent value="design" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Panel Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Zap className="w-4 h-4 text-blue-600" />
                    </div>
                    Solar Panel Selection
                  </CardTitle>
                  <CardDescription>
                    Choose your solar panel model and specifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="panel-select">Panel Model</Label>
                    <Select onValueChange={handlePanelChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a solar panel..." />
                      </SelectTrigger>
                      <SelectContent>
                        {panels.map((panel: PanelPreset) => (
                          <SelectItem key={panel.id} value={panel.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{panel.name}</span>
                              <Badge variant="outline" className="ml-2">
                                {panel.power}W
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {systemConfig.selectedPanel && (
                    <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                      <h4 className="font-medium text-blue-900">Panel Specifications</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
                        <div>Power: {systemConfig.selectedPanel.power}W</div>
                        <div>Voltage: {systemConfig.selectedPanel.voltage}V</div>
                        <div>Current: {systemConfig.selectedPanel.current}A</div>
                        <div>VOC: {systemConfig.selectedPanel.voc}V</div>
                        <div>ISC: {systemConfig.selectedPanel.isc}A</div>
                        <div>Efficiency: {systemConfig.selectedPanel.efficiency}%</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Inverter Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <Settings className="w-4 h-4 text-green-600" />
                    </div>
                    Inverter Selection
                  </CardTitle>
                  <CardDescription>
                    Choose your inverter model and specifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="inverter-select">Inverter Model</Label>
                    <Select onValueChange={handleInverterChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an inverter..." />
                      </SelectTrigger>
                      <SelectContent>
                        {inverters.map((inverter: InverterPreset) => (
                          <SelectItem key={inverter.id} value={inverter.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{inverter.name}</span>
                              <Badge variant="outline" className="ml-2">
                                {(inverter.ratedPower/1000).toFixed(1)}kW
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {systemConfig.selectedInverter && (
                    <div className="bg-green-50 p-4 rounded-lg space-y-2">
                      <h4 className="font-medium text-green-900">Inverter Specifications</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm text-green-800">
                        <div>Power: {(systemConfig.selectedInverter.ratedPower/1000).toFixed(1)}kW</div>
                        <div>MPPT Range: {systemConfig.selectedInverter.mpptVoltageRange.min}-{systemConfig.selectedInverter.mpptVoltageRange.max}V</div>
                        <div>Max Current: {systemConfig.selectedInverter.maxSolarCurrent}A</div>
                        <div>Max PV Power: {(systemConfig.selectedInverter.maxPvPower/1000).toFixed(1)}kW</div>
                        <div>Efficiency: {systemConfig.selectedInverter.efficiency}%</div>
                        <div>MPPT Channels: {systemConfig.selectedInverter.mpptChannels}</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* System Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>System Configuration</CardTitle>
                <CardDescription>
                  Configure your solar array layout and system parameters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <Label htmlFor="series-config">Panels per String</Label>
                    <Input
                      id="series-config"
                      type="number"
                      min="1"
                      max="30"
                      value={systemConfig.seriesConfig}
                      onChange={(e) => setSystemConfig(prev => ({
                        ...prev,
                        seriesConfig: parseInt(e.target.value) || 1
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="parallel-config">Number of Strings</Label>
                    <Input
                      id="parallel-config"
                      type="number"
                      min="1"
                      max="20"
                      value={systemConfig.parallelConfig}
                      onChange={(e) => setSystemConfig(prev => ({
                        ...prev,
                        parallelConfig: parseInt(e.target.value) || 1
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="num-inverters">Number of Inverters</Label>
                    <Input
                      id="num-inverters"
                      type="number"
                      min="1"
                      max="10"
                      value={systemConfig.numInverters}
                      onChange={(e) => setSystemConfig(prev => ({
                        ...prev,
                        numInverters: parseInt(e.target.value) || 1
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="system-efficiency">System Efficiency (%)</Label>
                    <Input
                      id="system-efficiency"
                      type="number"
                      min="70"
                      max="100"
                      value={systemConfig.systemEfficiency}
                      onChange={(e) => setSystemConfig(prev => ({
                        ...prev,
                        systemEfficiency: parseInt(e.target.value) || 85
                      }))}
                    />
                  </div>                </div>

                {/* Mixed Panel Mode Toggle */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <Label htmlFor="mixed-panel-mode" className="text-base font-medium">Mixed Panel Configuration</Label>
                      <p className="text-sm text-gray-600">Configure different panel types per string</p>
                    </div>                    <div className="flex items-center space-x-2">
                      <Switch
                        id="mixed-panel-mode"
                        checked={systemConfig.mixedPanelMode}
                        onCheckedChange={(checked) => setSystemConfig(prev => ({
                          ...prev,
                          mixedPanelMode: checked,
                          stringConfigurations: checked ? 
                            // Initialize with default configurations
                            Array.from({ length: prev.parallelConfig * prev.numInverters }, (_, i) => ({
                              stringId: i + 1,
                              inverterId: Math.floor(i / prev.parallelConfig) + 1,
                              panelPreset: prev.selectedPanel!,
                              panelCount: prev.seriesConfig
                            })).filter(config => config.panelPreset) : []
                        }))}
                      />
                      <Label htmlFor="mixed-panel-mode">Enable</Label>
                    </div>
                  </div>

                  {/* Mixed Panel String Configuration */}
                  {systemConfig.mixedPanelMode && (
                    <div className="space-y-4">
                      <div className="grid gap-4">
                        {Array.from({ length: systemConfig.parallelConfig * systemConfig.numInverters }).map((_, stringIndex) => {
                          const stringId = stringIndex + 1;
                          const inverterId = Math.floor(stringIndex / systemConfig.parallelConfig) + 1;
                          const existingConfig = systemConfig.stringConfigurations.find(s => s.stringId === stringId);
                          
                          return (
                            <div key={stringId} className="bg-gray-50 p-4 rounded-lg border">
                              <div className="flex items-center gap-4">
                                <div className="min-w-0 flex-1">
                                  <Label className="text-sm font-medium text-gray-700">
                                    String {stringId} (Inverter {inverterId})
                                  </Label>
                                </div>
                                <div className="flex-1">
                                  <Select
                                    value={existingConfig?.panelPreset.id || ''}
                                    onValueChange={(panelId) => {
                                      const panel = panels.find(p => p.id === panelId);
                                      if (panel) {
                                        setSystemConfig(prev => ({
                                          ...prev,
                                          stringConfigurations: [
                                            ...prev.stringConfigurations.filter(s => s.stringId !== stringId),
                                            {
                                              stringId,
                                              inverterId,
                                              panelPreset: panel,
                                              panelCount: existingConfig?.panelCount || prev.seriesConfig
                                            }
                                          ]
                                        }));
                                      }
                                    }}
                                  >
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="Select panel..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {panels.map((panel: PanelPreset) => (
                                        <SelectItem key={panel.id} value={panel.id}>
                                          <div className="flex items-center justify-between w-full">
                                            <span className="text-sm">{panel.name}</span>
                                            <Badge variant="outline" className="ml-2 text-xs">
                                              {panel.power}W
                                            </Badge>
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="w-24">
                                  <Input
                                    type="number"
                                    min="1"
                                    max="30"
                                    placeholder="Panels"
                                    value={existingConfig?.panelCount || systemConfig.seriesConfig}
                                    onChange={(e) => {
                                      const panelCount = parseInt(e.target.value) || 1;
                                      setSystemConfig(prev => ({
                                        ...prev,
                                        stringConfigurations: prev.stringConfigurations.map(s => 
                                          s.stringId === stringId ? { ...s, panelCount } : s
                                        )
                                      }));
                                    }}
                                    className="text-sm"
                                  />
                                </div>
                              </div>
                              {existingConfig && (
                                <div className="mt-2 grid grid-cols-4 gap-2 text-xs text-gray-600">
                                  <div>V: {(existingConfig.panelPreset.voltage * existingConfig.panelCount).toFixed(1)}V</div>
                                  <div>I: {existingConfig.panelPreset.current.toFixed(1)}A</div>
                                  <div>P: {((existingConfig.panelPreset.power * existingConfig.panelCount) / 1000).toFixed(1)}kW</div>
                                  <div>VOC: {(existingConfig.panelPreset.voc * existingConfig.panelCount).toFixed(1)}V</div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      
                      {systemConfig.stringConfigurations.length > 0 && (
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <h4 className="text-sm font-medium text-blue-900 mb-2">Mixed Configuration Summary</h4>
                          <div className="text-xs text-blue-800 space-y-1">
                            <div>Total Strings: {systemConfig.stringConfigurations.length}</div>
                            <div>
                              Total Power: {(systemConfig.stringConfigurations.reduce((sum, s) => 
                                sum + (s.panelPreset.power * s.panelCount), 0) / 1000).toFixed(1)}kW
                            </div>
                            <div>
                              Voltage Range: {Math.min(...systemConfig.stringConfigurations.map(s => 
                                s.panelPreset.voltage * s.panelCount)).toFixed(1)}V - {Math.max(...systemConfig.stringConfigurations.map(s => 
                                s.panelPreset.voltage * s.panelCount)).toFixed(1)}V
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mb-4">
                  <Button 
                    onClick={suggestOptimalConfiguration}
                    disabled={!systemConfig.selectedPanel || !systemConfig.selectedInverter}
                    className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                  >
                    🔧 Auto-Optimize Configuration
                  </Button>
                  <Button 
                    onClick={() => setSystemConfig(prev => ({
                      ...prev,
                      numPanels: prev.seriesConfig * prev.parallelConfig * prev.numInverters
                    }))}
                    variant="outline"
                  >
                    📊 Update Total Panels
                  </Button>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">System Summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Total Panels:</span>
                      <div className="font-bold text-lg">{systemConfig.seriesConfig * systemConfig.parallelConfig * systemConfig.numInverters}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Power:</span>
                      <div className="font-bold text-lg">
                        {systemConfig.selectedPanel ? 
                          ((systemConfig.seriesConfig * systemConfig.parallelConfig * systemConfig.numInverters * systemConfig.selectedPanel.power) / 1000).toFixed(1) : 
                          '0'} kW
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">String Configuration:</span>
                      <div className="font-bold text-lg">{systemConfig.seriesConfig}S × {systemConfig.parallelConfig}P</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Inverter Count:</span>
                      <div className="font-bold text-lg">{systemConfig.numInverters}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Validation Tab */}
          <TabsContent value="validation" className="space-y-6">
            {systemAnalysis && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Compatibility Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {systemAnalysis.isCompatible ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                      )}
                      System Compatibility
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Overall Status */}
                      <div className={`p-4 rounded-lg ${systemAnalysis.isCompatible ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                        <div className="flex items-center gap-2 mb-2">
                          {systemAnalysis.isCompatible ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                          )}
                          <span className={`font-medium ${systemAnalysis.isCompatible ? 'text-green-900' : 'text-red-900'}`}>
                            {systemAnalysis.isCompatible ? 'System Compatible' : 'Compatibility Issues Found'}
                          </span>
                        </div>
                        <p className={`text-sm ${systemAnalysis.isCompatible ? 'text-green-700' : 'text-red-700'}`}>
                          {systemAnalysis.isCompatible ? 
                            'Your panel and inverter configuration is compatible and safe to install.' :
                            'Please review and fix the issues below before proceeding with installation.'
                          }
                        </p>
                      </div>

                      {/* Issues */}
                      {systemAnalysis.issues.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-red-900 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Critical Issues
                          </h4>
                          {systemAnalysis.issues.map((issue, index) => (
                            <div key={index} className="bg-red-50 border border-red-200 p-3 rounded text-sm text-red-800">
                              {issue}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Warnings */}
                      {systemAnalysis.warnings.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-yellow-900 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Warnings
                          </h4>
                          {systemAnalysis.warnings.map((warning, index) => (
                            <div key={index} className="bg-yellow-50 border border-yellow-200 p-3 rounded text-sm text-yellow-800">
                              {warning}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Recommendations */}
                      {systemAnalysis.recommendations.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-blue-900 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            Recommendations
                          </h4>
                          {systemAnalysis.recommendations.map((rec, index) => (
                            <div key={index} className="bg-blue-50 border border-blue-200 p-3 rounded text-sm text-blue-800">
                              {rec}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* System Parameters */}
                <Card>
                  <CardHeader>
                    <CardTitle>System Parameters</CardTitle>
                    <CardDescription>
                      Key electrical parameters and utilization
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">String Voltage:</span>
                          <div className="font-medium">{systemAnalysis.stringVoltage.toFixed(1)}V</div>
                        </div>
                        <div>
                          <span className="text-gray-600">String Current:</span>
                          <div className="font-medium">{systemAnalysis.stringCurrent.toFixed(1)}A</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Power per Inverter:</span>
                          <div className="font-medium">{(systemAnalysis.powerPerInverter/1000).toFixed(1)}kW</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Total System Power:</span>
                          <div className="font-medium">{(systemAnalysis.totalSystemPower/1000).toFixed(1)}kW</div>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h4 className="font-medium mb-2">Utilization Factors</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Voltage Utilization:</span>
                            <span>{systemAnalysis.utilizationFactors.voltage.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Current Utilization:</span>
                            <span>{systemAnalysis.utilizationFactors.current.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Power Utilization:</span>
                            <span>{systemAnalysis.utilizationFactors.power.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {!systemAnalysis && (
              <Card>
                <CardContent className="text-center py-12">
                  <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Configure Your System</h3>
                  <p className="text-gray-600">
                    Please select both a solar panel and inverter from the System Design tab to see compatibility validation.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>          {/* Calculations Tab */}
          <TabsContent value="calculations" className="space-y-6">
            {systemAnalysis && systemConfig.selectedPanel && (
              <div className="space-y-6">
                {/* System Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg text-blue-600">System Voltage</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm text-gray-600">Operating (Vmp):</span>
                          <div className="text-2xl font-bold text-blue-700">{systemAnalysis.totalSystemVoltage.toFixed(1)}V</div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Open Circuit (VOC):</span>
                          <div className="text-lg font-medium text-blue-600">{systemAnalysis.totalSystemVoc.toFixed(1)}V</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg text-green-600">System Current</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm text-gray-600">Operating (Imp):</span>
                          <div className="text-2xl font-bold text-green-700">{systemAnalysis.totalSystemCurrent.toFixed(1)}A</div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Short Circuit (ISC):</span>
                          <div className="text-lg font-medium text-green-600">{systemAnalysis.totalSystemIsc.toFixed(1)}A</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg text-purple-600">System Power</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm text-gray-600">DC Power:</span>
                          <div className="text-2xl font-bold text-purple-700">{(systemAnalysis.totalSystemPower/1000).toFixed(1)}kW</div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Efficiency:</span>
                          <div className="text-lg font-medium text-purple-600">{(systemAnalysis.derating.totalDerating * 100).toFixed(1)}%</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg text-orange-600">Configuration</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm text-gray-600">String Config:</span>
                          <div className="text-xl font-bold text-orange-700">{systemAnalysis.panelsPerString}S × {systemAnalysis.stringsPerInverter}P</div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Total Panels:</span>
                          <div className="text-lg font-medium text-orange-600">{systemConfig.seriesConfig * systemConfig.parallelConfig * systemConfig.numInverters}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Per-Inverter Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Per-Inverter Breakdown</CardTitle>
                    <CardDescription>Individual inverter loading and utilization</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {systemAnalysis.perInverterBreakdown.map((inverterData, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium mb-3 text-gray-900">Inverter {inverterData.inverterId}</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-600">Voltage:</span>
                              <div className="font-medium">{inverterData.voltage.toFixed(1)}V</div>
                            </div>
                            <div>
                              <span className="text-gray-600">Current:</span>
                              <div className="font-medium">{inverterData.current.toFixed(1)}A</div>
                            </div>
                            <div>
                              <span className="text-gray-600">Power:</span>
                              <div className="font-medium">{(inverterData.power/1000).toFixed(1)}kW</div>
                            </div>
                            <div>
                              <span className="text-gray-600">Strings:</span>
                              <div className="font-medium">{inverterData.stringCount}</div>
                            </div>
                            <div className="col-span-2">
                              <span className="text-gray-600">Utilization:</span>
                              <div className="flex items-center gap-2">
                                <div className="font-medium">{inverterData.utilizationPercent.toFixed(1)}%</div>
                                <div className={`px-2 py-1 rounded text-xs font-medium ${
                                  inverterData.utilizationPercent > 120 ? 'bg-red-100 text-red-800' :
                                  inverterData.utilizationPercent > 90 ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {inverterData.utilizationPercent > 120 ? 'High' :
                                   inverterData.utilizationPercent > 90 ? 'Good' : 'Low'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>                </Card>

                {/* Per-String Breakdown for Mixed Configurations */}
                {systemConfig.mixedPanelMode && systemAnalysis && systemAnalysis.perStringBreakdown && systemAnalysis.perStringBreakdown.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Per-String Analysis (Mixed Panels)</CardTitle>
                      <CardDescription>Individual string performance and voltage mismatch effects</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {systemAnalysis.perStringBreakdown.map((stringData, index) => (
                          <div key={index} className="bg-gray-50 p-4 rounded-lg border">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium text-gray-900">String {stringData.stringId}</h4>
                              <div className="text-xs text-gray-600">Inverter {stringData.inverterId}</div>
                            </div>
                            
                            <div className="space-y-2 text-sm">
                              <div className="font-medium text-blue-800">{stringData.panelType.name}</div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <span className="text-gray-600">Panels:</span>
                                  <div className="font-medium">{stringData.panelCount}</div>
                                </div>
                                <div>
                                  <span className="text-gray-600">Voltage:</span>
                                  <div className="font-medium">{stringData.voltage.toFixed(1)}V</div>
                                </div>
                                <div>
                                  <span className="text-gray-600">Current:</span>
                                  <div className="font-medium">{stringData.current.toFixed(1)}A</div>
                                </div>
                                <div>
                                  <span className="text-gray-600">Power:</span>
                                  <div className="font-medium">{(stringData.power/1000).toFixed(1)}kW</div>
                                </div>
                              </div>
                              
                              {stringData.powerLossFromMismatch > 0 && (
                                <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                                  <div className="text-yellow-800 font-medium text-xs">Voltage Mismatch Impact</div>
                                  <div className="text-yellow-700 text-xs">
                                    Power Loss: {(stringData.powerLossFromMismatch/1000).toFixed(1)}kW ({stringData.efficiencyImpact.toFixed(1)}%)
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {systemAnalysis.mixedPanelWarnings && systemAnalysis.mixedPanelWarnings.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <h4 className="font-medium text-orange-900">Mixed Panel Warnings</h4>
                          {systemAnalysis.mixedPanelWarnings.map((warning, index) => (
                            <div key={index} className="bg-orange-50 border border-orange-200 p-3 rounded text-sm text-orange-800">
                              {warning}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Safety Margins */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                      </div>
                      Safety Margins
                    </CardTitle>
                    <CardDescription>Safety margins for critical parameters</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <span className="text-sm text-gray-600">Voltage Margin:</span>
                        <div className={`text-lg font-medium ${
                          systemAnalysis.safetyMargins.voltageMargin < 10 ? 'text-red-600' :
                          systemAnalysis.safetyMargins.voltageMargin < 20 ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {systemAnalysis.safetyMargins.voltageMargin.toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Current Margin:</span>
                        <div className={`text-lg font-medium ${
                          systemAnalysis.safetyMargins.currentMargin < 10 ? 'text-red-600' :
                          systemAnalysis.safetyMargins.currentMargin < 20 ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {systemAnalysis.safetyMargins.currentMargin.toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Power Margin:</span>
                        <div className={`text-lg font-medium ${
                          systemAnalysis.safetyMargins.powerMargin < 10 ? 'text-red-600' :
                          systemAnalysis.safetyMargins.powerMargin < 20 ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {systemAnalysis.safetyMargins.powerMargin.toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">VOC Margin:</span>
                        <div className={`text-lg font-medium ${
                          systemAnalysis.safetyMargins.vocMargin < 10 ? 'text-red-600' :
                          systemAnalysis.safetyMargins.vocMargin < 20 ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {systemAnalysis.safetyMargins.vocMargin.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>                {/* Real-World Performance - Placeholder */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      </div>
                      System Performance
                    </CardTitle>
                    <CardDescription>Basic system performance metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-medium text-green-900 mb-2">Power Output</h4>
                        <div className="space-y-2">
                          <div>
                            <span className="text-sm text-green-700">Nominal Power:</span>
                            <div className="text-xl font-bold text-green-800">{(systemAnalysis.realWorldPerformance.nominalPower/1000).toFixed(1)} kW</div>
                          </div>
                          <div>
                            <span className="text-sm text-green-700">Derated Power:</span>
                            <div className="text-lg font-medium text-green-700">{(systemAnalysis.realWorldPerformance.deratedPower/1000).toFixed(1)} kW</div>
                          </div>
                        </div>
                      </div>                      
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2">System Efficiency</h4>
                        <div className="space-y-2">
                          <div>
                            <span className="text-sm text-blue-700">Overall Derating:</span>
                            <div className="text-xl font-bold text-blue-800">{(systemAnalysis.derating.totalDerating * 100).toFixed(1)}%</div>
                          </div>
                          <div>
                            <span className="text-sm text-blue-700">MPPT Efficiency:</span>
                            <div className="text-lg font-medium text-blue-700">{systemAnalysis.utilizationFactors.mpptEfficiency.toFixed(1)}%</div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-purple-50 p-4 rounded-lg">
                        <h4 className="font-medium text-purple-900 mb-2">Utilization</h4>
                        <div className="space-y-2">
                          <div>
                            <span className="text-sm text-purple-700">Power Utilization:</span>
                            <div className="text-xl font-bold text-purple-800">{systemAnalysis.utilizationFactors.power.toFixed(1)}%</div>
                          </div>
                          <div>
                            <span className="text-sm text-purple-700">Voltage Utilization:</span>
                            <div className="text-lg font-medium text-purple-700">{systemAnalysis.utilizationFactors.voltage.toFixed(1)}%</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>                </Card>
              </div>
            )}
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="space-y-6">
            {!systemAnalysis && (
              <Card>
                <CardContent className="text-center py-12">
                  <Calculator className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Ready for Analysis</h3>
                  <p className="text-gray-600">
                    Configure your system in the Design tab to see detailed performance analysis.
                  </p>
                </CardContent>
              </Card>
            )}
            
            {systemAnalysis && (
              <Card>
                <CardContent className="text-center py-12">
                  <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Advanced Analysis</h3>
                  <p className="text-gray-600">
                    Performance analysis, cost calculations, and ROI projections coming soon...
                  </p>
                  <div className="mt-4">
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Compatibility Score: {systemAnalysis.compatibilityScore || 0}/100
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
