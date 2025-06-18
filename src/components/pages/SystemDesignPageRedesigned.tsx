'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  AlertTriangle, 
  CheckCircle, 
  Zap, 
  Settings, 
  Calculator, 
  TrendingUp, 
  Plus, 
  Trash2, 
  Copy,
  ArrowRight,
  Info
} from 'lucide-react';
import { usePanelPresets, useInverterPresets } from '@/hooks/useDatabase';
import { PanelPreset, InverterPreset, StringConfiguration, MixedSystemConfiguration, SystemAnalysisResult } from '@/types';
import { 
  calculateSystemParameters, 
  calculateMixedPanelSystem,
  validateSystemCompatibility
} from '@/lib/calculations';

// Enhanced system configuration state
interface SystemDesignState {
  // Basic configuration
  selectedInverter: InverterPreset | null;
  numInverters: number;
  systemEfficiency: number;
  
  // Configuration mode
  configurationMode: 'uniform' | 'mixed';
  
  // Uniform configuration
  uniformConfig: {
    selectedPanel: PanelPreset | null;
    seriesConfig: number;
    parallelConfig: number;
  };
  
  // Mixed configuration
  mixedConfig: {
    stringConfigurations: StringConfiguration[];
  };
}

export default function SystemDesignPageRedesigned() {
  const { presets: panels, loading: panelsLoading } = usePanelPresets();
  const { inverters, loading: invertersLoading } = useInverterPresets();
  
  const [systemConfig, setSystemConfig] = useState<SystemDesignState>({
    selectedInverter: null,
    numInverters: 1,
    systemEfficiency: 85,
    configurationMode: 'uniform',
    uniformConfig: {
      selectedPanel: null,
      seriesConfig: 10,
      parallelConfig: 2
    },
    mixedConfig: {
      stringConfigurations: []
    }
  });

  const [activeTab, setActiveTab] = useState('design');

  // Calculate total strings needed
  const totalStringsNeeded = useMemo(() => {
    return systemConfig.uniformConfig.parallelConfig * systemConfig.numInverters;
  }, [systemConfig.uniformConfig.parallelConfig, systemConfig.numInverters]);

  // System analysis with proper separation of concerns
  const systemAnalysis = useMemo(() => {
    if (!systemConfig.selectedInverter) return null;

    const inverter = systemConfig.selectedInverter;

    try {
      if (systemConfig.configurationMode === 'mixed') {
        // Mixed panel system
        if (systemConfig.mixedConfig.stringConfigurations.length === 0) return null;

        const mixedSystemConfig: MixedSystemConfiguration = {
          strings: systemConfig.mixedConfig.stringConfigurations,
          numInverters: systemConfig.numInverters,
          systemEfficiency: systemConfig.systemEfficiency
        };

        const systemCalc = calculateMixedPanelSystem(inverter, mixedSystemConfig);
        const compatibility = validateSystemCompatibility(
          systemConfig.mixedConfig.stringConfigurations[0]?.panelPreset,
          inverter,
          systemCalc
        );

        return {
          ...systemCalc,
          ...compatibility,
          mode: 'mixed' as const,
          totalInverterCapacity: systemConfig.numInverters * inverter.ratedPower
        };
      } else {
        // Uniform panel system
        if (!systemConfig.uniformConfig.selectedPanel) return null;

        const panel = systemConfig.uniformConfig.selectedPanel;
        const systemCalc = calculateSystemParameters(
          panel,
          inverter,
          systemConfig.uniformConfig.seriesConfig,
          systemConfig.uniformConfig.parallelConfig,
          systemConfig.numInverters,
          systemConfig.systemEfficiency
        );

        const compatibility = validateSystemCompatibility(panel, inverter, systemCalc);

        return {
          ...systemCalc,
          ...compatibility,
          mode: 'uniform' as const,
          totalInverterCapacity: systemConfig.numInverters * inverter.ratedPower
        };
      }
    } catch (error) {
      console.error('System analysis error:', error);
      return null;
    }
  }, [systemConfig]);

  // Event handlers
  const handleInverterChange = (inverterId: string) => {
    const inverter = inverters.find((i: InverterPreset) => i.id === inverterId);
    setSystemConfig(prev => ({ ...prev, selectedInverter: inverter || null }));
  };

  const handleUniformPanelChange = (panelId: string) => {
    const panel = panels.find((p: PanelPreset) => p.id === panelId);
    setSystemConfig(prev => ({
      ...prev,
      uniformConfig: { ...prev.uniformConfig, selectedPanel: panel || null }
    }));
  };

  const handleConfigurationModeChange = (mode: 'uniform' | 'mixed') => {
    setSystemConfig(prev => {
      const newConfig = { ...prev, configurationMode: mode };
      
      // Initialize mixed configuration if switching to mixed mode
      if (mode === 'mixed' && prev.uniformConfig.selectedPanel) {
        newConfig.mixedConfig.stringConfigurations = Array.from(
          { length: totalStringsNeeded },
          (_, i) => ({
            stringId: i + 1,
            inverterId: Math.floor(i / prev.uniformConfig.parallelConfig) + 1,
            panelPreset: prev.uniformConfig.selectedPanel!,
            panelCount: prev.uniformConfig.seriesConfig
          })
        );
      }
      
      return newConfig;
    });
  };

  const addStringConfiguration = () => {
    if (!systemConfig.uniformConfig.selectedPanel) return;
    
    const newStringId = systemConfig.mixedConfig.stringConfigurations.length + 1;
    const inverterId = Math.floor((newStringId - 1) / systemConfig.uniformConfig.parallelConfig) + 1;
    
    setSystemConfig(prev => ({
      ...prev,
      mixedConfig: {
        stringConfigurations: [
          ...prev.mixedConfig.stringConfigurations,
          {
            stringId: newStringId,
            inverterId,
            panelPreset: prev.uniformConfig.selectedPanel!,
            panelCount: prev.uniformConfig.seriesConfig
          }
        ]
      }
    }));
  };

  const removeStringConfiguration = (stringId: number) => {
    setSystemConfig(prev => ({
      ...prev,
      mixedConfig: {
        stringConfigurations: prev.mixedConfig.stringConfigurations
          .filter(s => s.stringId !== stringId)
          .map((s, index) => ({ ...s, stringId: index + 1 })) // Re-index
      }
    }));
  };

  const updateStringConfiguration = (stringId: number, updates: Partial<StringConfiguration>) => {
    setSystemConfig(prev => ({
      ...prev,
      mixedConfig: {
        stringConfigurations: prev.mixedConfig.stringConfigurations.map(s =>
          s.stringId === stringId ? { ...s, ...updates } : s
        )
      }
    }));
  };

  const duplicateString = (stringId: number) => {
    const stringToDuplicate = systemConfig.mixedConfig.stringConfigurations.find(s => s.stringId === stringId);
    if (!stringToDuplicate) return;

    const newStringId = systemConfig.mixedConfig.stringConfigurations.length + 1;
    const inverterId = Math.floor((newStringId - 1) / systemConfig.uniformConfig.parallelConfig) + 1;
    
    setSystemConfig(prev => ({
      ...prev,
      mixedConfig: {
        stringConfigurations: [
          ...prev.mixedConfig.stringConfigurations,
          {
            ...stringToDuplicate,
            stringId: newStringId,
            inverterId
          }
        ]
      }
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
            ⚡ Advanced System Design Studio
          </h1>
          <p className="text-lg text-gray-600">
            Design uniform or mixed solar PV systems with comprehensive validation
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
            {/* Configuration Mode Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Settings className="w-4 h-4 text-purple-600" />
                  </div>
                  Configuration Mode
                </CardTitle>
                <CardDescription>
                  Choose between uniform panels or mixed panel configurations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="uniform-mode"
                      checked={systemConfig.configurationMode === 'uniform'}
                      onCheckedChange={(checked) => 
                        handleConfigurationModeChange(checked ? 'uniform' : 'mixed')
                      }
                    />
                    <Label htmlFor="uniform-mode" className="font-medium">
                      Uniform Panels
                    </Label>
                    <span className="text-sm text-gray-600">
                      (Same panel type across all strings)
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="mixed-mode"
                      checked={systemConfig.configurationMode === 'mixed'}
                      onCheckedChange={(checked) => 
                        handleConfigurationModeChange(checked ? 'mixed' : 'uniform')
                      }
                    />
                    <Label htmlFor="mixed-mode" className="font-medium">
                      Mixed Panels
                    </Label>
                    <span className="text-sm text-gray-600">
                      (Different panel types per string)
                    </span>
                  </div>
                </div>
                
                <div className={`mt-4 p-4 rounded-lg border-2 ${
                  systemConfig.configurationMode === 'mixed' 
                    ? 'bg-orange-50 border-orange-200' 
                    : 'bg-blue-50 border-blue-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-4 h-4" />
                    <span className="font-medium">
                      {systemConfig.configurationMode === 'mixed' ? 'Mixed Panel Mode' : 'Uniform Panel Mode'}
                    </span>
                  </div>
                  <p className="text-sm">
                    {systemConfig.configurationMode === 'mixed'
                      ? 'Configure different panel types for each string. This allows for maximum flexibility but requires careful voltage matching.'
                      : 'All strings use the same panel type and configuration. This is the most common and straightforward approach.'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Basic System Configuration */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Inverter Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <Zap className="w-4 h-4 text-green-600" />
                    </div>
                    Inverter Configuration
                  </CardTitle>
                  <CardDescription>
                    Select your inverter and system parameters
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

                  <div className="grid grid-cols-2 gap-4">
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
                    </div>
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

              {/* System Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Calculator className="w-4 h-4 text-blue-600" />
                    </div>
                    System Overview
                  </CardTitle>
                  <CardDescription>
                    Current system configuration summary
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {systemAnalysis ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-blue-50 p-3 rounded">
                          <span className="text-blue-600 font-medium">Total Power</span>
                          <div className="text-2xl font-bold text-blue-800">
                            {(systemAnalysis.totalSystemPower / 1000).toFixed(1)} kW
                          </div>
                        </div>
                        <div className="bg-green-50 p-3 rounded">
                          <span className="text-green-600 font-medium">System Voltage</span>
                          <div className="text-2xl font-bold text-green-800">
                            {systemAnalysis.totalSystemVoltage.toFixed(1)} V
                          </div>
                        </div>
                        <div className="bg-purple-50 p-3 rounded">
                          <span className="text-purple-600 font-medium">Total Current</span>
                          <div className="text-2xl font-bold text-purple-800">
                            {systemAnalysis.totalSystemCurrent.toFixed(1)} A
                          </div>
                        </div>
                        <div className="bg-orange-50 p-3 rounded">
                          <span className="text-orange-600 font-medium">DC/AC Ratio</span>
                          <div className="text-2xl font-bold text-orange-800">
                            {(systemAnalysis.totalSystemPower / systemAnalysis.totalInverterCapacity).toFixed(2)}
                          </div>
                        </div>
                      </div>
                      
                      <div className={`p-3 rounded-lg ${
                        systemAnalysis.isCompatible 
                          ? 'bg-green-50 border border-green-200' 
                          : 'bg-red-50 border border-red-200'
                      }`}>
                        <div className="flex items-center gap-2">
                          {systemAnalysis.isCompatible ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                          )}
                          <span className={`font-medium ${
                            systemAnalysis.isCompatible ? 'text-green-900' : 'text-red-900'
                          }`}>
                            {systemAnalysis.isCompatible ? 'System Compatible' : 'Issues Found'}
                          </span>
                          <Badge variant="outline" className="ml-auto">
                            Score: {systemAnalysis.compatibilityScore}/100
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Calculator className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p>Select an inverter to see system overview</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Panel Configuration */}
            {systemConfig.configurationMode === 'uniform' ? (
              <UniformPanelConfiguration
                config={systemConfig.uniformConfig}
                panels={panels}
                onPanelChange={handleUniformPanelChange}
                onConfigChange={(updates) => setSystemConfig(prev => ({
                  ...prev,
                  uniformConfig: { ...prev.uniformConfig, ...updates }
                }))}
                totalStringsNeeded={totalStringsNeeded}
              />
            ) : (
              <MixedPanelConfiguration
                config={systemConfig.mixedConfig}
                uniformConfig={systemConfig.uniformConfig}
                panels={panels}
                totalStringsNeeded={totalStringsNeeded}
                onAddString={addStringConfiguration}
                onRemoveString={removeStringConfiguration}
                onUpdateString={updateStringConfiguration}
                onDuplicateString={duplicateString}
              />
            )}
          </TabsContent>

          {/* Validation Tab */}
          <TabsContent value="validation" className="space-y-6">
            <ValidationResults systemAnalysis={systemAnalysis} />
          </TabsContent>

          {/* Calculations Tab */}
          <TabsContent value="calculations" className="space-y-6">
            <CalculationResults 
              systemAnalysis={systemAnalysis} 
              configMode={systemConfig.configurationMode}
            />
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="space-y-6">
            <AnalysisResults systemAnalysis={systemAnalysis} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Component for uniform panel configuration
interface UniformPanelConfigurationProps {
  config: SystemDesignState['uniformConfig'];
  panels: PanelPreset[];
  onPanelChange: (panelId: string) => void;
  onConfigChange: (updates: Partial<SystemDesignState['uniformConfig']>) => void;
  totalStringsNeeded: number;
}

function UniformPanelConfiguration({ 
  config, 
  panels, 
  onPanelChange, 
  onConfigChange,
  totalStringsNeeded 
}: UniformPanelConfigurationProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-blue-600" />
          </div>
          Uniform Panel Configuration
        </CardTitle>
        <CardDescription>
          Configure identical panels across all strings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Panel Selection */}
        <div>
          <Label htmlFor="panel-select">Panel Model</Label>
          <Select onValueChange={onPanelChange}>
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

        {/* String Configuration */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="series-config">Panels per String</Label>
            <Input
              id="series-config"
              type="number"
              min="1"
              max="30"
              value={config.seriesConfig}
              onChange={(e) => onConfigChange({ seriesConfig: parseInt(e.target.value) || 1 })}
            />
          </div>
          <div>
            <Label htmlFor="parallel-config">Strings per Inverter</Label>
            <Input
              id="parallel-config"
              type="number"
              min="1"
              max="20"
              value={config.parallelConfig}
              onChange={(e) => onConfigChange({ parallelConfig: parseInt(e.target.value) || 1 })}
            />
          </div>
        </div>

        {/* Panel Specifications */}
        {config.selectedPanel && (
          <div className="bg-blue-50 p-4 rounded-lg space-y-2">
            <h4 className="font-medium text-blue-900">Panel Specifications</h4>
            <div className="grid grid-cols-3 gap-2 text-sm text-blue-800">
              <div>Power: {config.selectedPanel.power}W</div>
              <div>Voltage: {config.selectedPanel.voltage}V</div>
              <div>Current: {config.selectedPanel.current}A</div>
              <div>VOC: {config.selectedPanel.voc}V</div>
              <div>ISC: {config.selectedPanel.isc}A</div>
              <div>Efficiency: {config.selectedPanel.efficiency}%</div>
            </div>
          </div>
        )}

        {/* Configuration Summary */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Configuration Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Total Strings:</span>
              <div className="font-bold text-lg">{totalStringsNeeded}</div>
            </div>
            <div>
              <span className="text-gray-600">Total Panels:</span>
              <div className="font-bold text-lg">{config.seriesConfig * totalStringsNeeded}</div>
            </div>
            <div>
              <span className="text-gray-600">Configuration:</span>
              <div className="font-bold text-lg">{config.seriesConfig}S × {config.parallelConfig}P</div>
            </div>
            <div>
              <span className="text-gray-600">Total Power:</span>
              <div className="font-bold text-lg">
                {config.selectedPanel ? 
                  ((config.seriesConfig * totalStringsNeeded * config.selectedPanel.power) / 1000).toFixed(1) : 
                  '0'} kW
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Component for mixed panel configuration
interface MixedPanelConfigurationProps {
  config: SystemDesignState['mixedConfig'];
  uniformConfig: SystemDesignState['uniformConfig'];
  panels: PanelPreset[];
  totalStringsNeeded: number;
  onAddString: () => void;
  onRemoveString: (stringId: number) => void;
  onUpdateString: (stringId: number, updates: Partial<StringConfiguration>) => void;
  onDuplicateString: (stringId: number) => void;
}

function MixedPanelConfiguration({ 
  config, 
  uniformConfig,
  panels, 
  totalStringsNeeded,
  onAddString,
  onRemoveString,
  onUpdateString,
  onDuplicateString
}: MixedPanelConfigurationProps) {
  const canAddMore = config.stringConfigurations.length < totalStringsNeeded;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <Settings className="w-4 h-4 text-orange-600" />
            </div>
            Mixed Panel Configuration
          </div>
          <Badge variant="outline">
            {config.stringConfigurations.length} / {totalStringsNeeded} strings
          </Badge>
        </CardTitle>
        <CardDescription>
          Configure different panel types for each string
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add String Button */}
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Configure each string individually with different panel types
          </p>
          <Button 
            onClick={onAddString} 
            disabled={!canAddMore || !uniformConfig.selectedPanel}
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add String
          </Button>
        </div>

        {/* String Configurations */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {config.stringConfigurations.map((stringConfig) => (
            <div key={stringConfig.stringId} className="bg-gray-50 p-4 rounded-lg border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-white">
                    String {stringConfig.stringId}
                  </Badge>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                    Inverter {stringConfig.inverterId}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDuplicateString(stringConfig.stringId)}
                    className="px-2"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRemoveString(stringConfig.stringId)}
                    className="px-2 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <Label className="text-xs text-gray-600">Panel Type</Label>
                  <Select
                    value={stringConfig.panelPreset.id}
                    onValueChange={(panelId) => {
                      const panel = panels.find(p => p.id === panelId);
                      if (panel) {
                        onUpdateString(stringConfig.stringId, { panelPreset: panel });
                      }
                    }}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
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
                
                <div>
                  <Label className="text-xs text-gray-600">Panel Count</Label>
                  <Input
                    type="number"
                    min="1"
                    max="30"
                    value={stringConfig.panelCount}
                    onChange={(e) => 
                      onUpdateString(stringConfig.stringId, { 
                        panelCount: parseInt(e.target.value) || 1 
                      })
                    }
                    className="h-8"
                  />
                </div>
              </div>

              {/* String Calculations */}
              <div className="mt-3 grid grid-cols-4 gap-2 text-xs text-gray-600">
                <div className="bg-white p-2 rounded">
                  <span className="block text-gray-500">Voltage</span>
                  <span className="font-medium">
                    {(stringConfig.panelPreset.voltage * stringConfig.panelCount).toFixed(1)}V
                  </span>
                </div>
                <div className="bg-white p-2 rounded">
                  <span className="block text-gray-500">Current</span>
                  <span className="font-medium">
                    {stringConfig.panelPreset.current.toFixed(1)}A
                  </span>
                </div>
                <div className="bg-white p-2 rounded">
                  <span className="block text-gray-500">Power</span>
                  <span className="font-medium">
                    {((stringConfig.panelPreset.power * stringConfig.panelCount) / 1000).toFixed(1)}kW
                  </span>
                </div>
                <div className="bg-white p-2 rounded">
                  <span className="block text-gray-500">VOC</span>
                  <span className="font-medium">
                    {(stringConfig.panelPreset.voc * stringConfig.panelCount).toFixed(1)}V
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Configuration Summary */}
        {config.stringConfigurations.length > 0 && (
          <div className="bg-orange-50 p-4 rounded-lg">
            <h4 className="font-medium text-orange-900 mb-2">Mixed Configuration Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-orange-800">
              <div>
                <span className="text-orange-600">Total Strings:</span>
                <div className="font-bold">{config.stringConfigurations.length}</div>
              </div>
              <div>
                <span className="text-orange-600">Total Panels:</span>
                <div className="font-bold">
                  {config.stringConfigurations.reduce((sum, s) => sum + s.panelCount, 0)}
                </div>
              </div>
              <div>
                <span className="text-orange-600">Total Power:</span>
                <div className="font-bold">
                  {(config.stringConfigurations.reduce((sum, s) => 
                    sum + (s.panelPreset.power * s.panelCount), 0) / 1000).toFixed(1)}kW
                </div>
              </div>
              <div>
                <span className="text-orange-600">Voltage Range:</span>
                <div className="font-bold text-xs">
                  {config.stringConfigurations.length > 1 ? (
                    <>
                      {Math.min(...config.stringConfigurations.map(s => 
                        s.panelPreset.voltage * s.panelCount)).toFixed(0)}V - 
                      {Math.max(...config.stringConfigurations.map(s => 
                        s.panelPreset.voltage * s.panelCount)).toFixed(0)}V
                    </>
                  ) : (
                    config.stringConfigurations[0] ? 
                      `${(config.stringConfigurations[0].panelPreset.voltage * config.stringConfigurations[0].panelCount).toFixed(0)}V` : 
                      'N/A'
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Validation Results Component
function ValidationResults({ systemAnalysis }: { systemAnalysis: SystemAnalysisResult | null }) {
  if (!systemAnalysis) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Configure Your System</h3>
          <p className="text-gray-600">
            Select an inverter and configure panels to see validation results.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
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
            <div className={`p-4 rounded-lg ${
              systemAnalysis.isCompatible ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {systemAnalysis.isCompatible ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                )}
                <span className={`font-medium ${systemAnalysis.isCompatible ? 'text-green-900' : 'text-red-900'}`}>
                  {systemAnalysis.isCompatible ? 'System Compatible' : 'Compatibility Issues Found'}
                </span>
                <Badge variant="outline" className="ml-auto">
                  Score: {systemAnalysis.compatibilityScore}/100
                </Badge>
              </div>
              <p className={`text-sm ${systemAnalysis.isCompatible ? 'text-green-700' : 'text-red-700'}`}>
                {systemAnalysis.isCompatible ? 
                  'Your system configuration is compatible and safe to install.' :
                  'Please review and fix the issues below before proceeding.'
                }
              </p>
            </div>

            {/* Issues */}
            {systemAnalysis.issues && systemAnalysis.issues.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-red-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Critical Issues
                </h4>
                {systemAnalysis.issues.map((issue: string, index: number) => (
                  <div key={index} className="bg-red-50 border border-red-200 p-3 rounded text-sm text-red-800">
                    {issue}
                  </div>
                ))}
              </div>
            )}

            {/* Warnings */}
            {systemAnalysis.warnings && systemAnalysis.warnings.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-yellow-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Warnings
                </h4>
                {systemAnalysis.warnings.map((warning: string, index: number) => (
                  <div key={index} className="bg-yellow-50 border border-yellow-200 p-3 rounded text-sm text-yellow-800">
                    {warning}
                  </div>
                ))}
              </div>
            )}

            {/* Recommendations */}
            {systemAnalysis.recommendations && systemAnalysis.recommendations.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-blue-900 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Recommendations
                </h4>
                {systemAnalysis.recommendations.map((rec: string, index: number) => (
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
            Key electrical parameters and safety margins
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">System Voltage:</span>
                <div className="font-medium">{systemAnalysis.totalSystemVoltage.toFixed(1)}V</div>
              </div>
              <div>
                <span className="text-gray-600">System Current:</span>
                <div className="font-medium">{systemAnalysis.totalSystemCurrent.toFixed(1)}A</div>
              </div>
              <div>
                <span className="text-gray-600">Total Power:</span>
                <div className="font-medium">{(systemAnalysis.totalSystemPower/1000).toFixed(1)}kW</div>
              </div>
              <div>
                <span className="text-gray-600">VOC:</span>
                <div className="font-medium">{systemAnalysis.totalSystemVoc.toFixed(1)}V</div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-2">Safety Margins</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span>Voltage:</span>
                  <span className={`font-medium ${
                    systemAnalysis.safetyMargins.voltageMargin < 10 ? 'text-red-600' :
                    systemAnalysis.safetyMargins.voltageMargin < 20 ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {systemAnalysis.safetyMargins.voltageMargin.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Current:</span>
                  <span className={`font-medium ${
                    systemAnalysis.safetyMargins.currentMargin < 10 ? 'text-red-600' :
                    systemAnalysis.safetyMargins.currentMargin < 20 ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {systemAnalysis.safetyMargins.currentMargin.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Power:</span>
                  <span className={`font-medium ${
                    systemAnalysis.safetyMargins.powerMargin < 10 ? 'text-red-600' :
                    systemAnalysis.safetyMargins.powerMargin < 20 ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {systemAnalysis.safetyMargins.powerMargin.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>VOC:</span>
                  <span className={`font-medium ${
                    systemAnalysis.safetyMargins.vocMargin < 10 ? 'text-red-600' :
                    systemAnalysis.safetyMargins.vocMargin < 20 ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {systemAnalysis.safetyMargins.vocMargin.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Calculation Results Component
function CalculationResults({ systemAnalysis, configMode }: { 
  systemAnalysis: SystemAnalysisResult | null; 
  configMode: 'uniform' | 'mixed';
}) {
  if (!systemAnalysis) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Calculator className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Ready for Calculations</h3>
          <p className="text-gray-600">
            Configure your system to see detailed electrical calculations.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
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
                <div className="text-2xl font-bold text-blue-700">
                  {systemAnalysis.totalSystemVoltage.toFixed(1)}V
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-600">Open Circuit (VOC):</span>
                <div className="text-lg font-medium text-blue-600">
                  {systemAnalysis.totalSystemVoc.toFixed(1)}V
                </div>
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
                <div className="text-2xl font-bold text-green-700">
                  {systemAnalysis.totalSystemCurrent.toFixed(1)}A
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-600">Short Circuit (ISC):</span>
                <div className="text-lg font-medium text-green-600">
                  {systemAnalysis.totalSystemIsc.toFixed(1)}A
                </div>
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
                <div className="text-2xl font-bold text-purple-700">
                  {(systemAnalysis.totalSystemPower/1000).toFixed(1)}kW
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-600">Efficiency:</span>
                <div className="text-lg font-medium text-purple-600">
                  {(systemAnalysis.derating.totalDerating * 100).toFixed(1)}%
                </div>
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
                <span className="text-sm text-gray-600">Mode:</span>
                <div className="text-xl font-bold text-orange-700 capitalize">
                  {configMode}
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-600">Inverters:</span>
                <div className="text-lg font-medium text-orange-600">
                  {systemAnalysis.perInverterBreakdown.length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Per-Inverter Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Per-Inverter Analysis</CardTitle>
          <CardDescription>Individual inverter loading and utilization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {systemAnalysis.perInverterBreakdown.map((inverterData, index: number) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-3 text-gray-900">
                  Inverter {inverterData.inverterId}
                </h4>
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
        </CardContent>
      </Card>

      {/* Per-String Breakdown for Mixed Configurations */}
      {configMode === 'mixed' && systemAnalysis.perStringBreakdown && systemAnalysis.perStringBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Per-String Analysis (Mixed Panels)</CardTitle>
            <CardDescription>Individual string performance and mismatch effects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {systemAnalysis.perStringBreakdown.map((stringData, index: number) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">String {stringData.stringId}</h4>
                    <Badge variant="outline" className="text-xs">
                      Inverter {stringData.inverterId}
                    </Badge>
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
                        <div className="text-yellow-800 font-medium text-xs">Mismatch Impact</div>
                        <div className="text-yellow-700 text-xs">
                          Power Loss: {(stringData.powerLossFromMismatch/1000).toFixed(1)}kW 
                          ({stringData.efficiencyImpact.toFixed(1)}%)
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Analysis Results Component
function AnalysisResults({ systemAnalysis }: { systemAnalysis: SystemAnalysisResult | null }) {
  if (!systemAnalysis) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Ready for Analysis</h3>
          <p className="text-gray-600">
            Configure your system to see detailed performance analysis.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="text-center py-12">
        <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Advanced Analysis</h3>
        <p className="text-gray-600 mb-4">
          Performance analysis, cost calculations, and ROI projections coming soon...
        </p>
        
        <div className="flex justify-center gap-4">
          <Badge variant="outline" className="text-green-600 border-green-600">
            Compatibility Score: {systemAnalysis.compatibilityScore}/100
          </Badge>
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            Mode: {systemAnalysis.mode}
          </Badge>
          <Badge variant="outline" className="text-purple-600 border-purple-600">
            Power: {(systemAnalysis.totalSystemPower/1000).toFixed(1)}kW
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
