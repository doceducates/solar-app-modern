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

// Inverter related types
export interface VoltageRange {
  min: number;
  max: number;
}

export interface Dimensions {
  length: number; // mm
  width: number; // mm
  height: number; // mm
}

export interface PriceRange {
  min: number; // USD
  max: number; // USD
}

export interface InverterSpecifications {
  // Core power specifications
  ratedPower: number; // W - Continuous rated power
  maxPower: number; // W - Maximum power
  continuousPower: number; // W - Continuous power rating
  surgePower?: number; // W - Peak/surge power capability
  
  // DC Input specifications
  dcVoltageNominal: number; // V - Nominal DC voltage
  dcVoltageRange: VoltageRange; // V - Min/max DC voltage range
  dcCurrentMax: number; // A - Maximum DC current
  
  // AC Output specifications
  acVoltageNominal: number; // V - Nominal AC voltage
  acVoltageRange: VoltageRange; // V - Min/max AC voltage range
  acFrequency: number; // Hz - AC frequency (50/60)
  acCurrentMax: number; // A - Maximum AC current
  acPhases: 1 | 3; // Number of AC phases
  
  // Solar/MPPT specifications
  mpptChannels: number; // Number of MPPT channels
  maxPvPower: number; // W - Maximum PV array power
  mpptVoltageRange: VoltageRange; // V - MPPT operating voltage range
  maxSolarVoltage: number; // V - Maximum solar input voltage (VOC)
  maxSolarCurrent: number; // A - Maximum solar input current
  
  // Battery specifications (for hybrid inverters)
  batteryVoltage?: number; // V - Battery system voltage
  batteryVoltageRange?: VoltageRange; // V - Battery voltage range
  maxChargeCurrent?: number; // A - Maximum battery charge current
  defaultChargeCurrent?: number; // A - Default charge current
  
  // AC Charger specifications (for hybrid inverters)
  acChargerPower?: number; // W - AC charger power
  acChargerVoltage?: number; // V - AC charger voltage
  acChargerCurrent?: number; // A - AC charger current
  
  // Environmental specifications
  operatingTempRange: VoltageRange; // °C - Operating temperature range
  humidity: number; // % - Maximum humidity
  altitude: number; // m - Maximum altitude
  
  // Physical specifications
  dimensions: Dimensions; // mm - Physical dimensions
  weight: number; // kg - Weight
  cooling: 'passive' | 'forced_air' | 'liquid'; // Cooling method
  enclosureRating: string; // IP rating (IP65, etc.)
  
  // Performance and compliance
  certifications: string[]; // CE, UL, etc.
  safetyClass: string; // Class I, II, etc.
  efficiency: number; // % - Peak efficiency
  
  // Market and pricing
  countryAvailability: string[]; // Available countries
  priceRange: PriceRange; // USD price range
  
  // Features and capabilities
  gridTie: boolean; // Grid-tie capability
  offGrid: boolean; // Off-grid capability
  batteryBackup: boolean; // Battery backup support
  loadSharing: boolean; // Load sharing capability
  remoteMonitoring: boolean; // Remote monitoring support
  
  // Installation and maintenance
  installationType: 'indoor' | 'outdoor' | 'both'; // Installation location
  warrantyYears: number; // Warranty period
  maintenanceRequired: boolean; // Regular maintenance required
}

export interface InverterPreset extends InverterSpecifications {
  id: string;
  name: string;
  description: string;
  manufacturer: string;
  model: string;
  category: 'string' | 'microinverter' | 'optimizer' | 'hybrid'; // Inverter category
  type: 'string' | 'microinverter' | 'central'; // Inverter type
}

export interface InverterConfiguration {
  inverter: InverterPreset;
  quantity: number; // Number of inverters
  stringsPerInverter?: number; // For string inverters
  panelsPerString?: number; // For string inverters
  totalPanels: number;
}

export interface SystemCompatibility {
  isCompatible: boolean;
  voltageCompatible: boolean;
  currentCompatible: boolean;
  powerCompatible: boolean;
  issues: string[];
  warnings: string[];
  recommendations: string[];
}

export interface InverterValidationResult {
  panelConfiguration: {
    totalVoltage: number;
    totalCurrent: number;
    totalPower: number;
  };
  inverterLimits: {
    maxVoltage: number;
    maxCurrent: number;
    maxPower: number;
  };
  compatibility: SystemCompatibility;
  utilizationFactors: {
    voltage: number; // % of inverter capacity used
    current: number; // % of inverter capacity used
    power: number; // % of inverter capacity used
  };
}
