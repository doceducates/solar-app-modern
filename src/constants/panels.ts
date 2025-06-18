import { PanelPreset } from '@/types';

// Solar panel presets based on common specifications and Pakistani market
export const PANEL_PRESETS: PanelPreset[] = [
  // Pakistani Market Panels
  {
    id: '600w-topcon-ntype',
    name: '600W TOPCon N-Type',
    description: 'High efficiency N-Type TOPCon technology - Popular in Pakistan',
    category: 'commercial',
    manufacturer: 'JA Solar',
    model: 'JAM72S30-600/MR',
    voltage: 40.98,
    current: 14.64,
    power: 600,
    voc: 49.45,
    isc: 15.52,
    maxSeriesFuse: 30,
    maxSystemVoltage: 1500,
    temperatureCoefficient: -0.30,
    efficiency: 22.3,
    countryAvailability: ['pakistan', 'india', 'usa', 'germany']
  },
  {
    id: '580w-longi-himo6',
    name: '580W Longi Hi-MO 6',
    description: 'Premium mono PERC - Widely available in Pakistan',
    category: 'commercial',
    manufacturer: 'Longi',
    model: 'LR5-72HIH-580M',
    voltage: 40.1,
    current: 14.47,
    power: 580,
    voc: 48.8,
    isc: 15.39,
    maxSeriesFuse: 30,
    maxSystemVoltage: 1500,
    temperatureCoefficient: -0.35,
    efficiency: 21.8,
    countryAvailability: ['pakistan', 'india', 'usa', 'uk']
  },
  {
    id: '550w-trina-vertex',
    name: '550W Trina Vertex',
    description: 'Cost-effective choice - Common in Pakistani installations',
    category: 'residential',
    manufacturer: 'Trina Solar',
    model: 'TSM-550NEG9R.28',
    voltage: 38.4,
    current: 14.33,
    power: 550,
    voc: 46.1,
    isc: 15.26,
    maxSeriesFuse: 30,
    maxSystemVoltage: 1500,
    temperatureCoefficient: -0.37,
    efficiency: 21.2,
    countryAvailability: ['pakistan', 'india', 'usa', 'germany', 'uk']
  },
  {
    id: '545w-canadian-hiku7',
    name: '545W Canadian HiKu7',
    description: 'Reliable performance - Available through Pakistani distributors',
    category: 'residential',
    manufacturer: 'Canadian Solar',
    model: 'CS7N-545MS',
    voltage: 37.8,
    current: 14.42,
    power: 545,
    voc: 45.7,
    isc: 15.38,
    maxSeriesFuse: 30,
    maxSystemVoltage: 1500,
    temperatureCoefficient: -0.35,
    efficiency: 21.0,
    countryAvailability: ['pakistan', 'usa', 'germany']
  },
  // International Standards
  {
    id: '600w-high-performance',
    name: '600W High Performance',
    description: 'Premium residential/commercial panels',
    category: 'commercial',
    manufacturer: 'Generic',
    model: 'HP-600',
    voltage: 40.3,
    current: 14.91,
    power: 600,
    voc: 48.4,
    isc: 15.80,
    maxSeriesFuse: 35,
    maxSystemVoltage: 1500,
    temperatureCoefficient: -0.35,
    efficiency: 22.1,
    countryAvailability: ['usa', 'uk', 'germany']
  },
  {
    id: '400w-standard',
    name: '400W Standard',
    description: 'Popular residential choice',
    category: 'residential',
    manufacturer: 'Generic',
    model: 'ST-400',
    voltage: 32.5,
    current: 12.3,
    power: 400,
    voc: 39.2,
    isc: 13.1,
    maxSeriesFuse: 25,
    maxSystemVoltage: 1000,
    temperatureCoefficient: -0.38,
    efficiency: 20.4
  },
  {
    id: '300w-residential',
    name: '300W Residential',
    description: 'Common residential installation',
    category: 'residential',
    manufacturer: 'Generic',
    model: 'RS-300',
    voltage: 24.0,
    current: 12.5,
    power: 300,
    voc: 30.2,
    isc: 13.2,
    maxSeriesFuse: 20,
    maxSystemVoltage: 1000,
    temperatureCoefficient: -0.40,
    efficiency: 18.5
  },
  {
    id: '250w-budget',
    name: '250W Budget',
    description: 'Cost-effective option',
    category: 'residential',
    manufacturer: 'Generic',
    model: 'BG-250',
    voltage: 30.0,
    current: 8.33,
    power: 250,
    voc: 36.5,
    isc: 8.9,
    maxSeriesFuse: 15,
    maxSystemVoltage: 600,
    temperatureCoefficient: -0.42,
    efficiency: 16.2
  },
  {
    id: '100w-small',
    name: '100W Small',
    description: 'Off-grid and small applications',
    category: 'small',
    manufacturer: 'Generic',
    model: 'SM-100',
    voltage: 12.0,
    current: 8.33,
    power: 100,
    voc: 14.4,
    isc: 8.9,
    maxSeriesFuse: 15,
    maxSystemVoltage: 600,
    temperatureCoefficient: -0.45,
    efficiency: 15.8
  }
];

// Standard test conditions
export const STC = {
  irradiance: 1000, // W/m²
  cellTemperature: 25, // °C
  airMass: 1.5
};

// Electrical constants
export const ELECTRICAL_CONSTANTS = {
  SAFETY_FACTOR: 1.25, // NEC requirement
  TEMPERATURE_DERATING: 0.8, // Typical derating for temperature
  DEFAULT_EFFICIENCY: 85, // Default system efficiency %
  MAX_STRING_LENGTH: 25, // Typical maximum panels per string
  MIN_OPERATING_VOLTAGE: 200, // Minimum for grid-tie inverters
  MAX_OPERATING_VOLTAGE: 600 // Common residential limit
};

// Environmental constants
export const ENVIRONMENTAL_CONSTANTS = {
  CO2_PER_KWH: 0.85, // kg CO2 per kWh (grid average)
  TREES_PER_TON_CO2: 40, // Trees equivalent per ton CO2
  HOME_USAGE_KWH_YEAR: 10800 // Average home usage per year
};

// Validation limits
export const VALIDATION_LIMITS = {
  MIN_VOLTAGE: 0.1,
  MAX_VOLTAGE: 100,
  MIN_CURRENT: 0.1,
  MAX_CURRENT: 50,
  MIN_PANELS: 1,
  MAX_PANELS: 1000,
  MIN_EFFICIENCY: 1,
  MAX_EFFICIENCY: 100,
  MIN_VOC: 0.1,
  MAX_VOC: 150,
  MIN_ISC: 0.1,
  MAX_ISC: 100
};
