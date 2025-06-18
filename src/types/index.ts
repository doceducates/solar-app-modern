// Types for Solar Panel Calculator

export interface PanelSpecifications {
  // Core electrical specifications (required)
  voltage: number; // Vmp - Maximum Power Voltage
  current: number; // Imp - Maximum Power Current
  power: number; // Pmp - Maximum Power
  voc: number; // Open Circuit Voltage
  isc: number; // Short Circuit Current
  
  // Safety and system specifications
  maxSeriesFuse: number; // Maximum series fuse rating
  maxSystemVoltage: number; // Maximum allowable system voltage
  temperatureCoefficient?: number; // Power temperature coefficient (%/°C)
  efficiency?: number; // Module efficiency (%)
  
  // Physical specifications (optional for calculations)
  length?: number; // Module length (mm)
  width?: number; // Module width (mm)
  thickness?: number; // Module thickness (mm)
  weight?: number; // Module weight (kg)
  
  // Advanced specifications
  powerTolerancePositive?: number; // Positive power tolerance (W)
  powerToleranceNegative?: number; // Negative power tolerance (W)
  bifacial?: boolean; // Bifacial capability
  bifacialFactor?: number; // Bifacial power gain (%)
  cellType?: string; // Cell technology (mono, poly, etc.)
  glassType?: string; // Glass type (single, dual, etc.)
  frameColor?: string; // Frame color
  
  // Mechanical specifications
  mechanicalLoadPositive?: number; // Snow load capacity (Pa)
  mechanicalLoadNegative?: number; // Wind load capacity (Pa)
  
  // Warranty and degradation
  warrantyYears?: number;
  degradationFirstYear?: number; // First year degradation (%)
  degradationAnnual?: number; // Annual degradation (%)
}

export interface PanelPreset extends PanelSpecifications {
  id: string;
  name: string;
  description: string;
  manufacturer?: string;
  model?: string;
  category: 'residential' | 'commercial' | 'utility' | 'small';
  countryAvailability?: string[]; // List of country IDs where this panel is available
}

export interface SystemConfiguration {
  panels: number;
  efficiency: number; // System efficiency (0-100)
  seriesGroups?: number; // For combined configuration
  panelsPerGroup?: number; // For combined configuration
}

export interface CalculationResults {
  voltage: number;
  current: number;
  power: number;
  energy?: number; // kWh per day
}

export interface ConfigurationResults {
  series: CalculationResults;
  parallel: CalculationResults;
  combined: CalculationResults;
}

export interface SafetyCheck {
  type: 'info' | 'warning' | 'error';
  message: string;
  field?: string;
  recommendation?: string;
}

// Country and pricing related types
export interface CountryPricing {
  id: string;
  name: string;
  currency: {
    code: string;
    symbol: string;
    name: string;
  };
  pricing: {
    panelCostPerWatt: number;
    installationCostPerWatt: number;
    electricityRate: number;
    laborRate: number;
    permitCost: number;
  };
  incentives?: {
    name: string;
    type: 'rebate' | 'tax_credit' | 'feed_in_tariff';
    value: number;
    description: string;
  }[];
  regulations: {
    maxSystemVoltage: number;
    requiresPermit: boolean;
    gridTieAllowed: boolean;
    netMeteringAvailable: boolean;
  };
}

export interface CostAnalysis {
  totalSystemCost: number;
  costPerWatt: number;
  installationCost: number;
  panelCost: number;
  laborCost: number;
  permitCost: number;
  annualSavings: number;
  paybackPeriod: number;
  roi25Years: number;
  currency: string;
}

export interface SafetyChecks {
  series?: {
    errors?: string[];
    warnings?: string[];
    info?: string[];
  };
  parallel?: {
    errors?: string[];
    warnings?: string[];
    info?: string[];
  };
  combined?: {
    errors?: string[];
    warnings?: string[];
    info?: string[];  };
}

export interface EnvironmentalImpact {
  co2Saved: number; // kg per year
  treesEquivalent: number;
  homesEquivalent: number;
}

export interface ExportData {
  timestamp: string;
  panelSpecs: PanelSpecifications;
  systemConfig: SystemConfiguration;
  results: ConfigurationResults;
  safetyChecks: SafetyCheck[];
  costAnalysis?: CostAnalysis;
  environmentalImpact?: EnvironmentalImpact;
}

export type ConfigurationType = 'series' | 'parallel' | 'combined';

export type Theme = 'light' | 'dark' | 'system';

export interface AppSettings {
  theme: Theme;
  units: 'metric' | 'imperial';
  currency: string;
  showAdvanced: boolean;
  autoCalculate: boolean;
}
