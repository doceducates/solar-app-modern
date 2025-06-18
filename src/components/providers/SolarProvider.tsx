'use client';

import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { PanelSpecifications, SystemConfiguration, ConfigurationResults, SafetyChecks, CostAnalysis } from '@/types';
import { PANEL_PRESETS } from '@/constants/panels';
import { getCountryById } from '@/constants/countries';

interface SolarState {
  selectedCountry: string;
  panelSpecs: PanelSpecifications;
  systemConfig: SystemConfiguration;
  results: ConfigurationResults | null;
  safetyChecks: SafetyChecks;
  costAnalysis: CostAnalysis | null;
  customCosts: {
    panelCostPerWatt: number;
    installationCostPerWatt: number;
    electricityRate: number;
    laborRate: number;
    installationHours: number;
    permitCost: number;
  };
}

interface SolarContextType extends SolarState {
  setSelectedCountry: (country: string) => void;
  setPanelSpecs: (specs: PanelSpecifications) => void;
  setSystemConfig: (config: SystemConfiguration) => void;
  setResults: (results: ConfigurationResults | null) => void;
  setSafetyChecks: (checks: SafetyChecks) => void;
  setCostAnalysis: (analysis: CostAnalysis | null) => void;
  setCustomCosts: (costs: SolarState['customCosts']) => void;
  updateCountryAndCosts: (countryId: string) => void;
}

const SolarContext = createContext<SolarContextType | undefined>(undefined);

export function SolarProvider({ children }: { children: ReactNode }) {
  // Initialize with default values
  const defaultCountry = getCountryById('pakistan');
  
  const [state, setState] = useState<SolarState>({
    selectedCountry: 'pakistan',
    panelSpecs: PANEL_PRESETS[0],
    systemConfig: {
      panels: 4,
      efficiency: 85,
      seriesGroups: 2,
      panelsPerGroup: 2
    },
    results: null,
    safetyChecks: {},
    costAnalysis: null,
    customCosts: {
      panelCostPerWatt: defaultCountry?.pricing.panelCostPerWatt || 30,
      installationCostPerWatt: defaultCountry?.pricing.installationCostPerWatt || 45,
      electricityRate: defaultCountry?.pricing.electricityRate || 25,
      laborRate: defaultCountry?.pricing.laborRate || 800,
      installationHours: 40,
      permitCost: defaultCountry?.pricing.permitCost || 15000
    }
  });

  const setSelectedCountry = useCallback((country: string) => {
    setState(prev => ({ ...prev, selectedCountry: country }));
  }, []);

  const setPanelSpecs = useCallback((specs: PanelSpecifications) => {
    setState(prev => ({ ...prev, panelSpecs: specs }));
  }, []);

  const setSystemConfig = useCallback((config: SystemConfiguration) => {
    setState(prev => ({ ...prev, systemConfig: config }));
  }, []);

  const setResults = useCallback((results: ConfigurationResults | null) => {
    setState(prev => ({ ...prev, results }));
  }, []);

  const setSafetyChecks = useCallback((checks: SafetyChecks) => {
    setState(prev => ({ ...prev, safetyChecks: checks }));
  }, []);

  const setCostAnalysis = useCallback((analysis: CostAnalysis | null) => {
    setState(prev => ({ ...prev, costAnalysis: analysis }));
  }, []);

  const setCustomCosts = useCallback((costs: SolarState['customCosts']) => {
    setState(prev => ({ ...prev, customCosts: costs }));
  }, []);

  const updateCountryAndCosts = useCallback((countryId: string) => {
    const country = getCountryById(countryId);
    if (country) {
      setState(prev => ({
        ...prev,
        selectedCountry: countryId,
        customCosts: {
          panelCostPerWatt: country.pricing.panelCostPerWatt,
          installationCostPerWatt: country.pricing.installationCostPerWatt,
          electricityRate: country.pricing.electricityRate,
          laborRate: country.pricing.laborRate,
          installationHours: prev.customCosts.installationHours,
          permitCost: country.pricing.permitCost
        }
      }));
    }
  }, []);
  const contextValue: SolarContextType = useMemo(() => ({
    ...state,
    setSelectedCountry,
    setPanelSpecs,
    setSystemConfig,
    setResults,
    setSafetyChecks,
    setCostAnalysis,
    setCustomCosts,
    updateCountryAndCosts
  }), [
    state,
    setSelectedCountry,
    setPanelSpecs,
    setSystemConfig,
    setResults,
    setSafetyChecks,
    setCostAnalysis,
    setCustomCosts,
    updateCountryAndCosts
  ]);

  return (
    <SolarContext.Provider value={contextValue}>
      {children}
    </SolarContext.Provider>
  );
}

export function useSolar() {
  const context = useContext(SolarContext);
  if (context === undefined) {
    throw new Error('useSolar must be used within a SolarProvider');
  }
  return context;
}
