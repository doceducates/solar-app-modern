'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, Settings, Zap, Play, Globe, Save, Plus, Trash2 } from 'lucide-react';
import { PanelPreset, SystemConfiguration, ConfigurationResults, SafetyChecks } from '@/types';
import { COUNTRIES, getCountryById } from '@/constants/countries';
import { PANEL_PRESETS } from '@/constants/panels';
import { calculateAllConfigurations, performAllSafetyChecks } from '@/lib/calculations';
import ConfigurationTabs from '@/components/ConfigurationTabs';
import ResultsDisplay from '@/components/ResultsDisplay';

export function CalculatorPage() {  // Local state management - no context dependencies
  const [selectedCountryId, setSelectedCountryId] = useState('pakistan');
  const [panelSpecs, setPanelSpecs] = useState<PanelPreset>(PANEL_PRESETS[0]);
  const [systemConfig, setSystemConfig] = useState<SystemConfiguration>({
    panels: 4,
    efficiency: 85,
    seriesGroups: 2,
    panelsPerGroup: 2
  });
  const [results, setResults] = useState<ConfigurationResults | null>(null);
  const [safetyChecks, setSafetyChecks] = useState<SafetyChecks>({});
  const [activeTab, setActiveTab] = useState<'series' | 'parallel' | 'combined'>('series');
  
  // Custom preset management
  const [customPresets, setCustomPresets] = useState<PanelPreset[]>([]);
  const [isCreatingPreset, setIsCreatingPreset] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  
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

  const currentCountry = useMemo(() => getCountryById(selectedCountryId), [selectedCountryId]);
  const canCalculate = panelSpecs.voltage > 0 && panelSpecs.current > 0 && systemConfig.panels > 0;

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
  };
  const handlePanelPresetChange = (presetName: string) => {
    const preset = [...PANEL_PRESETS, ...customPresets].find(p => p.name === presetName);
    if (preset) {
      setPanelSpecs(preset);
    }
  };
  const handleSavePreset = () => {
    if (newPresetName.trim() && panelSpecs.voltage > 0 && panelSpecs.current > 0) {
      const newPreset: PanelPreset = {
        id: `custom-${Date.now()}`,
        name: newPresetName.trim(),
        voltage: panelSpecs.voltage,
        current: panelSpecs.current,
        power: panelSpecs.voltage * panelSpecs.current,
        voc: panelSpecs.voc || panelSpecs.voltage * 1.2,
        isc: panelSpecs.isc || panelSpecs.current * 1.2,
        maxSeriesFuse: panelSpecs.maxSeriesFuse || Math.ceil(panelSpecs.current * 1.56),
        maxSystemVoltage: panelSpecs.maxSystemVoltage || 1000,
        efficiency: panelSpecs.efficiency || 20,
        description: `Custom preset: ${newPresetName.trim()}`,
        category: 'residential'
      };
      
      setCustomPresets(prev => [...prev, newPreset]);
      setNewPresetName('');
      setIsCreatingPreset(false);
    }
  };

  const handleDeletePreset = (presetName: string) => {
    setCustomPresets(prev => prev.filter(p => p.name !== presetName));
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Calculator className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Solar System Calculator</h1>
          <p className="text-muted-foreground">
            Configure your solar panel system and calculate performance
          </p>
        </div>
      </div>      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
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
                  </SelectTrigger>
                  <SelectContent>
                    <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">Standard Presets</div>
                    {PANEL_PRESETS.map((preset) => (
                      <SelectItem key={preset.name} value={preset.name}>
                        <div className="flex flex-col">
                          <span className="font-medium">{preset.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {preset.voltage}V, {preset.current}A, {preset.power}W
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                    {customPresets.length > 0 && (
                      <>
                        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground border-t">Custom Presets</div>
                        {customPresets.map((preset) => (
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
              </div>

              {/* Custom Preset Creation */}
              <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border">
                {!isCreatingPreset ? (
                  <Button
                    variant="outline"
                    onClick={() => setIsCreatingPreset(true)}
                    className="w-full"
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Custom Preset
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="preset-name">Custom Preset Name</Label>
                      <Input
                        id="preset-name"
                        value={newPresetName}
                        onChange={(e) => setNewPresetName(e.target.value)}
                        placeholder="Enter preset name"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSavePreset}
                        disabled={!newPresetName.trim()}
                        size="sm"
                        className="flex-1"
                      >
                        <Save className="w-3 h-3 mr-1" />
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsCreatingPreset(false);
                          setNewPresetName('');
                        }}
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="voltage" className="text-sm font-semibold">Voltage (V)</Label>
                  <Input
                    id="voltage"
                    type="number"
                    value={panelSpecs.voltage}
                    onChange={(e) => setPanelSpecs((prev: PanelPreset) => ({
                      ...prev,
                      voltage: Number(e.target.value),
                      power: Number(e.target.value) * prev.current
                    }))}
                    className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
                  />
                </div>
                <div>
                  <Label htmlFor="current" className="text-sm font-semibold">Current (A)</Label>
                  <Input
                    id="current"
                    type="number"
                    value={panelSpecs.current}
                    onChange={(e) => setPanelSpecs((prev: PanelPreset) => ({
                      ...prev,
                      current: Number(e.target.value),
                      power: prev.voltage * Number(e.target.value)
                    }))}
                    className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
                  />
                </div>
              </div>

              {/* Calculated Power Display */}
              <div className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-950/30 dark:to-emerald-950/30 p-3 rounded-lg border border-green-200 dark:border-green-800">
                <div className="text-center">
                  <span className="text-2xl font-bold text-green-700 dark:text-green-400">
                    {(panelSpecs.voltage * panelSpecs.current).toFixed(0)}W
                  </span>
                  <p className="text-xs text-green-600 dark:text-green-500">Panel Power</p>
                </div>
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
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="panels" className="text-sm font-semibold">Number of Panels</Label>
                  <Input
                    id="panels"
                    type="number"
                    min="1"
                    value={systemConfig.panels}
                    onChange={(e) => setSystemConfig(prev => ({
                      ...prev,
                      panels: Number(e.target.value)
                    }))}
                    className="bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800"
                  />
                </div>
                <div>
                  <Label htmlFor="efficiency" className="text-sm font-semibold">System Efficiency (%)</Label>
                  <Input
                    id="efficiency"
                    type="number"
                    min="1"
                    max="100"
                    value={systemConfig.efficiency}
                    onChange={(e) => setSystemConfig(prev => ({
                      ...prev,
                      efficiency: Number(e.target.value)
                    }))}
                    className="bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800"
                  />
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
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((country) => (
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
