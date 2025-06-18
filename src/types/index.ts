// Types for Solar Panel Calculator

export interface PanelSpecifications {
  voltage: number; // Vmp - Operating voltage
  current: number; // Imp - Operating current
  power: number; // Pmax - Maximum power
  voc: number; // Open circuit voltage
  isc: number; // Short circuit current
  maxSeriesFuse: number; // Maximum series fuse rating
  maxSystemVoltage: number; // Maximum allowable system voltage
  temperatureCoefficient?: number; // Power temperature coefficient
  efficiency?: number; // Panel efficiency percentage
}

export interface PanelPreset extends PanelSpecifications {
  id: string;
  name: string;
  description: string;
  manufacturer?: string;
  model?: string;
  category: 'residential' | 'commercial' | 'utility' | 'small';
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

export interface CostAnalysis {
  panelCost: number;
  installationCost: number;
  totalCost: number;
  costPerWatt: number;
  paybackPeriod: number; // years
  roi: number; // percentage
  savings20Years: number;
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
