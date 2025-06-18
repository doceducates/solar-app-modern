import { InverterPreset } from '@/types';

// Inverter presets based on common specifications and market availability
export const INVERTER_PRESETS: InverterPreset[] = [
  // Inverex Energy - Pakistani Market Leader
  {
    id: 'inverex-veyron-ii-6000w',
    name: 'Veyron II Premium 6000W 48V',
    description: 'MPPT-based solar inverter with dual charging modes - Popular in Pakistan',
    manufacturer: 'Inverex Energy',
    model: 'Veyron II Premium-6000W-48V',
    category: 'hybrid',
    type: 'string',
    
    // Power Specifications
    ratedPower: 6000, // VA/W
    maxPower: 6000,
    continuousPower: 6000,
    surgePower: 9000, // Estimated 1.5x rated power
    
    // DC Input Specifications
    dcVoltageNominal: 48, // VDC
    dcVoltageRange: { min: 40, max: 60 }, // Estimated range for 48V system
    dcCurrentMax: 137, // A
    
    // AC Output Specifications
    acVoltageNominal: 230, // VAC
    acVoltageRange: { min: 207, max: 253 }, // ±10% typical
    acFrequency: 50, // Hz (also supports 60Hz)
    acCurrentMax: 26, // A
    acPhases: 1, // Single phase (2φ refers to split-phase)
    
    // Solar/MPPT Specifications
    mpptChannels: 1,
    maxPvPower: 6500, // W
    mpptVoltageRange: { min: 120, max: 450 }, // V
    maxSolarVoltage: 500, // VOC max
    maxSolarCurrent: 27, // A
    
    // AC Charger Specifications
    acChargerPower: 9200, // 230V × 40A
    acChargerVoltage: 230, // VAC
    acChargerCurrent: 40, // A
    
    // Battery Specifications
    batteryVoltage: 48, // V nominal
    batteryVoltageRange: { min: 40, max: 58 }, // Estimated range
    maxChargeCurrent: 120, // A max
    defaultChargeCurrent: 30, // A default
    
    // Environmental Specifications
    operatingTempRange: { min: -10, max: 50 }, // °C
    humidity: 95, // % max non-condensing
    altitude: 2000, // m max
    
    // Physical Specifications
    dimensions: { length: 450, width: 350, height: 120 }, // mm estimated
    weight: 15, // kg estimated
    cooling: 'forced_air',
    enclosureRating: 'IP21',
    
    // Certifications and Standards
    certifications: ['CE', 'RoHS'],
    safetyClass: 'Class I',
    efficiency: 94, // % estimated for MPPT inverters
    
    // Market Availability
    countryAvailability: ['pakistan', 'bangladesh', 'india', 'sri_lanka'],
    priceRange: { min: 850, max: 1200 }, // USD estimated
    
    // Compatibility Features
    gridTie: true,
    offGrid: true,
    batteryBackup: true,
    loadSharing: true,
    remoteMonitoring: false, // Not specified in datasheet
    
    // Installation and Warranty
    installationType: 'indoor',
    warrantyYears: 2, // Typical for Inverex
    maintenanceRequired: false
  },
  
  // SMA - German Premium Brand
  {
    id: 'sma-sunny-boy-5000tl',
    name: 'Sunny Boy 5.0 TL',
    description: 'Premium German string inverter with high efficiency',
    manufacturer: 'SMA',
    model: 'SB 5.0-1AV-41',
    category: 'string',
    type: 'string',
    
    ratedPower: 5000,
    maxPower: 5000,
    continuousPower: 5000,
    surgePower: 6000,
    
    dcVoltageNominal: 400,
    dcVoltageRange: { min: 125, max: 750 },
    dcCurrentMax: 20,
    
    acVoltageNominal: 230,
    acVoltageRange: { min: 180, max: 280 },
    acFrequency: 50,
    acCurrentMax: 21.7,
    acPhases: 1,
    
    mpptChannels: 2,
    maxPvPower: 7500,
    mpptVoltageRange: { min: 125, max: 750 },
    maxSolarVoltage: 1000,
    maxSolarCurrent: 20,
    
    operatingTempRange: { min: -25, max: 60 },
    humidity: 100,
    altitude: 4000,
    
    dimensions: { length: 470, width: 342, height: 180 },
    weight: 25,
    cooling: 'passive',
    enclosureRating: 'IP65',
    
    certifications: ['CE', 'VDE', 'IEC62109'],
    safetyClass: 'Class I',
    efficiency: 97.2,
    
    countryAvailability: ['germany', 'usa', 'uk', 'australia', 'pakistan'],
    priceRange: { min: 1200, max: 1800 },
    
    gridTie: true,
    offGrid: false,
    batteryBackup: false,
    loadSharing: false,
    remoteMonitoring: true,
    
    installationType: 'outdoor',
    warrantyYears: 10,
    maintenanceRequired: false
  },
  
  // Growatt - Chinese Value Brand
  {
    id: 'growatt-min-3000tl-x',
    name: 'MIN 3000TL-X',
    description: 'Cost-effective string inverter for residential applications',
    manufacturer: 'Growatt',
    model: 'MIN 3000TL-X',
    category: 'string',
    type: 'string',
    
    ratedPower: 3000,
    maxPower: 3000,
    continuousPower: 3000,
    surgePower: 3600,
    
    dcVoltageNominal: 400,
    dcVoltageRange: { min: 50, max: 550 },
    dcCurrentMax: 12.5,
    
    acVoltageNominal: 230,
    acVoltageRange: { min: 180, max: 264 },
    acFrequency: 50,
    acCurrentMax: 13.6,
    acPhases: 1,
    
    mpptChannels: 2,
    maxPvPower: 4500,
    mpptVoltageRange: { min: 50, max: 550 },
    maxSolarVoltage: 600,
    maxSolarCurrent: 12.5,
    
    operatingTempRange: { min: -25, max: 60 },
    humidity: 95,
    altitude: 3000,
    
    dimensions: { length: 310, width: 220, height: 115 },
    weight: 7.5,
    cooling: 'passive',
    enclosureRating: 'IP65',
    
    certifications: ['CE', 'IEC62109', 'G98'],
    safetyClass: 'Class I',
    efficiency: 97.4,
    
    countryAvailability: ['pakistan', 'india', 'bangladesh', 'china', 'usa'],
    priceRange: { min: 400, max: 700 },
    
    gridTie: true,
    offGrid: false,
    batteryBackup: false,
    loadSharing: false,
    remoteMonitoring: true,
    
    installationType: 'outdoor',
    warrantyYears: 10,
    maintenanceRequired: false
  },
  
  // Huawei - Premium Technology
  {
    id: 'huawei-sun2000-5ktl-l1',
    name: 'SUN2000-5KTL-L1',
    description: 'AI-powered string inverter with advanced monitoring',
    manufacturer: 'Huawei',
    model: 'SUN2000-5KTL-L1',
    category: 'string',
    type: 'string',
    
    ratedPower: 5000,
    maxPower: 5000,
    continuousPower: 5000,
    surgePower: 6000,
    
    dcVoltageNominal: 600,
    dcVoltageRange: { min: 90, max: 1000 },
    dcCurrentMax: 12.5,
    
    acVoltageNominal: 230,
    acVoltageRange: { min: 180, max: 264 },
    acFrequency: 50,
    acCurrentMax: 22.7,
    acPhases: 1,
    
    mpptChannels: 2,
    maxPvPower: 6500,
    mpptVoltageRange: { min: 90, max: 1000 },
    maxSolarVoltage: 1100,
    maxSolarCurrent: 12.5,
    
    operatingTempRange: { min: -25, max: 60 },
    humidity: 100,
    altitude: 4000,
    
    dimensions: { length: 365, width: 365, height: 156 },
    weight: 17,
    cooling: 'passive',
    enclosureRating: 'IP65',
    
    certifications: ['CE', 'IEC62109', 'G98/G99'],
    safetyClass: 'Class I',
    efficiency: 98.4,
    
    countryAvailability: ['pakistan', 'india', 'china', 'germany', 'usa', 'uk'],
    priceRange: { min: 800, max: 1400 },
    
    gridTie: true,
    offGrid: false,
    batteryBackup: false,
    loadSharing: false,
    remoteMonitoring: true,
    
    installationType: 'outdoor',
    warrantyYears: 10,
    maintenanceRequired: false
  },
  
  // Microinverters - Enphase
  {
    id: 'enphase-iq7plus',
    name: 'IQ7PLUS Microinverter',
    description: 'Premium microinverter for module-level optimization',
    manufacturer: 'Enphase',
    model: 'IQ7PLUS-72-M-INT',
    category: 'microinverter',
    type: 'microinverter',
    
    ratedPower: 295,
    maxPower: 295,
    continuousPower: 295,
    surgePower: 320,
    
    dcVoltageNominal: 40,
    dcVoltageRange: { min: 16, max: 60 },
    dcCurrentMax: 13,
    
    acVoltageNominal: 230,
    acVoltageRange: { min: 180, max: 264 },
    acFrequency: 50,
    acCurrentMax: 1.28,
    acPhases: 1,
    
    mpptChannels: 1,
    maxPvPower: 440,
    mpptVoltageRange: { min: 16, max: 60 },
    maxSolarVoltage: 60,
    maxSolarCurrent: 13,
    
    operatingTempRange: { min: -40, max: 65 },
    humidity: 100,
    altitude: 3000,
    
    dimensions: { length: 212, width: 175, height: 35 },
    weight: 0.7,
    cooling: 'passive',
    enclosureRating: 'IP67',
    
    certifications: ['CE', 'IEC62109', 'G98'],
    safetyClass: 'Class II',
    efficiency: 97.5,
    
    countryAvailability: ['usa', 'germany', 'uk', 'australia'],
    priceRange: { min: 150, max: 250 },
    
    gridTie: true,
    offGrid: false,
    batteryBackup: false,
    loadSharing: false,
    remoteMonitoring: true,
    
    installationType: 'outdoor',
    warrantyYears: 25,
    maintenanceRequired: false
  },
  
  // Power Optimizers - SolarEdge
  {
    id: 'solaredge-hd-wave-5000',
    name: 'HD-Wave SE5000H',
    description: 'High-efficiency string inverter with power optimizers',
    manufacturer: 'SolarEdge',
    model: 'SE5000H-US',
    category: 'optimizer',
    type: 'string',
    
    ratedPower: 5000,
    maxPower: 5000,
    continuousPower: 5000,
    surgePower: 6000,
    
    dcVoltageNominal: 400,
    dcVoltageRange: { min: 125, max: 500 },
    dcCurrentMax: 15,
    
    acVoltageNominal: 240,
    acVoltageRange: { min: 211, max: 264 },
    acFrequency: 60,
    acCurrentMax: 21.7,
    acPhases: 1,
    
    mpptChannels: 1,
    maxPvPower: 7500,
    mpptVoltageRange: { min: 125, max: 500 },
    maxSolarVoltage: 500,
    maxSolarCurrent: 15,
    
    operatingTempRange: { min: -25, max: 60 },
    humidity: 95,
    altitude: 3000,
    
    dimensions: { length: 656, width: 336, height: 171 },
    weight: 19.3,
    cooling: 'passive',
    enclosureRating: 'IP65',
    
    certifications: ['UL1741', 'IEEE1547', 'FCC'],
    safetyClass: 'Class I',
    efficiency: 99.2,
    
    countryAvailability: ['usa', 'germany', 'uk', 'australia'],
    priceRange: { min: 1400, max: 2000 },
    
    gridTie: true,
    offGrid: false,
    batteryBackup: false,
    loadSharing: false,
    remoteMonitoring: true,
    
    installationType: 'outdoor',
    warrantyYears: 12,
    maintenanceRequired: false
  },
  
  // Budget Options - Local Brands
  {
    id: 'generic-1500w-hybrid',
    name: '1500W Budget Hybrid',
    description: 'Cost-effective hybrid inverter for small systems',
    manufacturer: 'Generic',
    model: 'HYB-1500-24V',
    category: 'hybrid',
    type: 'string',
    
    ratedPower: 1500,
    maxPower: 1500,
    continuousPower: 1500,
    surgePower: 3000,
    
    dcVoltageNominal: 24,
    dcVoltageRange: { min: 20, max: 30 },
    dcCurrentMax: 75,
    
    acVoltageNominal: 230,
    acVoltageRange: { min: 200, max: 250 },
    acFrequency: 50,
    acCurrentMax: 6.5,
    acPhases: 1,
    
    mpptChannels: 1,
    maxPvPower: 2000,
    mpptVoltageRange: { min: 60, max: 120 },
    maxSolarVoltage: 150,
    maxSolarCurrent: 25,
    
    operatingTempRange: { min: 0, max: 45 },
    humidity: 90,
    altitude: 2000,
    
    dimensions: { length: 300, width: 200, height: 100 },
    weight: 8,
    cooling: 'passive',
    enclosureRating: 'IP20',
    
    certifications: ['CE'],
    safetyClass: 'Class I',
    efficiency: 90,
    
    countryAvailability: ['pakistan', 'bangladesh', 'india'],
    priceRange: { min: 200, max: 400 },
    
    gridTie: true,
    offGrid: true,
    batteryBackup: true,
    loadSharing: true,
    remoteMonitoring: false,
    
    installationType: 'indoor',
    warrantyYears: 1,
    maintenanceRequired: true
  }
];

