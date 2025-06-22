'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  Trash2, 
  Zap, 
  Settings, 
  Calculator, 
  Sun,
  Copy,
  ArrowDown,
  ArrowRight
} from 'lucide-react';
import { usePanelPresets, useInverterPresets } from '@/hooks/useDatabase';
import { PanelPreset, InverterPreset } from '@/types';

// Panel configuration for a string
interface PanelConfig {
  id: string;
  type: 'preset' | 'custom';
  preset?: PanelPreset;
  customSpecs?: {
    name: string;
    voltage: number; // Vmp
    current: number; // Imp
    power: number;   // Pmp
    voc: number;     // Open circuit voltage
    isc: number;     // Short circuit current
    maxSeriesFuse: number;
    maxSystemVoltage: number;
  };
  count: number; // Number of this panel type in the string
}

// String configuration
interface StringConfig {
  id: string;
  name: string;
  connectionType: 'series' | 'parallel';
  panels: PanelConfig[]; // Multiple panel types can be in one string
  totalPanels: number;   // Total panels in string
  uniformPanels: boolean; // All panels same type or mixed
}

// System state
interface SystemState {
  selectedInverter: InverterPreset | null;
  strings: StringConfig[];
  stringConnectionType: 'series' | 'parallel'; // How strings connect to each other
  systemEfficiency: number;
}

// String calculation results
interface StringResults {
  stringId: string;
  totalVoltage: number; // String voltage (Vmp)
  totalCurrent: number; // String current (Imp)
  totalPower: number;   // String power
  totalVoc: number;     // String open circuit voltage
  totalIsc: number;     // String short circuit current
  panelBreakdown: {
    panelId: string;
    count: number;
    voltage: number;
    current: number;
    power: number;
  }[];
}

