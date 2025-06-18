'use client';

import { useState, useEffect } from 'react';
import { Calculator, Sun, Zap } from 'lucide-react';
import { PanelSpecifications, SystemConfiguration, ConfigurationResults, SafetyChecks, CostAnalysis } from '@/types';
import { PANEL_PRESETS } from '@/constants/panels';
import { COUNTRIES, getCountryById } from '@/constants/countries';
import { calculateAllConfigurations, performAllSafetyChecks } from '@/lib/calculations';
import { calculateSystemCost } from '@/lib/cost-calculations';
import PanelInput from './PanelInput';
import ConfigurationTabs from './ConfigurationTabs';
import ResultsDisplay from './ResultsDisplay';
import ComparisonChart from './ComparisonChart';
import { CountrySelector } from './CountrySelector';
import { CostAnalysisDisplay } from './CostAnalysisDisplay';

export default function SolarCalculator() {
  const [selectedCountry, setSelectedCountry] = useState<string>('pakistan');
  const [panelSpecs, setPanelSpecs] = useState<PanelSpecifications>(PANEL_PRESETS[0]);
  const [systemConfig, setSystemConfig] = useState<SystemConfiguration>({
    panels: 4,
    efficiency: 85,
    seriesGroups: 2,
    panelsPerGroup: 2
  });
  const [results, setResults] = useState<ConfigurationResults | null>(null);
  const [activeTab, setActiveTab] = useState<'series' | 'parallel' | 'combined'>('series');
  const [safetyChecks, setSafetyChecks] = useState<SafetyChecks>({});
  const [costAnalysis, setCostAnalysis] = useState<CostAnalysis | null>(null);

  // Get current country data
  const currentCountry = getCountryById(selectedCountry);
  // Calculate results whenever inputs change
  useEffect(() => {
    if (panelSpecs.voltage > 0 && panelSpecs.current > 0 && systemConfig.panels > 0) {
      const newResults = calculateAllConfigurations(panelSpecs, systemConfig);
      const newSafetyChecks = performAllSafetyChecks(panelSpecs, systemConfig);
      
      setResults(newResults);
      setSafetyChecks(newSafetyChecks);

      // Calculate cost analysis if country is selected
      if (currentCountry) {
        const totalPower = panelSpecs.power * systemConfig.panels;
        const newCostAnalysis = calculateSystemCost({
          totalPower,
          country: currentCountry
        });
        setCostAnalysis(newCostAnalysis);
      }
    } else {
      setResults(null);
      setSafetyChecks({});
      setCostAnalysis(null);
    }
  }, [panelSpecs, systemConfig, currentCountry]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <header className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-yellow-400 rounded-full">
            <Sun className="w-8 h-8 text-yellow-800" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white">
            Solar Panel Calculator
          </h1>
          <div className="p-3 bg-blue-500 rounded-full">
            <Zap className="w-8 h-8 text-white" />
          </div>
        </div>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          Calculate theoretical power outputs for different solar panel configurations. 
          Analyze series, parallel, and combined setups with real-time safety validation.
        </p>
      </header>      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Input Panel */}
        <div className="xl:col-span-1 space-y-6">
          <CountrySelector
            selectedCountry={selectedCountry}
            onCountryChange={setSelectedCountry}
          />
          <PanelInput
            panelSpecs={panelSpecs}
            systemConfig={systemConfig}
            onPanelSpecsChange={setPanelSpecs}
            onSystemConfigChange={setSystemConfig}
            selectedCountry={selectedCountry}
          />
        </div>

        {/* Results Section */}
        <div className="xl:col-span-2 space-y-6">
          {/* Configuration Tabs */}
          <ConfigurationTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            results={results}
            panelSpecs={panelSpecs}
            systemConfig={systemConfig}
            safetyChecks={safetyChecks}
          />

          {/* Results Display */}
          {results && (
            <ResultsDisplay
              results={results}
              activeConfiguration={activeTab}
              panelSpecs={panelSpecs}
              systemConfig={systemConfig}
            />
          )}

          {/* Cost Analysis */}
          {costAnalysis && currentCountry && (
            <CostAnalysisDisplay
              analysis={costAnalysis}
              country={currentCountry}
              systemPower={panelSpecs.power * systemConfig.panels}
            />
          )}

          {/* Comparison Chart */}
          {results && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calculator className="w-5 h-5 text-blue-500" />
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                  Configuration Comparison
                </h3>
              </div>
              <ComparisonChart results={results} />
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 text-center text-gray-500 dark:text-gray-400">
        <p>© 2025 Solar Panel Calculator - Helping optimize your solar energy system</p>
        <p className="text-sm mt-2">
          Results are theoretical. Consult with solar professionals for real-world installations.
        </p>
      </footer>
    </div>
  );
}
