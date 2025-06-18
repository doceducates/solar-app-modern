'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, Settings, Zap, Play, Globe, Trash2, Info, HelpCircle, BookOpen, AlertCircle } from 'lucide-react';
import { PanelPreset, SystemConfiguration, ConfigurationResults, SafetyChecks } from '@/types';
import { calculateAllConfigurations, performAllSafetyChecks } from '@/lib/calculations';
import ConfigurationTabs from '@/components/ConfigurationTabs';
import ResultsDisplay from '@/components/ResultsDisplay';
import CustomPresetModal from '@/components/CustomPresetModal';
import { useCountries, usePanelPresets } from '@/hooks/useDatabase';

export function CalculatorPage() {  // Database hooks
  const { countries, getCountryById } = useCountries();
  const { presets, addPreset, deletePreset } = usePanelPresets();
  
  // Local state management - using database data
  const [selectedCountryId, setSelectedCountryId] = useState('pakistan');
  const [panelSpecs, setPanelSpecs] = useState<PanelPreset>(() => {
    // Will be set when presets load
    return {
      id: 'temp',
      name: 'Loading...',
      description: 'Loading panel data...',
      category: 'residential',
      voltage: 0,
      current: 0,
      power: 0,
      voc: 0,
      isc: 0,
      maxSeriesFuse: 0,
      maxSystemVoltage: 1000
    };
  });
  const [systemConfig, setSystemConfig] = useState<SystemConfiguration>({
    panels: 4,
    efficiency: 85,
    seriesGroups: 2,
    panelsPerGroup: 2
  });
  const [results, setResults] = useState<ConfigurationResults | null>(null);
  const [safetyChecks, setSafetyChecks] = useState<SafetyChecks>({});  const [activeTab, setActiveTab] = useState<'series' | 'parallel' | 'combined'>('series');
  const [showHelp, setShowHelp] = useState(false);  // Custom preset management
  
  const [customCosts, setCustomCosts] = useState(() => {
    const defaultCountry = getCountryById('pakistan');
    return {
      panelCostPerWatt: defaultCountry?.pricing.panelCostPerWatt || 30,
      installationCostPerWatt: defaultCountry?.pricing.installationCostPerWatt || 45,
      electricityRate: defaultCountry?.pricing.electricityRate || 25,
      laborRate: defaultCountry?.pricing.laborRate || 800,
      installationHours: 40,
      permitCost: defaultCountry?.pricing.permitCost || 15000
    };
  });
  const currentCountry = useMemo(() => getCountryById(selectedCountryId), [selectedCountryId, getCountryById]);
  const canCalculate = panelSpecs.voltage > 0 && panelSpecs.current > 0 && systemConfig.panels > 0;

  // Set default panel when presets load
  useEffect(() => {
    if (presets.length > 0 && panelSpecs.voltage === 0) {
      setPanelSpecs(presets[0]);
    }
  }, [presets, panelSpecs.voltage]);

  // Update costs when countries load or country changes
  useEffect(() => {
    const defaultCountry = getCountryById(selectedCountryId);
    if (defaultCountry) {
      setCustomCosts(prev => ({
        panelCostPerWatt: defaultCountry.pricing.panelCostPerWatt,
        installationCostPerWatt: defaultCountry.pricing.installationCostPerWatt,
        electricityRate: defaultCountry.pricing.electricityRate,
        laborRate: defaultCountry.pricing.laborRate,
        installationHours: prev.installationHours,
        permitCost: defaultCountry.pricing.permitCost
      }));
    }
  }, [selectedCountryId, getCountryById]);

  // Handlers
  const handleCountryChange = (countryId: string) => {
    setSelectedCountryId(countryId);
    const country = getCountryById(countryId);
    if (country) {
      setCustomCosts(prev => ({
        ...prev,
        panelCostPerWatt: country.pricing.panelCostPerWatt,
        installationCostPerWatt: country.pricing.installationCostPerWatt,
        electricityRate: country.pricing.electricityRate,
        laborRate: country.pricing.laborRate,
        permitCost: country.pricing.permitCost
      }));
    }
  };  const handlePanelPresetChange = (presetName: string) => {
    const preset = presets.find(p => p.name === presetName);
    if (preset) {
      setPanelSpecs(preset);
    }
  };
    const handleSavePreset = async (newPreset: PanelPreset) => {
    try {
      await addPreset(newPreset);
    } catch (error) {
      console.error('Failed to save preset:', error);
      throw error; // Re-throw so modal can handle the error
    }
  };

  const handleDeletePreset = async (presetName: string) => {
    try {
      await deletePreset(presetName);
    } catch (error) {
      console.error('Failed to delete preset:', error);
    }
  };

  const handleCalculate = () => {
    if (canCalculate) {
      const newResults = calculateAllConfigurations(panelSpecs, systemConfig);
      const newSafetyChecks = performAllSafetyChecks(panelSpecs, systemConfig);
      setResults(newResults);
      setSafetyChecks(newSafetyChecks);
    }
  };

  return (
    <div className="space-y-8">      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calculator className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Solar System Calculator</h1>
            <p className="text-muted-foreground">
              Configure your solar panel system and calculate performance
            </p>
          </div>
        </div>
        <Button 
          variant="outline" 
          onClick={() => setShowHelp(!showHelp)}
          className="flex items-center gap-2"
        >
          <HelpCircle className="w-4 h-4" />
          {showHelp ? 'Hide Guide' : 'Show Guide'}
        </Button>
      </div>

      {/* Help Section */}
      {showHelp && (
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <BookOpen className="w-5 h-5" />
              How to Use This Calculator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Required vs Optional Fields */}
            <div>
              <h3 className="font-semibold text-lg text-amber-900 dark:text-amber-100 mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Required vs Optional Fields
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                  <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">Required Fields *</h4>
                  <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                    <li>• <strong>Voltage per Panel (Vmp)</strong> - For power calculations</li>
                    <li>• <strong>Current per Panel (Imp)</strong> - For power calculations</li>
                    <li>• <strong>Number of Panels</strong> - System size</li>
                  </ul>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Optional Fields</h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• <strong>Open Circuit Voltage (Voc)</strong> - Safety checks</li>
                    <li>• <strong>Short Circuit Current (Isc)</strong> - Safety checks</li>
                    <li>• <strong>Max Fuse Rating</strong> - Compliance</li>
                    <li>• <strong>System Efficiency</strong> - Performance tuning</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Where to Find Values */}
            <div>
              <h3 className="font-semibold text-lg text-amber-900 dark:text-amber-100 mb-3 flex items-center gap-2">
                <Info className="w-5 h-5" />
                Where to Find These Values
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">On Panel Label/Sticker:</h4>
                  <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                    <li>• <strong>Pmax</strong> = Power (e.g., 600W)</li>
                    <li>• <strong>Vmp</strong> = Operating Voltage (e.g., 40.3V)</li>
                    <li>• <strong>Imp</strong> = Operating Current (e.g., 14.91A)</li>
                    <li>• <strong>Voc</strong> = Open Circuit Voltage (e.g., 48.4V)</li>
                    <li>• <strong>Isc</strong> = Short Circuit Current (e.g., 15.80A)</li>
                  </ul>
                </div>
                <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                  <h4 className="font-medium text-purple-800 dark:text-purple-200 mb-2">In Panel Datasheet:</h4>
                  <ul className="text-sm text-purple-700 dark:text-purple-300 space-y-1">
                    <li>• <strong>Maximum System Voltage</strong> (e.g., 1500V)</li>
                    <li>• <strong>Maximum Series Fuse Rating</strong> (e.g., 35A)</li>
                    <li>• <strong>Temperature Coefficients</strong></li>
                    <li>• <strong>Detailed Specifications</strong></li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Example Panel */}
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800">
              <h3 className="font-semibold text-lg text-indigo-900 dark:text-indigo-100 mb-3">
                Example: 600W Solar Panel
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium text-indigo-800 dark:text-indigo-200 mb-2">Enter These Values:</h4>
                  <ul className="text-indigo-700 dark:text-indigo-300 space-y-1">
                    <li>• <strong>Voltage per Panel:</strong> 40.3V (Vmp)</li>
                    <li>• <strong>Current per Panel:</strong> 14.91A (Imp)</li>
                    <li>• <strong>Open Circuit Voltage:</strong> 48.4V (Voc)</li>
                    <li>• <strong>Short Circuit Current:</strong> 15.80A (Isc)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-indigo-800 dark:text-indigo-200 mb-2">Optional Safety Values:</h4>
                  <ul className="text-indigo-700 dark:text-indigo-300 space-y-1">
                    <li>• <strong>Max Fuse Rating:</strong> 35A</li>
                    <li>• <strong>Max System Voltage:</strong> 1500V</li>
                    <li>• <strong>Power:</strong> 600W (calculated: 40.3V × 14.91A)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Presets vs Manual */}
            <div className="bg-teal-50 dark:bg-teal-950/20 p-4 rounded-lg border border-teal-200 dark:border-teal-800">
              <h3 className="font-semibold text-lg text-teal-900 dark:text-teal-100 mb-2">
                When to Use Presets vs Manual Entry
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium text-teal-800 dark:text-teal-200 mb-2">Use Presets When:</h4>
                  <ul className="text-teal-700 dark:text-teal-300 space-y-1">
                    <li>• You have a common panel model</li>
                    <li>• You want quick estimates</li>                    <li>• You&apos;re comparing different panel types</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-teal-800 dark:text-teal-200 mb-2">Use Manual Entry When:</h4>
                  <ul className="text-teal-700 dark:text-teal-300 space-y-1">
                    <li>• You have specific panel specifications</li>
                    <li>• Your panel isn&apos;t in the presets</li>
                    <li>• You need precise calculations</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}<div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Configuration Panel */}
        <div className="xl:col-span-1 space-y-6">
          {/* Calculate Button - Moved to Top */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-2 border-dashed border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <Button 
                onClick={handleCalculate}
                disabled={!canCalculate}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                size="lg"
              >
                <Play className="w-5 h-5 mr-2" />
                Calculate Solar System
              </Button>
              {!canCalculate && (
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  Please fill in all required fields to calculate
                </p>
              )}
            </CardContent>
          </Card>

          {/* Panel Configuration */}
          <Card className="shadow-lg border-l-4 border-l-green-500">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-green-600" />
                Panel Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div>
                <Label htmlFor="panel-preset" className="text-sm font-semibold">Panel Preset</Label>
                <Select value={panelSpecs.name} onValueChange={handlePanelPresetChange}>
                  <SelectTrigger id="panel-preset" className="mt-1">
                    <SelectValue placeholder="Select a panel preset" />
                  </SelectTrigger>                  <SelectContent>
                    {/* Standard Presets */}
                    <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">Standard Presets</div>
                    {presets.filter(preset => !preset.id.startsWith('custom-')).map((preset) => (
                      <SelectItem key={preset.name} value={preset.name}>
                        <div className="flex flex-col">
                          <span className="font-medium">{preset.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {preset.voltage}V, {preset.current}A, {preset.power}W
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                    
                    {/* Custom Presets */}
                    {presets.filter(preset => preset.id.startsWith('custom-')).length > 0 && (
                      <>
                        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground border-t">Custom Presets</div>
                        {presets.filter(preset => preset.id.startsWith('custom-')).map((preset) => (
                          <SelectItem key={preset.name} value={preset.name}>
                            <div className="flex items-center justify-between w-full">
                              <div className="flex flex-col">
                                <span className="font-medium">{preset.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {preset.voltage}V, {preset.current}A, {preset.power}W
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeletePreset(preset.name);
                                }}
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>              {/* Custom Preset Creation */}
              <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border">
                <CustomPresetModal
                  onSave={handleSavePreset}
                  initialData={{
                    voltage: panelSpecs.voltage,
                    current: panelSpecs.current,
                    voc: panelSpecs.voc,
                    isc: panelSpecs.isc,
                    maxSeriesFuse: panelSpecs.maxSeriesFuse,
                    maxSystemVoltage: panelSpecs.maxSystemVoltage,
                    temperatureCoefficient: panelSpecs.temperatureCoefficient,
                    efficiency: panelSpecs.efficiency
                  }}
                />
              </div><div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="voltage" className="text-sm font-semibold flex items-center gap-1">
                    Voltage per Panel (Vmp) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="voltage"
                    type="number"
                    step="0.1"
                    placeholder="e.g., 40.3"
                    value={panelSpecs.voltage}
                    onChange={(e) => setPanelSpecs((prev: PanelPreset) => ({
                      ...prev,
                      voltage: Number(e.target.value),
                      power: Number(e.target.value) * prev.current
                    }))}
                    className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Find &quot;Vmp&quot; on panel label
                  </p>
                </div>
                <div>
                  <Label htmlFor="current" className="text-sm font-semibold flex items-center gap-1">
                    Current per Panel (Imp) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="current"
                    type="number"
                    step="0.1"
                    placeholder="e.g., 14.91"
                    value={panelSpecs.current}
                    onChange={(e) => setPanelSpecs((prev: PanelPreset) => ({
                      ...prev,
                      current: Number(e.target.value),
                      power: prev.voltage * Number(e.target.value)
                    }))}
                    className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Find &quot;Imp&quot; on panel label
                  </p>
                </div>
              </div>              {/* Calculated Power Display */}
              <div className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-950/30 dark:to-emerald-950/30 p-3 rounded-lg border border-green-200 dark:border-green-800">
                <div className="text-center">
                  <span className="text-2xl font-bold text-green-700 dark:text-green-400">
                    {(panelSpecs.voltage * panelSpecs.current).toFixed(0)}W
                  </span>
                  <p className="text-xs text-green-600 dark:text-green-500">Panel Power (Calculated: {panelSpecs.voltage}V × {panelSpecs.current}A)</p>
                </div>
              </div>              {/* Optional Safety Fields */}
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                  <Label className="text-sm font-medium text-orange-800 dark:text-orange-200">
                    Optional Safety Values (for compliance checks)
                  </Label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="voc" className="text-xs text-muted-foreground">
                      Open Circuit Voltage (Voc)
                    </Label>
                    <Input
                      id="voc"
                      type="number"
                      step="0.1"
                      placeholder="e.g., 48.4"
                      value={panelSpecs.voc || ''}
                      onChange={(e) => setPanelSpecs((prev: PanelPreset) => ({
                        ...prev,
                        voc: Number(e.target.value) || prev.voltage * 1.2
                      }))}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="isc" className="text-xs text-muted-foreground">
                      Short Circuit Current (Isc)
                    </Label>
                    <Input
                      id="isc"
                      type="number"
                      step="0.1"
                      placeholder="e.g., 15.80"
                      value={panelSpecs.isc || ''}
                      onChange={(e) => setPanelSpecs((prev: PanelPreset) => ({
                        ...prev,
                        isc: Number(e.target.value) || prev.current * 1.2
                      }))}
                      className="text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <Label htmlFor="maxFuse" className="text-xs text-muted-foreground">
                      Max Series Fuse (A)
                    </Label>
                    <Input
                      id="maxFuse"
                      type="number"
                      placeholder="e.g., 35"
                      value={panelSpecs.maxSeriesFuse || ''}
                      onChange={(e) => setPanelSpecs((prev: PanelPreset) => ({
                        ...prev,
                        maxSeriesFuse: Number(e.target.value) || Math.ceil(prev.current * 1.56)
                      }))}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxSysVoltage" className="text-xs text-muted-foreground">
                      Max System Voltage (V)
                    </Label>
                    <Input
                      id="maxSysVoltage"
                      type="number"
                      placeholder="e.g., 1500"
                      value={panelSpecs.maxSystemVoltage || ''}
                      onChange={(e) => setPanelSpecs((prev: PanelPreset) => ({
                        ...prev,
                        maxSystemVoltage: Number(e.target.value) || 1000
                      }))}
                      className="text-sm"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2 italic">
                  💡 These values are found on the panel datasheet and help ensure system safety compliance
                </p>
              </div>
            </CardContent>
          </Card>

          {/* System Configuration */}
          <Card className="shadow-lg border-l-4 border-l-purple-500">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-600" />
                System Configuration
              </CardTitle>
            </CardHeader>            <CardContent className="space-y-4 pt-6">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="panels" className="text-sm font-semibold flex items-center gap-1">
                    Number of Panels <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="panels"
                    type="number"
                    min="1"
                    placeholder="e.g., 4"
                    value={systemConfig.panels}
                    onChange={(e) => setSystemConfig(prev => ({
                      ...prev,
                      panels: Number(e.target.value)
                    }))}
                    className="bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Total panels in your system
                  </p>
                </div>
                <div>
                  <Label htmlFor="efficiency" className="text-sm font-semibold">System Efficiency (%)</Label>
                  <Input
                    id="efficiency"
                    type="number"
                    min="1"
                    max="100"
                    placeholder="85"                    value={systemConfig.efficiency}
                    onChange={(e) => setSystemConfig(prev => ({
                      ...prev,
                      efficiency: Number(e.target.value)
                    }))}
                    className="bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    System losses (default: 85% is typical)
                  </p>
                </div>
              </div>

              {/* Combined Configuration Controls */}
              <div className="pt-4 border-t border-purple-200 dark:border-purple-800">
                <Label className="text-sm font-semibold text-purple-700 dark:text-purple-400">Combined Configuration Settings</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div>
                    <Label htmlFor="series-groups" className="text-xs">Series Groups</Label>
                    <Input
                      id="series-groups"
                      type="number"
                      min="1"
                      max={systemConfig.panels}
                      value={systemConfig.seriesGroups || 2}
                      onChange={(e) => {
                        const groups = Number(e.target.value);
                        setSystemConfig(prev => ({
                          ...prev,
                          seriesGroups: groups,
                          panelsPerGroup: Math.floor(prev.panels / groups)
                        }));
                      }}
                      className="bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800"
                    />
                  </div>
                  <div>
                    <Label htmlFor="panels-per-group" className="text-xs">Panels per Group</Label>
                    <Input
                      id="panels-per-group"
                      type="number"
                      min="1"
                      max={systemConfig.panels}
                      value={systemConfig.panelsPerGroup || 2}
                      onChange={(e) => {
                        const panelsPerGroup = Number(e.target.value);
                        setSystemConfig(prev => ({
                          ...prev,
                          panelsPerGroup,
                          seriesGroups: Math.floor(prev.panels / panelsPerGroup)
                        }));
                      }}
                      className="bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800"
                    />
                  </div>
                </div>
                <div className="bg-purple-100 dark:bg-purple-950/30 p-2 rounded-lg mt-2">
                  <p className="text-xs text-purple-700 dark:text-purple-400 text-center">
                    Total: {systemConfig.seriesGroups || 2} groups × {systemConfig.panelsPerGroup || 2} panels = {(systemConfig.seriesGroups || 2) * (systemConfig.panelsPerGroup || 2)} panels
                  </p>
                </div>
              </div>

              {/* Total System Power Display */}
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-950/30 dark:to-pink-950/30 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="text-center">
                  <span className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                    {((panelSpecs.voltage * panelSpecs.current) * systemConfig.panels).toFixed(0)}W
                  </span>
                  <p className="text-xs text-purple-600 dark:text-purple-500">Total System Power</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Panel - Moved to Bottom */}
          <Card className="shadow-lg border-l-4 border-l-orange-500">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950/20 dark:to-yellow-950/20">
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-orange-600" />
                Location & Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div>
                <Label htmlFor="country-select" className="flex items-center gap-2 text-sm font-semibold">
                  <Globe className="h-4 w-4" />
                  Country & Currency
                </Label>
                <Select value={selectedCountryId} onValueChange={handleCountryChange}>
                  <SelectTrigger id="country-select" className="mt-1 bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800">
                    <SelectValue placeholder="Select your country" />
                  </SelectTrigger>                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.id} value={country.id}>
                        <div className="flex items-center gap-3">
                          <span className="text-lg min-w-[24px]">{country.currency.symbol}</span>
                          <div className="flex flex-col">
                            <span className="font-medium">{country.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {country.currency.name} ({country.currency.code})
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {currentCountry && (
                <div className="border-t border-orange-200 dark:border-orange-800 pt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="panel-cost" className="text-xs font-semibold">Panel Cost ({currentCountry.currency.symbol}/W)</Label>
                      <Input
                        id="panel-cost"
                        type="number"
                        value={customCosts.panelCostPerWatt}
                        onChange={(e) => setCustomCosts(prev => ({
                          ...prev,
                          panelCostPerWatt: Number(e.target.value)
                        }))}
                        className="bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800"
                      />
                    </div>
                    <div>
                      <Label htmlFor="install-cost" className="text-xs font-semibold">Installation ({currentCountry.currency.symbol}/W)</Label>
                      <Input
                        id="install-cost"
                        type="number"
                        value={customCosts.installationCostPerWatt}
                        onChange={(e) => setCustomCosts(prev => ({
                          ...prev,
                          installationCostPerWatt: Number(e.target.value)
                        }))}
                        className="bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="electricity-rate" className="text-xs font-semibold">Electricity Rate ({currentCountry.currency.symbol}/kWh)</Label>
                    <Input
                      id="electricity-rate"
                      type="number"
                      step="0.01"
                      value={customCosts.electricityRate}
                      onChange={(e) => setCustomCosts(prev => ({
                        ...prev,
                        electricityRate: Number(e.target.value)
                      }))}
                      className="bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Results Panel */}
        <div className="xl:col-span-2 space-y-6">
          {results ? (
            <>
              {/* Configuration Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    System Configurations
                  </CardTitle>
                </CardHeader>                <CardContent>
                  <ConfigurationTabs
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    results={results}
                    panelSpecs={panelSpecs}
                    systemConfig={systemConfig}
                    safetyChecks={safetyChecks}
                  />
                </CardContent>
              </Card>              {/* Detailed Results */}
              <ResultsDisplay
                results={results}
                activeConfiguration={activeTab}
                panelSpecs={panelSpecs}
                systemConfig={systemConfig}
              />
            </>
          ) : (
            /* Getting Started Help */
            <Card>
              <CardHeader>
                <CardTitle>Getting Started</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      1. Select Country
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-200">
                      Choose your location for accurate pricing and regulations
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                      2. Configure System
                    </h3>
                    <p className="text-sm text-green-700 dark:text-green-200">
                      Select panel specifications and system parameters
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                      3. Click Calculate
                    </h3>
                    <p className="text-sm text-purple-700 dark:text-purple-200">
                      Press the calculate button to analyze your system
                    </p>
                  </div>
                  <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">
                      4. View Results
                    </h3>
                    <p className="text-sm text-orange-700 dark:text-orange-200">
                      Analyze power output and safety recommendations
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
