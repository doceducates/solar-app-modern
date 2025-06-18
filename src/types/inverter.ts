// Inverter types for Solar System Design

export interface InverterSpecifications {
  // Core electrical specifications (required)
  ratedPower: number; // Rated power in watts (VA/W)
  maxPvPower: number; // Maximum PV array power (W)
  
  // MPPT and voltage specifications
  mpptVoltageMin: number; // Minimum MPPT voltage (V)
  mpptVoltageMax: number; // Maximum MPPT voltage (V) 
  maxInputVoltage: number; // Maximum input voltage - VOC limit (V)
  minOperatingVoltage: number; // Minimum operating voltage (V)
  
  // Current specifications
  maxInputCurrent: number; // Maximum input current (A)
  mpptChannels: number; // Number of MPPT channels
  
  // DC input/output specifications
  dcInputVoltage?: number; // DC input voltage for battery systems (V)
  dcInputCurrent?: number; // DC input current (A)
  dcOutputVoltage?: number; // DC output voltage (V)
  dcOutputCurrent?: number; // DC output current (A)
  
  // AC specifications
  acOutputVoltage: number; // AC output voltage (V)
  acOutputFrequency: number; // AC frequency (Hz)
  acOutputCurrent: number; // AC output current (A)
  acPhases: number; // Number of phases (1 or 3)
  
  // Efficiency and performance
  maxEfficiency?: number; // Peak efficiency (%)
  euroEfficiency?: number; // European efficiency (%)
  
  // Physical and environmental
  operatingTemperatureMin?: number; // Min operating temperature (°C)
  operatingTemperatureMax?: number; // Max operating temperature (°C)
  enclosureRating?: string; // IP rating (e.g., "IP21", "IP65")
  
  // Installation and safety
  safetyClass?: string; // Safety class (e.g., "I", "II")
  certifications?: string[]; // Certifications (CE, UL, etc.)
  installationType: 'indoor' | 'outdoor' | 'both'; // Installation type
  
  // Advanced features
  hasWifiMonitoring?: boolean;
  hasDisplayScreen?: boolean;
  supportsBatteryStorage?: boolean;
  supportsGridTie?: boolean;
  supportsOffGrid?: boolean;
  hasAntiIslanding?: boolean;
}

export interface InverterPreset extends InverterSpecifications {
  id: string;
  name: string;
  description: string;
  manufacturer: string;
  model: string;
  category: 'residential' | 'commercial' | 'utility' | 'micro' | 'power_optimizer';
  priceRange?: 'budget' | 'mid-range' | 'premium';
  countryAvailability?: string[]; // List of country IDs where available
  warrantyYears?: number;
  releaseYear?: number;
  discontinued?: boolean;
}

export interface SystemCompatibility {
  isCompatible: boolean;
  issues: CompatibilityIssue[];
  warnings: CompatibilityWarning[];
  recommendations: string[];
  efficiencyRating: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface CompatibilityIssue {
  type: 'voltage_too_high' | 'voltage_too_low' | 'power_exceeded' | 'current_exceeded' | 'mppt_out_of_range';
  severity: 'error' | 'warning' | 'info';
  message: string;
  currentValue: number;
  limitValue: number;
  suggestion?: string;
}

export interface CompatibilityWarning {
  type: 'efficiency_concern' | 'safety_margin' | 'oversizing' | 'undersizing';
  message: string;
  recommendation: string;
}

export interface SystemDesign {
  panels: {
    preset: string; // Panel preset ID
    configuration: 'series' | 'parallel' | 'combined';
    totalPanels: number;
    seriesStrings?: number;
    panelsPerString?: number;
    parallelStrings?: number;
  };
  inverter: {
    preset: string; // Inverter preset ID
    quantity: number;
  };
  systemEfficiency: number;
  country: string;
}

export interface SystemValidationResult {
  design: SystemDesign;
  panelResults: {
    totalPower: number;
    voltage: number;
    current: number;
    voc: number;
    isc: number;
  };
  compatibility: SystemCompatibility;
  costAnalysis?: {
    totalCost: number;
    costPerWatt: number;
    roiYears: number;
  };
  performanceEstimate?: {
    dailyEnergyKwh: number;
    monthlyEnergyKwh: number;
    annualEnergyKwh: number;
  };
}
