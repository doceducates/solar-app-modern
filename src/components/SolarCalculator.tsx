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
  });  const [results, setResults] = useState<ConfigurationResults | null>(null);
  const [activeTab, setActiveTab] = useState<'series' | 'parallel' | 'combined'>('series');
  const [safetyChecks, setSafetyChecks] = useState<SafetyChecks>({});
  const [costAnalysis, setCostAnalysis] = useState<CostAnalysis | null>(null);
  
  // Custom cost inputs state - initialized with default Pakistan values
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
  });  // Get current country data - memoized to prevent unnecessary re-renders
  const currentCountry = useMemo(() => getCountryById(selectedCountry), [selectedCountry]);

  // Memoized cost change handler to prevent infinite loops
  const handleCostChange = useCallback((newCosts: typeof customCosts) => {
    setCustomCosts(newCosts);
  }, []);

  // Handle country change and update costs accordingly
  const handleCountryChange = useCallback((newCountryId: string) => {
    setSelectedCountry(newCountryId);
    
    // Update costs when country changes
    const newCountry = getCountryById(newCountryId);
    if (newCountry) {
      setCustomCosts(prevCosts => ({
        panelCostPerWatt: newCountry.pricing.panelCostPerWatt,
        installationCostPerWatt: newCountry.pricing.installationCostPerWatt,
        electricityRate: newCountry.pricing.electricityRate,
        laborRate: newCountry.pricing.laborRate,
        installationHours: prevCosts.installationHours || 40, // Keep existing hours
        permitCost: newCountry.pricing.permitCost
      }));
    }
  }, []);// Calculate basic results whenever panel specs or system config change
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
  }, [panelSpecs, systemConfig]);  // Memoize custom costs to prevent infinite loops
  const memoizedCustomCosts = useMemo(() => ({
    panelCostPerWatt: customCosts.panelCostPerWatt,
    installationCostPerWatt: customCosts.installationCostPerWatt,
    electricityRate: customCosts.electricityRate,
    laborRate: customCosts.laborRate,
    installationHours: customCosts.installationHours,
    permitCost: customCosts.permitCost
  }), [
    customCosts.panelCostPerWatt,
    customCosts.installationCostPerWatt,
    customCosts.electricityRate,
    customCosts.laborRate,
    customCosts.installationHours,
    customCosts.permitCost
  ]);

  // Calculate cost analysis separately to avoid infinite loops
  useEffect(() => {
    const country = getCountryById(selectedCountry);
    if (panelSpecs.power > 0 && systemConfig.panels > 0 && country) {
      const totalPower = panelSpecs.power * systemConfig.panels;
      const newCostAnalysis = calculateSystemCost({
        totalPower,
        country,
        customCosts: memoizedCustomCosts
      });
      setCostAnalysis(newCostAnalysis);
    } else {
      setCostAnalysis(null);
    }
  }, [panelSpecs.power, systemConfig.panels, selectedCountry, memoizedCustomCosts]);
  return (
    <div className="space-y-8">
      {/* Input Sections */}
      <div id="input" className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Country & Input Panel */}
        <div className="xl:col-span-1 space-y-6">          <div id="country">
            <CountrySelector
              selectedCountry={selectedCountry}
              onCountryChange={handleCountryChange}
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