// Inverter categories for filtering
export const INVERTER_CATEGORIES = {
  'string': 'String Inverter',
  'microinverter': 'Microinverter',
  'optimizer': 'Power Optimizer',
  'hybrid': 'Hybrid/Battery'
} as const;

// Inverter types for classification
export const INVERTER_TYPES = {
  'string': 'String Inverter',
  'microinverter': 'Microinverter',
  'central': 'Central Inverter'
} as const;

// Installation types
export const INSTALLATION_TYPES = {
  'indoor': 'Indoor Installation',
  'outdoor': 'Outdoor Installation',
  'both': 'Indoor/Outdoor Compatible'
} as const;

// Cooling methods
export const COOLING_METHODS = {
  'passive': 'Passive Cooling',
  'forced_air': 'Forced Air Cooling',
  'liquid': 'Liquid Cooling'
} as const;

// Safety validation constants
export const INVERTER_VALIDATION = {
  MIN_EFFICIENCY: 80, // Minimum acceptable efficiency %
  MAX_DC_VOLTAGE: 1200, // Maximum safe DC voltage
  MIN_DC_VOLTAGE: 12, // Minimum DC voltage
  SAFETY_FACTOR_VOLTAGE: 1.15, // 15% safety margin for voltage
  SAFETY_FACTOR_CURRENT: 1.25, // 25% safety margin for current
  SAFETY_FACTOR_POWER: 1.1, // 10% safety margin for power
  MAX_STRING_CURRENT: 20, // Maximum recommended string current
  DERATING_FACTOR: 0.8 // General derating factor for real-world conditions
} as const;

// Compatibility check parameters
export const COMPATIBILITY_LIMITS = {
  VOLTAGE_TOLERANCE: 0.05, // 5% voltage tolerance
  CURRENT_TOLERANCE: 0.1, // 10% current tolerance
  POWER_TOLERANCE: 0.15, // 15% power tolerance
  TEMPERATURE_SAFETY: 10 // 10°C temperature safety margin
} as const;
