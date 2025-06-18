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
import { AlertTriangle, CheckCircle, Zap, Settings, Calculator, TrendingUp } from 'lucide-react';
import { usePanelPresets, useInverterPresets } from '@/hooks/useDatabase';
import { PanelPreset, InverterPreset } from '@/types';

interface SystemDesignState {
  selectedPanel: PanelPreset | null;
  selectedInverter: InverterPreset | null;
  numPanels: number;
  numInverters: number;
  seriesConfig: number;
  parallelConfig: number;
  systemEfficiency: number;
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
    systemEfficiency: 85
  });

  const [activeTab, setActiveTab] = useState('design');

  // Calculate system configuration and compatibility
  const systemAnalysis = useMemo(() => {
    if (!systemConfig.selectedPanel || !systemConfig.selectedInverter) {
      return null;
    }

    const panel = systemConfig.selectedPanel;
    const inverter = systemConfig.selectedInverter;
    
    // Calculate series string configuration
    const stringVoltage = panel.voltage * systemConfig.seriesConfig;
    const stringCurrent = panel.current;
    const stringPower = panel.power * systemConfig.seriesConfig;
    
    // Calculate total system power
    const totalSystemPower = systemConfig.numPanels * panel.power;
    const totalInverterCapacity = systemConfig.numInverters * inverter.ratedPower;
    
    // Voltage compatibility check
    const voltageCompatible = stringVoltage >= inverter.mpptVoltageRange.min && 
                            stringVoltage <= inverter.mpptVoltageRange.max;
    
    // Current compatibility check (per string)
    const currentCompatible = stringCurrent <= inverter.maxSolarCurrent;
    
    // Power compatibility check
    const powerPerInverter = totalSystemPower / systemConfig.numInverters;
    const powerCompatible = powerPerInverter <= inverter.maxPvPower;
    
    // VOC safety check
    const vocSafety = systemConfig.seriesConfig * panel.voc <= inverter.maxSolarVoltage;
    
    const issues: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];
    
    if (!voltageCompatible) {
      issues.push(`String voltage (${stringVoltage.toFixed(1)}V) outside inverter MPPT range (${inverter.mpptVoltageRange.min}-${inverter.mpptVoltageRange.max}V)`);
    }
    
    if (!currentCompatible) {
      issues.push(`String current (${stringCurrent.toFixed(1)}A) exceeds inverter maximum (${inverter.maxSolarCurrent}A)`);
    }
    
    if (!powerCompatible) {
      issues.push(`Power per inverter (${(powerPerInverter/1000).toFixed(1)}kW) exceeds inverter PV capacity (${(inverter.maxPvPower/1000).toFixed(1)}kW)`);
    }
    
    if (!vocSafety) {
      issues.push(`Open circuit voltage (${(systemConfig.seriesConfig * panel.voc).toFixed(1)}V) exceeds inverter maximum (${inverter.maxSolarVoltage}V)`);
    }
    
    // Utilization warnings
    const voltageUtilization = (stringVoltage / inverter.mpptVoltageRange.max) * 100;
    const currentUtilization = (stringCurrent / inverter.maxSolarCurrent) * 100;
    const powerUtilization = (powerPerInverter / inverter.maxPvPower) * 100;
    
    if (voltageUtilization < 50) {
      warnings.push(`Low voltage utilization (${voltageUtilization.toFixed(1)}%) - consider more panels per string`);
    }
    
    if (powerUtilization < 70) {
      recommendations.push(`Consider increasing array size for better inverter utilization`);
    }
    
    if (powerUtilization > 130) {
      warnings.push(`Array oversizing (${powerUtilization.toFixed(1)}%) may cause power clipping`);
    }

    const isCompatible = voltageCompatible && currentCompatible && powerCompatible && vocSafety;

    return {
      stringVoltage,
      stringCurrent,
      stringPower,
      totalSystemPower,
      totalInverterCapacity,
      powerPerInverter,
      isCompatible,
      voltageCompatible,
      currentCompatible,
      powerCompatible,
      vocSafety,
      issues,
      warnings,
      recommendations,
      utilizationFactors: {
        voltage: voltageUtilization,
        current: currentUtilization,
        power: powerUtilization
      }
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
                  </div>
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
          </TabsContent>

          {/* Calculations Tab */}
          <TabsContent value="calculations" className="space-y-6">
            {systemAnalysis && systemConfig.selectedPanel && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Series Configuration */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-blue-600">Series Configuration</CardTitle>
                    <CardDescription>
                      {systemConfig.seriesConfig} panels in series per string
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">Voltage (Vmp):</span>
                          <div className="font-medium">{systemAnalysis.stringVoltage.toFixed(1)}V</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Current (Imp):</span>
                          <div className="font-medium">{systemAnalysis.stringCurrent.toFixed(1)}A</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Power:</span>
                          <div className="font-medium">{(systemAnalysis.stringPower/1000).toFixed(1)}kW</div>
                        </div>
                        <div>
                          <span className="text-gray-600">VOC:</span>
                          <div className="font-medium">{(systemConfig.seriesConfig * systemConfig.selectedPanel.voc).toFixed(1)}V</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Parallel Configuration */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-green-600">Parallel Configuration</CardTitle>
                    <CardDescription>
                      {systemConfig.parallelConfig} strings in parallel
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">Voltage (Vmp):</span>
                          <div className="font-medium">{systemAnalysis.stringVoltage.toFixed(1)}V</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Current (Imp):</span>
                          <div className="font-medium">{(systemAnalysis.stringCurrent * systemConfig.parallelConfig).toFixed(1)}A</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Power:</span>
                          <div className="font-medium">{(systemAnalysis.stringPower * systemConfig.parallelConfig / 1000).toFixed(1)}kW</div>
                        </div>
                        <div>
                          <span className="text-gray-600">ISC:</span>
                          <div className="font-medium">{(systemConfig.selectedPanel.isc * systemConfig.parallelConfig).toFixed(1)}A</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Total System */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-purple-600">Total System</CardTitle>
                    <CardDescription>
                      Complete system with {systemConfig.numInverters} inverter(s)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">Total Panels:</span>
                          <div className="font-medium">{systemConfig.seriesConfig * systemConfig.parallelConfig * systemConfig.numInverters}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Total Power:</span>
                          <div className="font-medium">{(systemAnalysis.totalSystemPower/1000).toFixed(1)}kW</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Inverter Capacity:</span>
                          <div className="font-medium">{(systemAnalysis.totalInverterCapacity/1000).toFixed(1)}kW</div>
                        </div>
                        <div>
                          <span className="text-gray-600">DC/AC Ratio:</span>
                          <div className="font-medium">{(systemAnalysis.totalSystemPower / systemAnalysis.totalInverterCapacity).toFixed(2)}</div>
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
                  <Calculator className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Ready for Calculations</h3>
                  <p className="text-gray-600">
                    Configure your system in the Design tab to see detailed electrical calculations.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="space-y-6">
            <Card>
              <CardContent className="text-center py-12">
                <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Advanced Analysis</h3>
                <p className="text-gray-600">
                  Performance analysis, cost calculations, and ROI projections coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
