'use client';

import React, { useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, Settings, Zap } from 'lucide-react';
import { useSolar } from '@/components/providers/SolarProvider';
import { CountrySelector } from '@/components/CountrySelector';
import { CostInput } from '@/components/CostInput';
import ConfigurationTabs from '@/components/ConfigurationTabs';
import ResultsDisplay from '@/components/ResultsDisplay';
import { calculateAllConfigurations, performAllSafetyChecks } from '@/lib/calculations';
import { getCountryById } from '@/constants/countries';
import PanelInput from '@/components/PanelInput';

export function CalculatorPage() {
  const {
    selectedCountry,
    panelSpecs,
    systemConfig,
    results,
    safetyChecks,
    customCosts,
    updateCountryAndCosts,
    setPanelSpecs,
    setSystemConfig,
    setResults,
    setSafetyChecks,
    setCustomCosts
  } = useSolar();

  const currentCountry = useMemo(() => getCountryById(selectedCountry), [selectedCountry]);

  // Calculate results when panel specs or system config change
  useEffect(() => {
    if (panelSpecs.voltage > 0 && panelSpecs.current > 0 && systemConfig.panels > 0) {
      const newResults = calculateAllConfigurations(panelSpecs, systemConfig);
      const newSafetyChecks = performAllSafetyChecks(panelSpecs, systemConfig);
      
      setResults(newResults);
      setSafetyChecks(newSafetyChecks);
    } else {
      setResults(null);
      setSafetyChecks({});
    }
  }, [panelSpecs, systemConfig, setResults, setSafetyChecks]);

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
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Configuration Panel */}
        <div className="xl:col-span-1 space-y-6">
          {/* Country Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Location & Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">              <CountrySelector
                selectedCountry={selectedCountry}
                onCountryChange={updateCountryAndCosts}
              />
              <div className="border-t border-border my-4" />
              {currentCountry && (
                <CostInput
                  country={currentCountry}
                  customCosts={customCosts}
                  onCostChange={setCustomCosts}
                />
              )}
            </CardContent>
          </Card>

          {/* Panel Input */}
          <PanelInput
            panelSpecs={panelSpecs}
            systemConfig={systemConfig}
            onPanelSpecsChange={setPanelSpecs}
            onSystemConfigChange={setSystemConfig}
            selectedCountry={selectedCountry}
          />
        </div>

        {/* Results Panel */}
        <div className="xl:col-span-2 space-y-6">
          {/* Configuration Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                System Configurations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ConfigurationTabs
                activeTab="series"
                onTabChange={() => {}} // Not needed for static display
                results={results}
                panelSpecs={panelSpecs}
                systemConfig={systemConfig}
                safetyChecks={safetyChecks}
              />
            </CardContent>
          </Card>

          {/* Detailed Results */}
          {results && (
            <ResultsDisplay
              results={results}
              activeConfiguration="series"
              panelSpecs={panelSpecs}
              systemConfig={systemConfig}
            />
          )}

          {/* Getting Started Help */}
          {!results && (
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
                      3. View Results
                    </h3>
                    <p className="text-sm text-purple-700 dark:text-purple-200">
                      Analyze power output and safety recommendations
                    </p>
                  </div>
                  <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">
                      4. Cost Analysis
                    </h3>
                    <p className="text-sm text-orange-700 dark:text-orange-200">
                      Calculate costs, savings, and ROI for your system
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
