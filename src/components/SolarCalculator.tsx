'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Calculator } from 'lucide-react';
import { PanelSpecifications, SystemConfiguration, ConfigurationResults, SafetyChecks, CostAnalysis } from '@/types';
import { PANEL_PRESETS } from '@/constants/panels';
import { getCountryById } from '@/constants/countries';
import { calculateAllConfigurations, performAllSafetyChecks } from '@/lib/calculations';
import { calculateSystemCost } from '@/lib/cost-calculations';
import PanelInput from './PanelInput';
import ConfigurationTabs from './ConfigurationTabs';
import ResultsDisplay from './ResultsDisplay';
import ComparisonChart from './ComparisonChart';
import { CountrySelector } from './CountrySelector';
import { CostAnalysisDisplay } from './CostAnalysisDisplay';
import { CostInput } from './CostInput';

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
  
  // Custom cost inputs state
  const [customCosts, setCustomCosts] = useState({
    panelCostPerWatt: 30,
    installationCostPerWatt: 45,
    electricityRate: 25,
    laborRate: 800,
    installationHours: 40,
    permitCost: 15000
  });
  // Get current country data - memoized to prevent unnecessary re-renders
  const currentCountry = useMemo(() => getCountryById(selectedCountry), [selectedCountry]);

  // Memoized cost change handler to prevent infinite loops
  const handleCostChange = useCallback((newCosts: typeof customCosts) => {
    setCustomCosts(newCosts);
  }, []);  // Initialize custom costs when country changes
  useEffect(() => {
    if (currentCountry) {
      setCustomCosts(prevCosts => {
        // Only update if the country actually changed to prevent loops
        if (prevCosts.panelCostPerWatt === currentCountry.pricing.panelCostPerWatt &&
            prevCosts.installationCostPerWatt === currentCountry.pricing.installationCostPerWatt &&
            prevCosts.electricityRate === currentCountry.pricing.electricityRate &&
            prevCosts.laborRate === currentCountry.pricing.laborRate &&
            prevCosts.permitCost === currentCountry.pricing.permitCost) {
          return prevCosts; // No change needed
        }
        
        return {
          panelCostPerWatt: currentCountry.pricing.panelCostPerWatt,
          installationCostPerWatt: currentCountry.pricing.installationCostPerWatt,
          electricityRate: currentCountry.pricing.electricityRate,
          laborRate: currentCountry.pricing.laborRate,
          installationHours: 40,
          permitCost: currentCountry.pricing.permitCost
        };
      });
    }
  }, [currentCountry]);  // Calculate basic results whenever panel specs or system config change
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
  }, [panelSpecs, systemConfig]);

  // Calculate cost analysis separately to avoid infinite loops
  useEffect(() => {
    if (panelSpecs.power > 0 && systemConfig.panels > 0 && currentCountry) {
      const totalPower = panelSpecs.power * systemConfig.panels;
      const newCostAnalysis = calculateSystemCost({
        totalPower,
        country: currentCountry,
        customCosts
      });
      setCostAnalysis(newCostAnalysis);
    } else {
      setCostAnalysis(null);
    }
  }, [panelSpecs.power, systemConfig.panels, currentCountry, customCosts]);
  return (
    <div className="space-y-8">
      {/* Input Sections */}
      <div id="input" className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Country & Input Panel */}
        <div className="xl:col-span-1 space-y-6">
          <div id="country">
            <CountrySelector
              selectedCountry={selectedCountry}
              onCountryChange={setSelectedCountry}
            />
          </div>
          
          <PanelInput
            panelSpecs={panelSpecs}
            systemConfig={systemConfig}
            onPanelSpecsChange={setPanelSpecs}
            onSystemConfigChange={setSystemConfig}
            selectedCountry={selectedCountry}
          />
          
          {currentCountry && (
            <div id="cost">
              <CostInput
                country={currentCountry}
                customCosts={customCosts}
                onCostChange={handleCostChange}
              />
            </div>
          )}
        </div>

        {/* Results Section */}
        <div className="xl:col-span-2 space-y-6">
          {/* Configuration Tabs */}
          <div id="calculator">
            <ConfigurationTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              results={results}
              panelSpecs={panelSpecs}
              systemConfig={systemConfig}
              safetyChecks={safetyChecks}
            />
          </div>

          {/* Results Display */}
          {results && (
            <div id="results">
              <ResultsDisplay
                results={results}
                activeConfiguration={activeTab}
                panelSpecs={panelSpecs}
                systemConfig={systemConfig}
              />
            </div>
          )}

          {/* Cost Analysis */}
          {costAnalysis && currentCountry && (
            <div id="cost-analysis">
              <CostAnalysisDisplay
                analysis={costAnalysis}
                country={currentCountry}
                systemPower={panelSpecs.power * systemConfig.panels}
              />
            </div>
          )}

          {/* Comparison Chart */}
          {results && (
            <div id="comparison" className="bg-card text-card-foreground rounded-xl border shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calculator className="w-5 h-5 text-primary" />
                <h3 className="text-xl font-semibold">
                  Configuration Comparison
                </h3>
              </div>
              <ComparisonChart results={results} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
