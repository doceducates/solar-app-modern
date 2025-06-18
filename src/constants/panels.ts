import { PanelPreset } from '@/types';

// Solar panel presets based on common specifications and Pakistani market
export const PANEL_PRESETS: PanelPreset[] = [  // Trina Solar Vertex Bifacial Series - Based on TSM-NEG19RC.20 datasheet
  {
    id: 'trina-vertex-580w-bifacial',
    name: '580W Trina Vertex Bifacial',
    description: 'TSM-NEG19RC.20-580 Bifacial Dual Glass Monocrystalline Module - Up to 30% bifacial gain',
    category: 'commercial',
    manufacturer: 'Trina Solar',
    model: 'TSM-NEG19RC.20-580',
    voltage: 39.2, // Vmp from datasheet
    current: 14.79, // Imp from datasheet
    power: 580,
    voc: 47.2, // Voc from datasheet
    isc: 15.65, // Isc from datasheet
    maxSeriesFuse: 35, // Max Series Fuse Rating (35A)
    maxSystemVoltage: 1500, // Max System Voltage (1500V DC)
    temperatureCoefficient: -0.30,
    efficiency: 21.5,
    
    // Advanced specifications from datasheet
    length: 2384, // Module Dimensions (2384×1134×30 mm)
    width: 1134,
    thickness: 30,
    weight: 33.7, // Weight (74.3 lb = 33.7 kg)
    powerTolerancePositive: 5,
    powerToleranceNegative: 0,
    bifacial: true,
    bifacialFactor: 30, // Up to 30% back-side power gain
    cellType: 'Monocrystalline', // 132 cells
    glassType: 'Dual Glass', // 2.0 mm front, POE/EVA encapsulant
    frameColor: 'Silver',
    mechanicalLoadPositive: 5400, // From datasheet
    mechanicalLoadNegative: 2400, // From datasheet    warrantyYears: 25,
    degradationFirstYear: 2.0, // First year degradation
    degradationAnnual: 0.40, // Annual degradation
    countryAvailability: ['pakistan', 'india', 'usa', 'germany', 'australia']
  },
  {
    id: 'trina-vertex-585w-bifacial',
    name: '585W Trina Vertex Bifacial',
    description: 'TSM-NEG19RC.20-585 Bifacial Dual Glass Monocrystalline Module - Up to 30% bifacial gain',
    category: 'commercial',
    manufacturer: 'Trina Solar',
    model: 'TSM-NEG19RC.20-585',
    voltage: 39.5, // Vmp from datasheet
    current: 14.82, // Imp from datasheet
    power: 585,
    voc: 47.5, // Voc from datasheet
    isc: 15.68, // Isc from datasheet
    maxSeriesFuse: 35,
    maxSystemVoltage: 1500,
    temperatureCoefficient: -0.30,
    efficiency: 21.6,
    
    length: 2384,
    width: 1134,
    thickness: 30,
    weight: 33.7,
    powerTolerancePositive: 5,
    powerToleranceNegative: 0,
    bifacial: true,
    bifacialFactor: 30,
    cellType: 'Monocrystalline',
    glassType: 'Dual Glass',
    frameColor: 'Silver',
    mechanicalLoadPositive: 5400,
    mechanicalLoadNegative: 2400,    warrantyYears: 25,
    degradationFirstYear: 2.0,
    degradationAnnual: 0.40,
    countryAvailability: ['pakistan', 'india', 'usa', 'germany', 'australia']
  },
  {
    id: 'trina-vertex-590w-bifacial',
    name: '590W Trina Vertex Bifacial',
    description: 'TSM-NEG19RC.20-590 Bifacial Dual Glass Monocrystalline Module - Up to 30% bifacial gain',
    category: 'commercial',
    manufacturer: 'Trina Solar',
    model: 'TSM-NEG19RC.20-590',
    voltage: 39.7, // Vmp from datasheet
    current: 14.86, // Imp from datasheet
    power: 590,
    voc: 47.8, // Voc from datasheet
    isc: 15.72, // Isc from datasheet
    maxSeriesFuse: 35,
    maxSystemVoltage: 1500,
    temperatureCoefficient: -0.30,
    efficiency: 21.8,
    
    length: 2384,
    width: 1134,
    thickness: 30,
    weight: 33.7,
    powerTolerancePositive: 5,
    powerToleranceNegative: 0,
    bifacial: true,
    bifacialFactor: 30,
    cellType: 'Monocrystalline',
    glassType: 'Dual Glass',
    frameColor: 'Silver',
    mechanicalLoadPositive: 5400,
    mechanicalLoadNegative: 2400,
    warrantyYears: 25,    degradationFirstYear: 2.0,
    degradationAnnual: 0.40,
    countryAvailability: ['pakistan', 'india', 'usa', 'germany', 'australia']
  },
  {
    id: 'trina-vertex-595w-bifacial',
    name: '595W Trina Vertex Bifacial',
    description: 'TSM-NEG19RC.20-595 Bifacial Dual Glass Monocrystalline Module - Up to 30% bifacial gain',
    category: 'commercial',
    manufacturer: 'Trina Solar',
    model: 'TSM-NEG19RC.20-595',
    voltage: 40.0, // Vmp from datasheet
    current: 14.89, // Imp from datasheet
    power: 595,
    voc: 48.1, // Voc from datasheet
    isc: 15.76, // Isc from datasheet
    maxSeriesFuse: 35,
    maxSystemVoltage: 1500,
    temperatureCoefficient: -0.30,
    efficiency: 22.0,
    
    length: 2384,
    width: 1134,
    thickness: 30,
    weight: 33.7,
    powerTolerancePositive: 5,
    powerToleranceNegative: 0,
    bifacial: true,
    bifacialFactor: 30,
    cellType: 'Monocrystalline',
    glassType: 'Dual Glass',
    frameColor: 'Silver',
    mechanicalLoadPositive: 5400,
    mechanicalLoadNegative: 2400,
    warrantyYears: 25,
    degradationFirstYear: 2.0,    degradationAnnual: 0.40,
    countryAvailability: ['pakistan', 'india', 'usa', 'germany', 'australia']
  },
  {
    id: 'trina-vertex-600w-bifacial',
    name: '600W Trina Vertex Bifacial',
    description: 'TSM-NEG19RC.20-600 Bifacial Dual Glass Monocrystalline Module - Up to 30% bifacial gain',
    category: 'commercial',
    manufacturer: 'Trina Solar',
    model: 'TSM-NEG19RC.20-600',
    voltage: 40.3, // Vmp from datasheet
    current: 14.91, // Imp from datasheet
    power: 600,
    voc: 48.4, // Voc from datasheet
    isc: 15.80, // Isc from datasheet
    maxSeriesFuse: 35,
    maxSystemVoltage: 1500,
    temperatureCoefficient: -0.30,
    efficiency: 22.2,
    
    length: 2384,
    width: 1134,
    thickness: 30,
    weight: 33.7,
    powerTolerancePositive: 5,
    powerToleranceNegative: 0,
    bifacial: true,
    bifacialFactor: 30,
    cellType: 'Monocrystalline',
    glassType: 'Dual Glass',
    frameColor: 'Silver',    mechanicalLoadPositive: 5400,
    mechanicalLoadNegative: 2400,
    warrantyYears: 25,
    degradationFirstYear: 2.0,
    degradationAnnual: 0.40,
    countryAvailability: ['pakistan', 'india', 'usa', 'germany', 'australia']
  },
  {
    id: 'trina-vertex-605w-bifacial',
    name: '605W Trina Vertex Bifacial',
    description: 'TSM-NEG19RC.20-605 Bifacial Dual Glass Monocrystalline Module - Up to 30% bifacial gain',
    category: 'commercial',
    manufacturer: 'Trina Solar',
    model: 'TSM-NEG19RC.20-605',
    voltage: 40.5, // Vmp from datasheet
    current: 14.94, // Imp from datasheet
    power: 605,
    voc: 48.7, // Voc from datasheet
    isc: 15.83, // Isc from datasheet
    maxSeriesFuse: 35,
    maxSystemVoltage: 1500,
    temperatureCoefficient: -0.30,
    efficiency: 22.4,
    
    length: 2384,
    width: 1134,
    thickness: 30,
    weight: 33.7,
    powerTolerancePositive: 5,
    powerToleranceNegative: 0,
    bifacial: true,
    bifacialFactor: 30,
    cellType: 'Monocrystalline',
    glassType: 'Dual Glass',
    frameColor: 'Silver',
    mechanicalLoadPositive: 5400,    mechanicalLoadNegative: 2400,
    warrantyYears: 25,
    degradationFirstYear: 2.0,
    degradationAnnual: 0.40,
    countryAvailability: ['pakistan', 'india', 'usa', 'germany', 'australia']
  },
  
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
  },

  // Trina Solar NOCT Series - Based on common market specifications
  {
    id: 'trina-noct-442w',
    name: '442W Trina NOCT Standard',
    description: 'TSM-NEG9R.28-442 Standard Monocrystalline Module - Cost-effective option',
    category: 'residential',
    manufacturer: 'Trina Solar',
    model: 'TSM-NEG9R.28-442',
    voltage: 36.8, // Vmp typical for NOCT series
    current: 12.00, // Imp calculated from power/voltage
    power: 442,
    voc: 44.7, // Voc typical for NOCT series
    isc: 12.61, // Isc typical for NOCT series
    maxSeriesFuse: 25,
    maxSystemVoltage: 1500,
    temperatureCoefficient: -0.35,
    efficiency: 21.5,
    
    length: 2278,
    width: 1134,
    thickness: 35,
    weight: 24.5,
    powerTolerancePositive: 5,
    powerToleranceNegative: 0,
    bifacial: false,
    cellType: 'Monocrystalline',
    glassType: 'Single Glass',
    frameColor: 'Silver',
    mechanicalLoadPositive: 5400,
    mechanicalLoadNegative: 2400,
    warrantyYears: 25,
    degradationFirstYear: 2.0,
    degradationAnnual: 0.50,
    countryAvailability: ['pakistan', 'india', 'usa', 'germany', 'uk']
  },
  {
    id: 'trina-noct-446w',
    name: '446W Trina NOCT Standard',
    description: 'TSM-NEG9R.28-446 Standard Monocrystalline Module - Cost-effective option',
    category: 'residential',
    manufacturer: 'Trina Solar',
    model: 'TSM-NEG9R.28-446',
    voltage: 37.1, // Vmp from typical NOCT datasheet
    current: 12.02, // Imp calculated
    power: 446,
    voc: 45.0, // Voc from typical NOCT datasheet
    isc: 12.64, // Isc from typical NOCT datasheet
    maxSeriesFuse: 25,
    maxSystemVoltage: 1500,
    temperatureCoefficient: -0.35,
    efficiency: 21.6,
    
    length: 2278,
    width: 1134,
    thickness: 35,
    weight: 24.5,
    powerTolerancePositive: 5,
    powerToleranceNegative: 0,
    bifacial: false,
    cellType: 'Monocrystalline',
    glassType: 'Single Glass',
    frameColor: 'Silver',
    mechanicalLoadPositive: 5400,
    mechanicalLoadNegative: 2400,
    warrantyYears: 25,
    degradationFirstYear: 2.0,
    degradationAnnual: 0.50,
    countryAvailability: ['pakistan', 'india', 'usa', 'germany', 'uk']
  },
  {
    id: 'trina-noct-450w',
    name: '450W Trina NOCT Standard',
    description: 'TSM-NEG9R.28-450 Standard Monocrystalline Module - Cost-effective option',
    category: 'residential',
    manufacturer: 'Trina Solar',
    model: 'TSM-NEG9R.28-450',
    voltage: 37.3, // Vmp from typical NOCT datasheet
    current: 12.05, // Imp calculated
    power: 450,
    voc: 45.3, // Voc from typical NOCT datasheet
    isc: 12.67, // Isc from typical NOCT datasheet
    maxSeriesFuse: 25,
    maxSystemVoltage: 1500,
    temperatureCoefficient: -0.35,
    efficiency: 21.8,
    
    length: 2278,
    width: 1134,
    thickness: 35,
    weight: 24.5,
    powerTolerancePositive: 5,
    powerToleranceNegative: 0,
    bifacial: false,
    cellType: 'Monocrystalline',
    glassType: 'Single Glass',
    frameColor: 'Silver',
    mechanicalLoadPositive: 5400,
    mechanicalLoadNegative: 2400,
    warrantyYears: 25,
    degradationFirstYear: 2.0,
    degradationAnnual: 0.50,
    countryAvailability: ['pakistan', 'india', 'usa', 'germany', 'uk']
  },
  {
    id: 'trina-noct-454w',
    name: '454W Trina NOCT Standard',
    description: 'TSM-NEG9R.28-454 Standard Monocrystalline Module - Cost-effective option',
    category: 'residential',
    manufacturer: 'Trina Solar',
    model: 'TSM-NEG9R.28-454',
    voltage: 37.6, // Vmp from typical NOCT datasheet
    current: 12.08, // Imp calculated
    power: 454,
    voc: 45.6, // Voc from typical NOCT datasheet
    isc: 12.70, // Isc from typical NOCT datasheet
    maxSeriesFuse: 25,
    maxSystemVoltage: 1500,
    temperatureCoefficient: -0.35,
    efficiency: 22.0,
    
    length: 2278,
    width: 1134,
    thickness: 35,
    weight: 24.5,
    powerTolerancePositive: 5,
    powerToleranceNegative: 0,
    bifacial: false,
    cellType: 'Monocrystalline',
    glassType: 'Single Glass',
    frameColor: 'Silver',
    mechanicalLoadPositive: 5400,
    mechanicalLoadNegative: 2400,
    warrantyYears: 25,
    degradationFirstYear: 2.0,
    degradationAnnual: 0.50,
    countryAvailability: ['pakistan', 'india', 'usa', 'germany', 'uk']
  },
  {
    id: 'trina-noct-458w',
    name: '458W Trina NOCT Standard',
    description: 'TSM-NEG9R.28-458 Standard Monocrystalline Module - Cost-effective option',
    category: 'residential',
    manufacturer: 'Trina Solar',
    model: 'TSM-NEG9R.28-458',
    voltage: 37.8, // Vmp from typical NOCT datasheet
    current: 12.12, // Imp calculated
    power: 458,
    voc: 45.9, // Voc from typical NOCT datasheet
    isc: 12.73, // Isc from typical NOCT datasheet
    maxSeriesFuse: 25,
    maxSystemVoltage: 1500,
    temperatureCoefficient: -0.35,
    efficiency: 22.1,
    
    length: 2278,
    width: 1134,
    thickness: 35,
    weight: 24.5,
    powerTolerancePositive: 5,
    powerToleranceNegative: 0,
    bifacial: false,
    cellType: 'Monocrystalline',
    glassType: 'Single Glass',
    frameColor: 'Silver',
    mechanicalLoadPositive: 5400,
    mechanicalLoadNegative: 2400,
    warrantyYears: 25,
    degradationFirstYear: 2.0,
    degradationAnnual: 0.50,
    countryAvailability: ['pakistan', 'india', 'usa', 'germany', 'uk']
  },
  {
    id: 'trina-noct-461w',
    name: '461W Trina NOCT Standard',
    description: 'TSM-NEG9R.28-461 Standard Monocrystalline Module - Cost-effective option',
    category: 'residential',
    manufacturer: 'Trina Solar',
    model: 'TSM-NEG9R.28-461',
    voltage: 38.0, // Vmp from typical NOCT datasheet
    current: 12.14, // Imp calculated
    power: 461,
    voc: 46.1, // Voc from typical NOCT datasheet
    isc: 12.76, // Isc from typical NOCT datasheet
    maxSeriesFuse: 25,
    maxSystemVoltage: 1500,
    temperatureCoefficient: -0.35,
    efficiency: 22.3,
    
    length: 2278,
    width: 1134,
    thickness: 35,
    weight: 24.5,
    powerTolerancePositive: 5,
    powerToleranceNegative: 0,
    bifacial: false,
    cellType: 'Monocrystalline',
    glassType: 'Single Glass',
    frameColor: 'Silver',
    mechanicalLoadPositive: 5400,
    mechanicalLoadNegative: 2400,
    warrantyYears: 25,
    degradationFirstYear: 2.0,
    degradationAnnual: 0.50,
    countryAvailability: ['pakistan', 'india', 'usa', 'germany', 'uk']
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