export default function SystemDesign() {
  const { presets: panels, loading: panelsLoading } = usePanelPresets();
  const { inverters, loading: invertersLoading } = useInverterPresets();

  const [system, setSystem] = useState<SystemState>({
    selectedInverter: null,
    strings: [],
    stringConnectionType: 'parallel',
    systemEfficiency: 85,
  });

  // Add a new string
  const addString = () => {
    const newString: StringConfig = {
      id: `string-${Date.now()}`,
      name: `String ${system.strings.length + 1}`,
      connectionType: 'series',
      panels: [],
      totalPanels: 0,
      uniformPanels: true,
    };
    setSystem(prev => ({
      ...prev,
      strings: [...prev.strings, newString]
    }));
  };

  // Remove a string
  const removeString = (stringId: string) => {
    setSystem(prev => ({
      ...prev,
      strings: prev.strings.filter(s => s.id !== stringId)
    }));
  };

  // Duplicate a string
  const duplicateString = (stringId: string) => {
    const originalString = system.strings.find(s => s.id === stringId);
    if (!originalString) return;

    const duplicatedString: StringConfig = {
      ...originalString,
      id: `string-${Date.now()}`,
      name: `${originalString.name} (Copy)`,
      panels: originalString.panels.map(panel => ({
        ...panel,
        id: `panel-${Date.now()}-${Math.random()}`
      }))
    };

    setSystem(prev => ({
      ...prev,
      strings: [...prev.strings, duplicatedString]
    }));
  };

  // Update string property
  const updateString = (stringId: string, updates: Partial<StringConfig>) => {
    setSystem(prev => ({
      ...prev,
      strings: prev.strings.map(s => 
        s.id === stringId ? { ...s, ...updates } : s
      )
    }));
  };

  // Add panel to string
  const addPanelToString = (stringId: string) => {
    const newPanel: PanelConfig = {
      id: `panel-${Date.now()}`,
      type: 'preset',
      preset: panels[0] || undefined,
      count: 1,
    };

    setSystem(prev => ({
      ...prev,
      strings: prev.strings.map(s => 
        s.id === stringId 
          ? { 
              ...s, 
              panels: [...s.panels, newPanel],
              totalPanels: s.totalPanels + 1
            } 
          : s
      )
    }));
  };

  // Remove panel from string
  const removePanelFromString = (stringId: string, panelId: string) => {
    setSystem(prev => ({
      ...prev,
      strings: prev.strings.map(s => 
        s.id === stringId 
          ? { 
              ...s, 
              panels: s.panels.filter(p => p.id !== panelId),
              totalPanels: Math.max(0, s.totalPanels - (s.panels.find(p => p.id === panelId)?.count || 0))
            } 
          : s
      )
    }));
  };

  // Update panel in string
  const updatePanelInString = (stringId: string, panelId: string, updates: Partial<PanelConfig>) => {
    setSystem(prev => ({
      ...prev,
      strings: prev.strings.map(s => 
        s.id === stringId 
          ? {
              ...s,
              panels: s.panels.map(p => 
                p.id === panelId ? { ...p, ...updates } : p
              ),
              totalPanels: s.panels.reduce((sum, panel) => 
                sum + (panel.id === panelId ? (updates.count ?? panel.count) : panel.count), 0
              )
            }
          : s
      )
    }));
  };

  // Calculate string results
  const calculateStringResults = (stringConfig: StringConfig): StringResults => {
    let totalVoltage = 0;
    let totalCurrent = 0;
    let totalPower = 0;
    let totalVoc = 0;
    let totalIsc = 0;
    const panelBreakdown: StringResults['panelBreakdown'] = [];

    stringConfig.panels.forEach(panelConfig => {
      let panelSpecs;
      
      if (panelConfig.type === 'preset' && panelConfig.preset) {
        panelSpecs = panelConfig.preset;
      } else if (panelConfig.type === 'custom' && panelConfig.customSpecs) {
        panelSpecs = panelConfig.customSpecs;
      } else {
        return; // Skip invalid panels
      }

      const panelCount = panelConfig.count;
      
      if (stringConfig.connectionType === 'series') {
        // Series connection: voltages add, current stays same
        totalVoltage += panelSpecs.voltage * panelCount;
        totalCurrent = Math.max(totalCurrent, panelSpecs.current); // Use highest current
        totalVoc += panelSpecs.voc * panelCount;
        totalIsc = Math.max(totalIsc, panelSpecs.isc);
      } else {
        // Parallel connection: currents add, voltage stays same
        totalVoltage = Math.max(totalVoltage, panelSpecs.voltage);
        totalCurrent += panelSpecs.current * panelCount;
        totalVoc = Math.max(totalVoc, panelSpecs.voc);
        totalIsc += panelSpecs.isc * panelCount;
      }

      totalPower += panelSpecs.power * panelCount;

      panelBreakdown.push({
        panelId: panelConfig.id,
        count: panelCount,
        voltage: panelSpecs.voltage * (stringConfig.connectionType === 'series' ? panelCount : 1),
        current: panelSpecs.current * (stringConfig.connectionType === 'parallel' ? panelCount : 1),
        power: panelSpecs.power * panelCount
      });
    });

    return {
      stringId: stringConfig.id,
      totalVoltage,
      totalCurrent,
      totalPower,
      totalVoc,
      totalIsc,
      panelBreakdown
    };
  };

  // Calculate all string results
  const stringResults = useMemo(() => {
    return system.strings.map(stringConfig => calculateStringResults(stringConfig));
  }, [system.strings]);

  // Calculate combined system results
  const systemResults = useMemo(() => {
    if (stringResults.length === 0) return null;

    let systemVoltage = 0;
    let systemCurrent = 0;
    let systemPower = 0;
    let systemVoc = 0;
    let systemIsc = 0;

    if (system.stringConnectionType === 'series') {
      // Series connection of strings
      systemVoltage = stringResults.reduce((sum, str) => sum + str.totalVoltage, 0);
      systemCurrent = Math.min(...stringResults.map(str => str.totalCurrent));
      systemVoc = stringResults.reduce((sum, str) => sum + str.totalVoc, 0);
      systemIsc = Math.min(...stringResults.map(str => str.totalIsc));
    } else {
      // Parallel connection of strings
      systemVoltage = Math.min(...stringResults.map(str => str.totalVoltage));
      systemCurrent = stringResults.reduce((sum, str) => sum + str.totalCurrent, 0);
      systemVoc = Math.min(...stringResults.map(str => str.totalVoc));
      systemIsc = stringResults.reduce((sum, str) => sum + str.totalIsc, 0);
    }

    systemPower = stringResults.reduce((sum, str) => sum + str.totalPower, 0);

    const totalPanels = system.strings.reduce((sum, str) => sum + str.totalPanels, 0);

    return {
      systemVoltage,
      systemCurrent,
      systemPower,
      systemVoc,
      systemIsc,
      totalPanels,
      efficiency: system.systemEfficiency / 100,
      effectivePower: systemPower * (system.systemEfficiency / 100)
    };
  }, [stringResults, system.stringConnectionType, system.systemEfficiency, system.strings]);

  if (panelsLoading || invertersLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-3 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            Advanced Solar System Designer
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto px-4">
            Design complex solar systems with multiple configurable strings
          </p>
        </div>        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 lg:gap-6 xl:gap-8 pb-80 xl:pb-0">
          {/* Main Configuration Area */}
          <div className="xl:col-span-3 space-y-4 lg:space-y-6">
            {/* System Configuration */}
            <Card className="shadow-lg border-0 dark:border dark:border-gray-700">
              <CardHeader className="bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-t-lg p-4 lg:p-6">
                <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
                  <Settings className="w-4 h-4 lg:w-5 lg:h-5" />
                  System Configuration
                </CardTitle>
                <CardDescription className="text-green-100 text-sm lg:text-base">
                  Configure your inverter and system-level settings
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 lg:p-6 space-y-4 lg:space-y-6 bg-white dark:bg-gray-800">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 lg:col-span-2">
                    <Label htmlFor="inverter-select" className="text-gray-700 dark:text-gray-300">Inverter Model</Label>
                    <Select onValueChange={(inverterId) => {
                      const inverter = inverters.find((i: InverterPreset) => i.id === inverterId);
                      setSystem(prev => ({ ...prev, selectedInverter: inverter || null }));
                    }}>
                      <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                        <SelectValue placeholder="Select an inverter..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                        {inverters.map((inverter: InverterPreset) => (
                          <SelectItem key={inverter.id} value={inverter.id} className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700">
                            <div className="flex items-center justify-between w-full">
                              <span>{inverter.name}</span>
                              <Badge variant="outline" className="ml-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                                {inverter.ratedPower}W
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="system-efficiency" className="text-gray-700 dark:text-gray-300">System Efficiency (%)</Label>
                    <Input
                      id="system-efficiency"
                      type="number"
                      min="70"
                      max="95"
                      value={system.systemEfficiency}
                      className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                      onChange={(e) => setSystem(prev => ({ 
                        ...prev, 
                        systemEfficiency: parseInt(e.target.value) || 85 
                      }))}
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-gray-700 dark:text-gray-300">String Connection Type</Label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mt-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="string-series"
                        checked={system.stringConnectionType === 'series'}
                        onCheckedChange={(checked) => 
                          setSystem(prev => ({ 
                            ...prev, 
                            stringConnectionType: checked ? 'series' : 'parallel' 
                          }))
                        }
                      />
                      <Label htmlFor="string-series" className="font-medium text-gray-700 dark:text-gray-300">
                        Series Connection
                      </Label>
                      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden sm:inline">
                        (Strings connected in series - voltages add)
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Switch
                        id="string-parallel"
                        checked={system.stringConnectionType === 'parallel'}
                        onCheckedChange={(checked) => 
                          setSystem(prev => ({ 
                            ...prev, 
                            stringConnectionType: checked ? 'parallel' : 'series' 
                          }))
                        }
                      />
                      <Label htmlFor="string-parallel" className="font-medium text-gray-700 dark:text-gray-300">
                        Parallel Connection
                      </Label>
                      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden sm:inline">
                        (Strings connected in parallel - currents add)
                      </span>
                    </div>
                  </div>
                </div>

                {system.selectedInverter && (
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                    <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">Inverter Specifications</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-4 text-xs sm:text-sm text-green-800 dark:text-green-200">
                      <div>Rated Power: {system.selectedInverter.ratedPower}W</div>
                      <div>Max Solar Voltage: {system.selectedInverter.maxSolarVoltage}V</div>
                      <div>Max Solar Current: {system.selectedInverter.maxSolarCurrent}A</div>
                      <div>MPPT Range: {system.selectedInverter.mpptVoltageRange.min}-{system.selectedInverter.mpptVoltageRange.max}V</div>
                      <div>Efficiency: {system.selectedInverter.efficiency}%</div>
                      <div>MPPT Channels: {system.selectedInverter.mpptChannels}</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>            {/* String Configurations */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">String Configurations</h2>
                <Button onClick={addString} className="flex items-center gap-2 w-full sm:w-auto bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
                  <Plus className="w-4 h-4" />
                  Add String
                </Button>
              </div>

              {system.strings.length === 0 && (
                <Card className="border-0 dark:border dark:border-gray-700">
                  <CardContent className="text-center py-8 lg:py-12 bg-white dark:bg-gray-800">
                    <Sun className="w-12 lg:w-16 h-12 lg:h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">No Strings Configured</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm lg:text-base max-w-md mx-auto">
                      Add your first string to start designing your solar system.
                    </p>
                    <Button onClick={addString} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
                      <Plus className="w-4 h-4" />
                      Add First String
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Render each string */}
              {system.strings.map((stringConfig, index) => {
                const stringResult = stringResults.find(r => r.stringId === stringConfig.id);
                
                return (
                  <Card key={stringConfig.id} className="shadow-lg border-l-4 border-l-blue-500 dark:border-l-blue-400 border-0 dark:border dark:border-gray-700">
                    <CardHeader className="bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 p-4 lg:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <CardTitle className="flex items-center gap-2 flex-1">
                          <div className="w-6 h-6 lg:w-8 lg:h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs lg:text-sm font-bold flex-shrink-0">
                            {index + 1}
                          </div>
                          <Input
                            value={stringConfig.name}
                            onChange={(e) => updateString(stringConfig.id, { name: e.target.value })}
                            className="bg-transparent border-none text-base lg:text-lg font-semibold p-0 h-auto text-gray-900 dark:text-gray-100 flex-1"
                          />
                        </CardTitle>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => duplicateString(stringConfig.id)}
                            className="flex items-center gap-1 text-xs lg:text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                          >
                            <Copy className="w-3 h-3" />
                            <span className="hidden sm:inline">Duplicate</span>
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeString(stringConfig.id)}
                            className="flex items-center gap-1 text-xs lg:text-sm"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span className="hidden sm:inline">Remove</span>
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 lg:p-6 space-y-4 lg:space-y-6 bg-white dark:bg-gray-800">
                      {/* String Settings */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <Label className="text-gray-700 dark:text-gray-300">Connection Type</Label>
                          <Select 
                            value={stringConfig.connectionType}
                            onValueChange={(value: 'series' | 'parallel') => 
                              updateString(stringConfig.id, { connectionType: value })
                            }
                          >
                            <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                              <SelectItem value="series" className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700">Series (Voltages add)</SelectItem>
                              <SelectItem value="parallel" className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700">Parallel (Currents add)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label className="text-gray-700 dark:text-gray-300">Total Panels</Label>
                          <Input
                            type="number"
                            value={stringConfig.totalPanels}
                            readOnly
                            className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Switch
                            id={`uniform-${stringConfig.id}`}
                            checked={stringConfig.uniformPanels}
                            onCheckedChange={(checked) => 
                              updateString(stringConfig.id, { uniformPanels: checked })
                            }
                          />
                          <Label htmlFor={`uniform-${stringConfig.id}`} className="text-sm text-gray-700 dark:text-gray-300">
                            Uniform Panels
                          </Label>
                        </div>
                      </div>                      {/* Panel Configurations */}
                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <h4 className="text-base lg:text-lg font-medium text-gray-900 dark:text-gray-100">Panel Configuration</h4>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addPanelToString(stringConfig.id)}
                            className="flex items-center gap-2 w-full sm:w-auto bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                          >
                            <Plus className="w-3 h-3" />
                            Add Panel Type
                          </Button>
                        </div>

                        {stringConfig.panels.length === 0 && (
                          <div className="text-center py-6 lg:py-8 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                            <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm lg:text-base">No panels configured for this string.</p>
                            <Button
                              variant="outline"
                              onClick={() => addPanelToString(stringConfig.id)}
                              className="flex items-center gap-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                            >
                              <Plus className="w-4 h-4" />
                              Add Panel Type
                            </Button>
                          </div>
                        )}

                        {/* Render each panel configuration */}
                        {stringConfig.panels.map((panelConfig, panelIndex) => (
                          <div key={panelConfig.id} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                              <h5 className="font-medium text-gray-900 dark:text-gray-100">Panel Type {panelIndex + 1}</h5>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removePanelFromString(stringConfig.id, panelConfig.id)}
                                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 w-full sm:w-auto"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Remove Panel
                              </Button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                              <div>
                                <Label className="text-gray-700 dark:text-gray-300">Panel Source</Label>
                                <Select 
                                  value={panelConfig.type}
                                  onValueChange={(value: 'preset' | 'custom') => 
                                    updatePanelInString(stringConfig.id, panelConfig.id, { type: value })
                                  }
                                >
                                  <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                                    <SelectItem value="preset" className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700">From Preset</SelectItem>
                                    <SelectItem value="custom" className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700">Custom</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              {panelConfig.type === 'preset' && (
                                <div className="sm:col-span-2 lg:col-span-2">
                                  <Label className="text-gray-700 dark:text-gray-300">Panel Model</Label>
                                  <Select 
                                    value={panelConfig.preset?.id || ''}
                                    onValueChange={(panelId) => {
                                      const preset = panels.find(p => p.id === panelId);
                                      updatePanelInString(stringConfig.id, panelConfig.id, { preset });
                                    }}
                                  >
                                    <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                                      <SelectValue placeholder="Select panel..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                                      {panels.map((panel: PanelPreset) => (
                                        <SelectItem key={panel.id} value={panel.id} className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700">
                                          <div className="flex items-center justify-between w-full">
                                            <span>{panel.name}</span>
                                            <Badge variant="outline" className="ml-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                                              {panel.power}W
                                            </Badge>
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}

                              <div>
                                <Label className="text-gray-700 dark:text-gray-300">Panel Count</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  value={panelConfig.count}
                                  className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                                  onChange={(e) => 
                                    updatePanelInString(stringConfig.id, panelConfig.id, { 
                                      count: parseInt(e.target.value) || 1 
                                    })
                                  }
                                />
                              </div>
                            </div>

                            {/* Custom panel specifications */}
                            {panelConfig.type === 'custom' && (
                              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div>
                                  <Label className="text-gray-700 dark:text-gray-300">Name</Label>
                                  <Input
                                    value={panelConfig.customSpecs?.name || ''}
                                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                                    onChange={(e) => 
                                      updatePanelInString(stringConfig.id, panelConfig.id, {
                                        customSpecs: {
                                          ...panelConfig.customSpecs,
                                          name: e.target.value,
                                          voltage: panelConfig.customSpecs?.voltage || 40,
                                          current: panelConfig.customSpecs?.current || 15,
                                          power: panelConfig.customSpecs?.power || 600,
                                          voc: panelConfig.customSpecs?.voc || 48,
                                          isc: panelConfig.customSpecs?.isc || 16,
                                          maxSeriesFuse: panelConfig.customSpecs?.maxSeriesFuse || 20,
                                          maxSystemVoltage: panelConfig.customSpecs?.maxSystemVoltage || 1000,
                                        }
                                      })
                                    }
                                  />
                                </div>
                                <div>
                                  <Label className="text-gray-700 dark:text-gray-300">Power (W)</Label>
                                  <Input
                                    type="number"
                                    value={panelConfig.customSpecs?.power || 0}
                                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                                    onChange={(e) => 
                                      updatePanelInString(stringConfig.id, panelConfig.id, {
                                        customSpecs: {
                                          ...panelConfig.customSpecs!,
                                          power: parseFloat(e.target.value) || 0
                                        }
                                      })
                                    }
                                  />
                                </div>
                                <div>
                                  <Label className="text-gray-700 dark:text-gray-300">Voltage (V)</Label>
                                  <Input
                                    type="number"
                                    step="0.1"
                                    value={panelConfig.customSpecs?.voltage || 0}
                                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                                    onChange={(e) => 
                                      updatePanelInString(stringConfig.id, panelConfig.id, {
                                        customSpecs: {
                                          ...panelConfig.customSpecs!,
                                          voltage: parseFloat(e.target.value) || 0
                                        }
                                      })
                                    }
                                  />
                                </div>
                                <div>
                                  <Label className="text-gray-700 dark:text-gray-300">Current (A)</Label>
                                  <Input
                                    type="number"
                                    step="0.1"
                                    value={panelConfig.customSpecs?.current || 0}
                                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                                    onChange={(e) => 
                                      updatePanelInString(stringConfig.id, panelConfig.id, {
                                        customSpecs: {
                                          ...panelConfig.customSpecs!,
                                          current: parseFloat(e.target.value) || 0
                                        }
                                      })
                                    }
                                  />
                                </div>
                                <div>
                                  <Label className="text-gray-700 dark:text-gray-300">VOC (V)</Label>
                                  <Input
                                    type="number"
                                    step="0.1"
                                    value={panelConfig.customSpecs?.voc || 0}
                                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                                    onChange={(e) => 
                                      updatePanelInString(stringConfig.id, panelConfig.id, {
                                        customSpecs: {
                                          ...panelConfig.customSpecs!,
                                          voc: parseFloat(e.target.value) || 0
                                        }
                                      })
                                    }
                                  />
                                </div>
                                <div>
                                  <Label className="text-gray-700 dark:text-gray-300">ISC (A)</Label>
                                  <Input
                                    type="number"
                                    step="0.1"
                                    value={panelConfig.customSpecs?.isc || 0}
                                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                                    onChange={(e) => 
                                      updatePanelInString(stringConfig.id, panelConfig.id, {
                                        customSpecs: {
                                          ...panelConfig.customSpecs!,
                                          isc: parseFloat(e.target.value) || 0
                                        }
                                      })
                                    }
                                  />
                                </div>
                                <div>
                                  <Label className="text-gray-700 dark:text-gray-300">Max Series Fuse (A)</Label>
                                  <Input
                                    type="number"
                                    value={panelConfig.customSpecs?.maxSeriesFuse || 0}
                                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                                    onChange={(e) => 
                                      updatePanelInString(stringConfig.id, panelConfig.id, {
                                        customSpecs: {
                                          ...panelConfig.customSpecs!,
                                          maxSeriesFuse: parseFloat(e.target.value) || 0
                                        }
                                      })
                                    }
                                  />
                                </div>
                                <div>
                                  <Label className="text-gray-700 dark:text-gray-300">Max System Voltage (V)</Label>
                                  <Input
                                    type="number"
                                    value={panelConfig.customSpecs?.maxSystemVoltage || 0}
                                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                                    onChange={(e) => 
                                      updatePanelInString(stringConfig.id, panelConfig.id, {
                                        customSpecs: {
                                          ...panelConfig.customSpecs!,
                                          maxSystemVoltage: parseFloat(e.target.value) || 0
                                        }
                                      })
                                    }
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>                      {/* String Results */}
                      {stringResult && (
                        <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-blue-800/30 p-4 lg:p-6 rounded-lg border border-blue-200 dark:border-blue-700">
                          <h4 className="text-base lg:text-lg font-semibold text-blue-800 dark:text-blue-200 mb-4">String Output</h4>
                          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4">
                            <div className="bg-white/80 dark:bg-gray-800/80 p-3 lg:p-4 rounded-lg border border-blue-200 dark:border-blue-600 text-center">
                              <div className="text-xs lg:text-sm text-blue-600 dark:text-blue-400 font-medium">Power</div>
                              <div className="text-lg lg:text-xl font-bold text-blue-900 dark:text-blue-200">
                                {(stringResult.totalPower / 1000).toFixed(2)} kW
                              </div>
                            </div>
                            <div className="bg-white/80 dark:bg-gray-800/80 p-3 lg:p-4 rounded-lg border border-blue-200 dark:border-blue-600 text-center">
                              <div className="text-xs lg:text-sm text-blue-600 dark:text-blue-400 font-medium">Voltage (Vmp)</div>
                              <div className="text-lg lg:text-xl font-bold text-blue-900 dark:text-blue-200">
                                {stringResult.totalVoltage.toFixed(1)} V
                              </div>
                            </div>
                            <div className="bg-white/80 dark:bg-gray-800/80 p-3 lg:p-4 rounded-lg border border-blue-200 dark:border-blue-600 text-center">
                              <div className="text-xs lg:text-sm text-blue-600 dark:text-blue-400 font-medium">Current (Imp)</div>
                              <div className="text-lg lg:text-xl font-bold text-blue-900 dark:text-blue-200">
                                {stringResult.totalCurrent.toFixed(1)} A
                              </div>
                            </div>
                            <div className="bg-white/80 dark:bg-gray-800/80 p-3 lg:p-4 rounded-lg border border-blue-200 dark:border-blue-600 text-center">
                              <div className="text-xs lg:text-sm text-blue-600 dark:text-blue-400 font-medium">VOC</div>
                              <div className="text-lg lg:text-xl font-bold text-blue-900 dark:text-blue-200">
                                {stringResult.totalVoc.toFixed(1)} V
                              </div>
                            </div>
                            <div className="bg-white/80 dark:bg-gray-800/80 p-3 lg:p-4 rounded-lg border border-blue-200 dark:border-blue-600 text-center">
                              <div className="text-xs lg:text-sm text-blue-600 dark:text-blue-400 font-medium">ISC</div>
                              <div className="text-lg lg:text-xl font-bold text-blue-900 dark:text-blue-200">
                                {stringResult.totalIsc.toFixed(1)} A
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}

              {/* Connection Flow Visualization */}              {system.strings.length > 1 && (
                <Card className="shadow-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 dark:from-purple-600 dark:to-pink-600 text-white rounded-t-lg">
                    <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
                      <ArrowRight className="w-4 h-4 lg:w-5 lg:h-5" />
                      String Connection Flow
                    </CardTitle>
                    <CardDescription className="text-purple-100 dark:text-purple-200 text-sm lg:text-base">
                      How your strings are connected: {system.stringConnectionType}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 lg:p-6">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-2 lg:gap-4 overflow-x-auto">
                      {system.strings.map((_, index) => (
                        <React.Fragment key={index}>
                          <div className="bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-300 dark:border-blue-600 rounded-lg p-3 lg:p-4 text-center min-w-[120px] lg:min-w-[140px]">
                            <div className="text-sm lg:text-base font-medium text-blue-900 dark:text-blue-200">String {index + 1}</div>
                            <div className="text-xs lg:text-sm text-blue-700 dark:text-blue-300 mt-1">
                              {stringResults[index] ? (
                                <>
                                  <div>{(stringResults[index].totalPower / 1000).toFixed(1)}kW</div>
                                  <div className="hidden sm:block">{stringResults[index].totalVoltage.toFixed(0)}V / {stringResults[index].totalCurrent.toFixed(1)}A</div>
                                </>
                              ) : (
                                'No data'
                              )}
                            </div>
                          </div>
                          {index < system.strings.length - 1 && (
                            <div className="flex flex-col items-center text-gray-500 dark:text-gray-400">
                              {system.stringConnectionType === 'series' ? (
                                <>
                                  <ArrowRight className="w-5 h-5 lg:w-6 lg:h-6 hidden sm:block" />
                                  <ArrowDown className="w-5 h-5 lg:w-6 lg:h-6 sm:hidden" />
                                  <span className="text-xs lg:text-sm mt-1">Series</span>
                                </>
                              ) : (
                                <>
                                  <ArrowDown className="w-5 h-5 lg:w-6 lg:h-6" />
                                  <span className="text-xs lg:text-sm mt-1">Parallel</span>
                                </>
                              )}
                            </div>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>          {/* Right Sidebar - System Results */}
          <div className="space-y-4 lg:space-y-6">
            {systemResults ? (
              <>
                {/* Combined System Output - Sticky */}
                <Card className="shadow-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 
                               fixed bottom-4 left-4 right-4 z-50 xl:static xl:sticky xl:top-6 xl:left-auto xl:right-auto xl:bottom-auto">
                  <CardHeader className="bg-gradient-to-r from-green-500 to-blue-500 dark:from-green-600 dark:to-blue-600 text-white rounded-t-lg">
                    <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
                      <Calculator className="w-4 h-4 lg:w-5 lg:h-5" />
                      Combined System Output
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 lg:p-6 space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="text-center bg-green-50 dark:bg-green-900/20 p-4 lg:p-6 rounded-lg border border-green-200 dark:border-green-700">
                        <div className="text-green-600 dark:text-green-400 font-medium mb-1 text-sm lg:text-base">Total Power</div>
                        <div className="text-2xl lg:text-3xl font-bold text-green-900 dark:text-green-200">
                          {(systemResults.systemPower / 1000).toFixed(2)} kW
                        </div>
                        <div className="text-xs lg:text-sm text-green-700 dark:text-green-300 mt-1">
                          Effective: {(systemResults.effectivePower / 1000).toFixed(2)} kW
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 lg:gap-3">
                        <div className="text-center bg-blue-50 dark:bg-blue-900/20 p-3 lg:p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                          <div className="font-medium text-blue-600 dark:text-blue-400 text-xs lg:text-sm">System Voltage</div>
                          <div className="text-base lg:text-lg font-bold text-blue-900 dark:text-blue-200">
                            {systemResults.systemVoltage.toFixed(1)} V
                          </div>
                        </div>
                        <div className="text-center bg-purple-50 dark:bg-purple-900/20 p-3 lg:p-4 rounded-lg border border-purple-200 dark:border-purple-700">
                          <div className="font-medium text-purple-600 dark:text-purple-400 text-xs lg:text-sm">System Current</div>
                          <div className="text-base lg:text-lg font-bold text-purple-900 dark:text-purple-200">
                            {systemResults.systemCurrent.toFixed(1)} A
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 lg:gap-3">
                        <div className="text-center bg-orange-50 dark:bg-orange-900/20 p-3 lg:p-4 rounded-lg border border-orange-200 dark:border-orange-700">
                          <div className="font-medium text-orange-600 dark:text-orange-400 text-xs lg:text-sm">VOC</div>
                          <div className="text-base lg:text-lg font-bold text-orange-900 dark:text-orange-200">
                            {systemResults.systemVoc.toFixed(1)} V
                          </div>
                        </div>
                        <div className="text-center bg-red-50 dark:bg-red-900/20 p-3 lg:p-4 rounded-lg border border-red-200 dark:border-red-700">
                          <div className="font-medium text-red-600 dark:text-red-400 text-xs lg:text-sm">ISC</div>
                          <div className="text-base lg:text-lg font-bold text-red-900 dark:text-red-200">
                            {systemResults.systemIsc.toFixed(1)} A
                          </div>
                        </div>
                      </div>

                      <div className="text-center bg-gray-50 dark:bg-gray-700/50 p-3 lg:p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                        <div className="font-medium text-gray-600 dark:text-gray-400 text-xs lg:text-sm">Total Panels</div>
                        <div className="text-base lg:text-lg font-bold text-gray-900 dark:text-gray-200">
                          {systemResults.totalPanels}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>                {/* Individual String Results */}
                <Card className="shadow-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 dark:from-purple-600 dark:to-pink-600 text-white rounded-t-lg">
                    <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
                      <Zap className="w-4 h-4 lg:w-5 lg:h-5" />
                      Individual String Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 lg:p-6 space-y-3">
                    {stringResults.map((result, index) => (
                      <div key={result.stringId} className="bg-gray-50 dark:bg-gray-700/50 p-3 lg:p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                        <div className="font-medium mb-2 text-gray-900 dark:text-gray-100 text-sm lg:text-base">String {index + 1}</div>
                        <div className="grid grid-cols-3 gap-2 lg:gap-3">
                          <div className="text-center">
                            <div className="text-gray-600 dark:text-gray-400 text-xs lg:text-sm">Power</div>
                            <div className="font-bold text-gray-900 dark:text-gray-100 text-sm lg:text-base">{(result.totalPower / 1000).toFixed(2)}kW</div>
                          </div>
                          <div className="text-center">
                            <div className="text-gray-600 dark:text-gray-400 text-xs lg:text-sm">Voltage</div>
                            <div className="font-bold text-gray-900 dark:text-gray-100 text-sm lg:text-base">{result.totalVoltage.toFixed(1)}V</div>
                          </div>
                          <div className="text-center">
                            <div className="text-gray-600 dark:text-gray-400 text-xs lg:text-sm">Current</div>
                            <div className="font-bold text-gray-900 dark:text-gray-100 text-sm lg:text-base">{result.totalCurrent.toFixed(1)}A</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>                {/* System Compatibility */}
                {system.selectedInverter && (
                  <Card className="shadow-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 dark:from-orange-600 dark:to-red-600 text-white rounded-t-lg">
                      <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
                        <Settings className="w-4 h-4 lg:w-5 lg:h-5" />
                        Inverter Compatibility
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 lg:p-6 space-y-3">
                      <div className="space-y-3 lg:space-y-4">
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                          <span className="text-sm lg:text-base text-gray-700 dark:text-gray-300">Voltage Range</span>
                          <span className={`text-sm lg:text-base font-medium ${
                            systemResults.systemVoltage >= system.selectedInverter.mpptVoltageRange.min &&
                            systemResults.systemVoltage <= system.selectedInverter.mpptVoltageRange.max
                            ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          }`}>
                            {systemResults.systemVoltage >= system.selectedInverter.mpptVoltageRange.min &&
                             systemResults.systemVoltage <= system.selectedInverter.mpptVoltageRange.max
                             ? '✓ Compatible' : '⚠ Incompatible'
                            }
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                          <span className="text-sm lg:text-base text-gray-700 dark:text-gray-300">Current Limit</span>
                          <span className={`text-sm lg:text-base font-medium ${
                            systemResults.systemCurrent <= system.selectedInverter.maxSolarCurrent
                            ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          }`}>
                            {systemResults.systemCurrent <= system.selectedInverter.maxSolarCurrent
                             ? '✓ Within Limit' : '⚠ Over Limit'
                            }
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                          <span className="text-sm lg:text-base text-gray-700 dark:text-gray-300">Power Rating</span>
                          <span className={`text-sm lg:text-base font-medium ${
                            systemResults.systemPower <= system.selectedInverter.ratedPower
                            ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'
                          }`}>
                            {((systemResults.systemPower / system.selectedInverter.ratedPower) * 100).toFixed(0)}% Utilization
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}              </>            ) : (
              <Card className="shadow-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 
                             fixed bottom-4 left-4 right-4 z-50 xl:static xl:sticky xl:top-6">
                <CardContent className="text-center py-8 lg:py-12">
                  <Calculator className="w-12 h-12 lg:w-16 lg:h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-base lg:text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">No System Data</h3>
                  <p className="text-sm lg:text-base text-gray-500 dark:text-gray-400">
                    Configure at least one string to see system calculations.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
