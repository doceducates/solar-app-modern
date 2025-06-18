import {
  PanelSpecifications,
  SystemConfiguration,
  CalculationResults,
  ConfigurationResults,
  SafetyCheck,
  SafetyChecks,
  EnvironmentalImpact,
  PanelPreset,
  InverterPreset
} from '@/types';
import {
  ENVIRONMENTAL_CONSTANTS
} from '@/constants/panels';

// Enhanced system calculation types
export interface SystemCalculationResults {
  totalSystemVoltage: number;
  totalSystemCurrent: number;
  totalSystemPower: number;
  totalSystemVoc: number;
  totalSystemIsc: number;
  stringsPerInverter: number;
  panelsPerString: number;
  stringVoltage: number;
  stringCurrent: number;
  stringPower: number;
  stringVoc: number;
  stringIsc: number;
  perInverterBreakdown: InverterBreakdown[];
  perStringBreakdown: StringBreakdown[];
  safetyMargins: SafetyMargins;
  utilizationFactors: UtilizationFactors;
  derating: DeratingFactors;
  realWorldPerformance: RealWorldPerformance;
  mixedPanelWarnings: string[];
}

export interface StringBreakdown {
  stringId: number;
  inverterId: number;
  panelType: PanelPreset;
  panelCount: number;
  voltage: number;
  current: number;
  power: number;
  voc: number;
  isc: number;
  powerLossFromMismatch: number; // Power lost due to voltage mismatch
  efficiencyImpact: number; // % efficiency impact
}

export interface StringConfiguration {
  stringId: number;
  inverterId: number;
  panelPreset: PanelPreset;
  panelCount: number;
}

export interface MixedSystemConfiguration {
  strings: StringConfiguration[];
  numInverters: number;
  systemEfficiency: number;
}

export interface InverterBreakdown {
  inverterId: number;
  voltage: number;
  current: number;
  power: number;
  voc: number;
  isc: number;
  stringCount: number;
  utilizationPercent: number;
}

export interface SafetyMargins {
  voltageMargin: number;
  currentMargin: number;
  powerMargin: number;
  vocMargin: number;
  temperatureMargin: number;
}

export interface UtilizationFactors {
  voltage: number;
  current: number;
  power: number;
  mpptEfficiency: number;
}

export interface DeratingFactors {
  temperature: number;
  shading: number;
  soiling: number;
  mismatch: number;
  connections: number;
  inverterEfficiency: number;
  totalDerating: number;
}

export interface RealWorldPerformance {
  nominalPower: number;
  deratedPower: number;
  annualEnergyProduction: number; // kWh
  dailyEnergyProduction: number; // kWh
  capacityFactor: number; // %
}

/**
 * Calculate series configuration results
 */
export function calculateSeries(
  panelSpecs: PanelSpecifications,
  config: SystemConfiguration
): CalculationResults {
  const efficiencyFactor = config.efficiency / 100;
  const effectiveVoltage = panelSpecs.voltage * efficiencyFactor;
  const effectiveCurrent = panelSpecs.current * efficiencyFactor;

  return {
    voltage: effectiveVoltage * config.panels,
    current: effectiveCurrent,
    power: effectiveVoltage * effectiveCurrent * config.panels
  };
}

/**
 * Calculate parallel configuration results
 */
export function calculateParallel(
  panelSpecs: PanelSpecifications,
  config: SystemConfiguration
): CalculationResults {
  const efficiencyFactor = config.efficiency / 100;
  const effectiveVoltage = panelSpecs.voltage * efficiencyFactor;
  const effectiveCurrent = panelSpecs.current * efficiencyFactor;

  return {
    voltage: effectiveVoltage,
    current: effectiveCurrent * config.panels,
    power: effectiveVoltage * effectiveCurrent * config.panels
  };
}

/**
 * Calculate combined (series-parallel) configuration results
 */
export function calculateCombined(
  panelSpecs: PanelSpecifications,
  config: SystemConfiguration
): CalculationResults {
  const seriesGroups = config.seriesGroups || 1;
  const panelsPerGroup = config.panelsPerGroup || 1;
  const efficiencyFactor = config.efficiency / 100;
  
  const effectiveVoltage = panelSpecs.voltage * efficiencyFactor;
  const effectiveCurrent = panelSpecs.current * efficiencyFactor;
  
  // Series voltage within each group, parallel current across groups
  const groupVoltage = effectiveVoltage * panelsPerGroup;
  const totalCurrent = effectiveCurrent * seriesGroups;

  return {
    voltage: groupVoltage,
    current: totalCurrent,
    power: groupVoltage * totalCurrent
  };
}

/**
 * Calculate all configuration results
 */
export function calculateAllConfigurations(
  panelSpecs: PanelSpecifications,
  config: SystemConfiguration
): ConfigurationResults {
  return {
    series: calculateSeries(panelSpecs, config),
    parallel: calculateParallel(panelSpecs, config),
    combined: calculateCombined(panelSpecs, config)
  };
}

/**
 * Perform safety checks for series configuration
 */
export function checkSeriesSafety(
  panelSpecs: PanelSpecifications,
  config: SystemConfiguration
): SafetyCheck[] {
  const checks: SafetyCheck[] = [];
  
  // Check system voltage limit
  const totalVoc = panelSpecs.voc * config.panels;
  if (totalVoc > panelSpecs.maxSystemVoltage) {
    checks.push({
      type: 'error',
      message: `Total open circuit voltage (${totalVoc.toFixed(1)}V) exceeds maximum system voltage (${panelSpecs.maxSystemVoltage}V)`,
      field: 'panels',
      recommendation: `Reduce number of panels to ${Math.floor(panelSpecs.maxSystemVoltage / panelSpecs.voc)} or less`
    });
  } else if (totalVoc > panelSpecs.maxSystemVoltage * 0.9) {
    checks.push({
      type: 'warning',
      message: `Total open circuit voltage (${totalVoc.toFixed(1)}V) is approaching maximum system voltage limit`,
      field: 'panels',
      recommendation: 'Consider reducing the number of panels for safety margin'
    });
  }
  
  // Check current rating
  if (panelSpecs.isc > panelSpecs.maxSeriesFuse) {
    checks.push({
      type: 'error',
      message: `Short circuit current (${panelSpecs.isc.toFixed(1)}A) exceeds maximum series fuse rating (${panelSpecs.maxSeriesFuse}A)`,
      field: 'isc',
      recommendation: 'Use panels with higher fuse rating or different configuration'
    });
  }

  return checks;
}

/**
 * Perform safety checks for parallel configuration
 */
export function checkParallelSafety(
  panelSpecs: PanelSpecifications,
  config: SystemConfiguration
): SafetyCheck[] {
  const checks: SafetyCheck[] = [];
  
  // Check total current
  const totalIsc = panelSpecs.isc * config.panels;
  if (totalIsc > panelSpecs.maxSeriesFuse * 3) {
    checks.push({
      type: 'warning',
      message: `Total short circuit current (${totalIsc.toFixed(1)}A) is very high`,
      field: 'panels',
      recommendation: 'Ensure proper overcurrent protection and wire sizing'
    });
  }

  return checks;
}

/**
 * Perform safety checks for combined configuration
 */
export function checkCombinedSafety(
  panelSpecs: PanelSpecifications,
  config: SystemConfiguration
): SafetyCheck[] {
  const checks: SafetyCheck[] = [];
  const seriesGroups = config.seriesGroups || 1;
  const panelsPerGroup = config.panelsPerGroup || 1;
  
  // Check system voltage limit per series group
  const groupVoc = panelSpecs.voc * panelsPerGroup;
  if (groupVoc > panelSpecs.maxSystemVoltage) {
    checks.push({
      type: 'error',
      message: `Series group voltage (${groupVoc.toFixed(1)}V) exceeds maximum system voltage (${panelSpecs.maxSystemVoltage}V)`,
      field: 'panelsPerGroup',
      recommendation: `Reduce panels per group to ${Math.floor(panelSpecs.maxSystemVoltage / panelSpecs.voc)} or less`
    });
  } else if (groupVoc > panelSpecs.maxSystemVoltage * 0.9) {
    checks.push({
      type: 'warning',
      message: `Series group voltage (${groupVoc.toFixed(1)}V) is approaching maximum system voltage limit`,
      field: 'panelsPerGroup',
      recommendation: 'Consider reducing panels per series group'
    });
  }
  
  // Check total current
  const totalIsc = panelSpecs.isc * seriesGroups;
  if (totalIsc > panelSpecs.maxSeriesFuse * 3) {
    checks.push({
      type: 'warning',
      message: `Total current (${totalIsc.toFixed(1)}A) is high`,
      field: 'seriesGroups',
      recommendation: 'Ensure proper overcurrent protection'
    });
  }

  return checks;
}

/**
 * Perform all safety checks
 */
export function performAllSafetyChecks(
  panelSpecs: PanelSpecifications,
  config: SystemConfiguration
): SafetyChecks {
  const convertChecksToFormat = (checks: SafetyCheck[]) => {
    return {
      errors: checks.filter(c => c.type === 'error').map(c => c.message),
      warnings: checks.filter(c => c.type === 'warning').map(c => c.message),
      info: checks.filter(c => c.type === 'info').map(c => c.message)
    };
  };

  return {
    series: convertChecksToFormat(checkSeriesSafety(panelSpecs, config)),
    parallel: convertChecksToFormat(checkParallelSafety(panelSpecs, config)),
    combined: convertChecksToFormat(checkCombinedSafety(panelSpecs, config))  };
}

/**
 * Calculate environmental impact
 */
export function calculateEnvironmentalImpact(
  results: ConfigurationResults
): EnvironmentalImpact {
  const systemPower = Math.max(results.series.power, results.parallel.power, results.combined.power);
  
  // Annual energy production (assuming 4.5 peak sun hours average)
  const annualEnergy = systemPower * 4.5 * 365 / 1000; // kWh per year
  const co2Saved = annualEnergy * ENVIRONMENTAL_CONSTANTS.CO2_PER_KWH;
  const treesEquivalent = (co2Saved / 1000) * ENVIRONMENTAL_CONSTANTS.TREES_PER_TON_CO2;
  const homesEquivalent = annualEnergy / ENVIRONMENTAL_CONSTANTS.HOME_USAGE_KWH_YEAR;

  return {
    co2Saved,
    treesEquivalent,
    homesEquivalent
  };
}

/**
 * Validate panel specifications
 */
export function validatePanelSpecs(specs: Partial<PanelSpecifications>): string[] {
  const errors: string[] = [];
  
  if (!specs.voltage || specs.voltage <= 0) {
    errors.push('Voltage must be greater than 0');
  }
  
  if (!specs.current || specs.current <= 0) {
    errors.push('Current must be greater than 0');
  }
  
  if (specs.voc && specs.voc <= specs.voltage!) {
    errors.push('Open circuit voltage (Voc) must be greater than operating voltage (Vmp)');
  }
  
  if (specs.isc && specs.isc <= specs.current!) {
    errors.push('Short circuit current (Isc) must be greater than operating current (Imp)');
  }

  return errors;
}

/**
 * Calculate optimal configuration
 */
export function findOptimalConfiguration(
  panelSpecs: PanelSpecifications,
  config: SystemConfiguration,
  targetVoltage?: number
): {
  type: 'series' | 'parallel' | 'combined';
  reason: string;
  recommendation: Partial<SystemConfiguration>;
} {
  const results = calculateAllConfigurations(panelSpecs, config);
  
  // If target voltage is specified, prefer configuration that gets closest
  if (targetVoltage) {
    const seriesDiff = Math.abs(results.series.voltage - targetVoltage);
    const parallelDiff = Math.abs(results.parallel.voltage - targetVoltage);
    const combinedDiff = Math.abs(results.combined.voltage - targetVoltage);
    
    if (seriesDiff < parallelDiff && seriesDiff < combinedDiff) {
      return {
        type: 'series',
        reason: `Series configuration voltage (${results.series.voltage.toFixed(1)}V) is closest to target (${targetVoltage}V)`,
        recommendation: { panels: config.panels }
      };
    }
    
    if (parallelDiff < combinedDiff) {
      return {
        type: 'parallel',
        reason: `Parallel configuration voltage (${results.parallel.voltage.toFixed(1)}V) is closest to target (${targetVoltage}V)`,
        recommendation: { panels: config.panels }
      };
    }
  }
  
  // Default: recommend configuration with highest power
  const maxPower = Math.max(results.series.power, results.parallel.power, results.combined.power);
  
  if (results.series.power === maxPower) {
    return {
      type: 'series',
      reason: 'Series configuration provides the highest power output',
      recommendation: { panels: config.panels }
    };
  }
  
  if (results.parallel.power === maxPower) {
    return {
      type: 'parallel',
      reason: 'Parallel configuration provides the highest power output',
      recommendation: { panels: config.panels }
    };
  }
  
  return {
    type: 'combined',
    reason: 'Combined configuration provides the highest power output',
    recommendation: {
      panels: config.panels,
      seriesGroups: config.seriesGroups,
      panelsPerGroup: config.panelsPerGroup
    }
  };
}

/**
 * Calculate series configuration for a specific number of panels
 */
export function calculateSeriesConfiguration(
  panelSpecs: PanelSpecifications,
  numPanels: number,
  systemEfficiency: number = 85
): CalculationResults {
  const efficiencyFactor = systemEfficiency / 100;
  
  return {
    voltage: panelSpecs.voltage * numPanels,
    current: panelSpecs.current,
    power: panelSpecs.power * numPanels * efficiencyFactor
  };
}

/**
 * Calculate parallel configuration for a specific number of panels
 */
export function calculateParallelConfiguration(
  panelSpecs: PanelSpecifications,
  numPanels: number,
  systemEfficiency: number = 85
): CalculationResults {
  const efficiencyFactor = systemEfficiency / 100;
  
  return {
    voltage: panelSpecs.voltage,
    current: panelSpecs.current * numPanels,
    power: panelSpecs.power * numPanels * efficiencyFactor
  };
}

/**
 * Calculate combined series-parallel configuration
 */
export function calculateCombinedConfiguration(
  panelSpecs: PanelSpecifications,
  seriesCount: number,
  parallelCount: number,
  systemEfficiency: number = 85
): CalculationResults {
  const efficiencyFactor = systemEfficiency / 100;
  const totalPanels = seriesCount * parallelCount;
  
  return {
    voltage: panelSpecs.voltage * seriesCount,
    current: panelSpecs.current * parallelCount,
    power: panelSpecs.power * totalPanels * efficiencyFactor
  };
}

/**
 * Calculate comprehensive system parameters with enhanced accuracy
 */
export function calculateSystemParameters(
  panel: PanelPreset,
  inverter: InverterPreset,
  seriesConfig: number,
  parallelConfig: number,
  numInverters: number,
  systemEfficiency: number = 85,
  environmentalConditions: {
    temperature: number; // °C
    irradiance: number; // W/m²
    shadingFactor: number; // 0-1
  } = { temperature: 25, irradiance: 1000, shadingFactor: 1 }
): SystemCalculationResults {
  
  // Calculate derating factors
  const deratingFactors = calculateDeratingFactors(
    environmentalConditions.temperature,
    environmentalConditions.shadingFactor,
    systemEfficiency
  );

  // String calculations (series)
  const panelsPerString = seriesConfig;
  const stringVoltage = panel.voltage * panelsPerString;
  const stringCurrent = panel.current;
  const stringPower = panel.power * panelsPerString;
  const stringVoc = panel.voc * panelsPerString;
  const stringIsc = panel.isc;

  // Total strings in system
  const totalStrings = parallelConfig * numInverters;
  const stringsPerInverter = parallelConfig;

  // System totals (all inverters combined)
  const totalSystemVoltage = stringVoltage; // Same as string voltage
  const totalSystemCurrent = stringCurrent * totalStrings;
  const totalSystemPower = stringPower * totalStrings;
  const totalSystemVoc = stringVoc; // Same as string VOC
  const totalSystemIsc = stringIsc * totalStrings;

  // Apply derating to power calculations
  const deratedStringPower = stringPower * deratingFactors.totalDerating;
  const deratedSystemPower = totalSystemPower * deratingFactors.totalDerating;

  // Per-inverter breakdown
  const perInverterBreakdown: InverterBreakdown[] = [];
  for (let i = 1; i <= numInverters; i++) {
    const inverterPower = deratedStringPower * stringsPerInverter;
    const utilizationPercent = (inverterPower / inverter.ratedPower) * 100;
    
    perInverterBreakdown.push({
      inverterId: i,
      voltage: stringVoltage,
      current: stringCurrent * stringsPerInverter,
      power: inverterPower,
      voc: stringVoc,
      isc: stringIsc * stringsPerInverter,
      stringCount: stringsPerInverter,
      utilizationPercent
    });
  }

  // Safety margins
  const safetyMargins: SafetyMargins = {
    voltageMargin: ((inverter.maxSolarVoltage - stringVoc) / inverter.maxSolarVoltage) * 100,
    currentMargin: ((inverter.maxSolarCurrent - (stringCurrent * stringsPerInverter)) / inverter.maxSolarCurrent) * 100,
    powerMargin: ((inverter.maxPvPower - (deratedStringPower * stringsPerInverter)) / inverter.maxPvPower) * 100,
    vocMargin: ((inverter.maxSolarVoltage - stringVoc) / inverter.maxSolarVoltage) * 100,
    temperatureMargin: 15 // Assumed safety margin for temperature variations
  };

  // Utilization factors
  const utilizationFactors: UtilizationFactors = {
    voltage: (stringVoltage / inverter.mpptVoltageRange.max) * 100,
    current: ((stringCurrent * stringsPerInverter) / inverter.maxSolarCurrent) * 100,
    power: ((deratedStringPower * stringsPerInverter) / inverter.maxPvPower) * 100,
    mpptEfficiency: calculateMpptEfficiency(stringVoltage, inverter)
  };  // Real-world performance calculations (TODO: Implement later)
  const realWorldPerformance: RealWorldPerformance = {
    nominalPower: totalSystemPower,
    deratedPower: deratedSystemPower,
    annualEnergyProduction: 0, // TODO: Calculate based on location and weather data
    dailyEnergyProduction: 0, // TODO: Calculate based on peak sun hours
    capacityFactor: 20 // TODO: Calculate based on environmental conditions
  };
  return {
    totalSystemVoltage,
    totalSystemCurrent,
    totalSystemPower: deratedSystemPower,
    totalSystemVoc,
    totalSystemIsc,
    stringsPerInverter,
    panelsPerString,
    stringVoltage,
    stringCurrent,
    stringPower: deratedStringPower,
    stringVoc,
    stringIsc,
    perInverterBreakdown,
    perStringBreakdown: [], // Empty for uniform panel systems
    safetyMargins,
    utilizationFactors,
    derating: deratingFactors,
    realWorldPerformance,
    mixedPanelWarnings: [] // No warnings for uniform systems
  };
}

/**
 * Calculate derating factors for realistic power output
 */
export function calculateDeratingFactors(
  temperature: number = 25,
  shadingFactor: number = 1,
  systemEfficiency: number = 85
): DeratingFactors {
  // Temperature derating (assuming -0.4%/°C for crystalline silicon)
  const temperatureCoeff = -0.004; // per °C
  const temperatureDelta = temperature - 25; // STC is 25°C
  const temperatureDerating = 1 + (temperatureCoeff * temperatureDelta);

  // Other derating factors (industry standard values)
  const deratingFactors: DeratingFactors = {
    temperature: Math.max(0.7, Math.min(1.05, temperatureDerating)), // 70% to 105%
    shading: shadingFactor, // User-defined or calculated
    soiling: 0.95, // 5% loss from dust/dirt
    mismatch: 0.98, // 2% loss from panel mismatch
    connections: 0.995, // 0.5% loss from connections
    inverterEfficiency: systemEfficiency / 100,
    totalDerating: 0 // Will be calculated
  };

  // Calculate total derating
  deratingFactors.totalDerating = 
    deratingFactors.temperature *
    deratingFactors.shading *
    deratingFactors.soiling *
    deratingFactors.mismatch *
    deratingFactors.connections *
    deratingFactors.inverterEfficiency;

  return deratingFactors;
}

/**
 * Calculate MPPT efficiency based on voltage operating point
 */
export function calculateMpptEfficiency(
  operatingVoltage: number,
  inverter: InverterPreset
): number {
  const { min, max } = inverter.mpptVoltageRange;
  const optimalVoltage = (min + max) / 2;
  
  // Calculate efficiency based on distance from optimal point
  const normalizedDistance = Math.abs(operatingVoltage - optimalVoltage) / (max - min);
  
  // Efficiency drops as we move away from optimal point
  const efficiency = Math.max(0.94, 0.98 - (normalizedDistance * 0.04));
  
  return efficiency * 100; // Return as percentage
}

/**
 * Calculate real-world performance metrics (TODO: Implement later)
 */
export function calculateRealWorldPerformance(
  deratedPower: number,
  nominalPower: number
): RealWorldPerformance {
  // TODO: Implement comprehensive real-world performance calculations
  // - Location-specific irradiance data
  // - Weather patterns and seasonal variations
  // - Shading analysis
  // - System degradation over time
  
  return {
    nominalPower,
    deratedPower,
    annualEnergyProduction: 0, // Placeholder
    dailyEnergyProduction: 0,  // Placeholder
    capacityFactor: 20         // Placeholder
  };
}

/**
 * Enhanced compatibility validation with detailed analysis
 */
export function validateSystemCompatibility(
  panel: PanelPreset,
  inverter: InverterPreset,
  systemCalc: SystemCalculationResults
): {
  isCompatible: boolean;
  issues: string[];
  warnings: string[];
  recommendations: string[];
  compatibilityScore: number; // 0-100
} {
  const issues: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];
  
  // Critical compatibility checks
  let compatibilityScore = 100;

  // VOC safety check (most critical)
  if (systemCalc.stringVoc > inverter.maxSolarVoltage) {
    issues.push(`String VOC (${systemCalc.stringVoc.toFixed(1)}V) exceeds inverter maximum (${inverter.maxSolarVoltage}V) - SAFETY RISK`);
    compatibilityScore -= 50;
  } else if (systemCalc.safetyMargins.vocMargin < 10) {
    warnings.push(`Low VOC safety margin (${systemCalc.safetyMargins.vocMargin.toFixed(1)}%)`);
    compatibilityScore -= 10;
  }

  // MPPT range check
  if (systemCalc.stringVoltage < inverter.mpptVoltageRange.min || 
      systemCalc.stringVoltage > inverter.mpptVoltageRange.max) {
    issues.push(`String voltage (${systemCalc.stringVoltage.toFixed(1)}V) outside MPPT range (${inverter.mpptVoltageRange.min}-${inverter.mpptVoltageRange.max}V)`);
    compatibilityScore -= 30;
  }

  // Current compatibility
  const maxStringCurrent = systemCalc.stringCurrent * systemCalc.stringsPerInverter;
  if (maxStringCurrent > inverter.maxSolarCurrent) {
    issues.push(`Total current per inverter (${maxStringCurrent.toFixed(1)}A) exceeds maximum (${inverter.maxSolarCurrent}A)`);
    compatibilityScore -= 25;
  }

  // Power compatibility
  const powerPerInverter = systemCalc.stringPower * systemCalc.stringsPerInverter;
  if (powerPerInverter > inverter.maxPvPower * 1.4) { // Allow up to 40% oversizing
    issues.push(`Power per inverter (${(powerPerInverter/1000).toFixed(1)}kW) exceeds safe oversizing limit`);
    compatibilityScore -= 20;
  } else if (powerPerInverter > inverter.maxPvPower * 1.2) {
    warnings.push(`High power oversizing (${((powerPerInverter/inverter.maxPvPower)*100).toFixed(1)}%) may cause clipping`);
    compatibilityScore -= 5;
  }

  // Utilization warnings and recommendations
  if (systemCalc.utilizationFactors.voltage < 50) {
    recommendations.push(`Low voltage utilization (${systemCalc.utilizationFactors.voltage.toFixed(1)}%) - consider more panels per string`);
    compatibilityScore -= 5;
  }

  if (systemCalc.utilizationFactors.power < 70) {
    recommendations.push(`Low power utilization (${systemCalc.utilizationFactors.power.toFixed(1)}%) - consider larger array`);
    compatibilityScore -= 5;
  }

  // Temperature considerations
  if (systemCalc.safetyMargins.temperatureMargin < 10) {
    warnings.push('Consider additional temperature safety margin for extreme weather conditions');
    compatibilityScore -= 5;
  }

  const isCompatible = issues.length === 0;
  
  return {
    isCompatible,
    issues,
    warnings,
    recommendations,
    compatibilityScore: Math.max(0, compatibilityScore)
  };
}

/**
 * Calculate mixed panel system parameters with voltage mismatch analysis
 */
export function calculateMixedPanelSystem(
  inverter: InverterPreset,
  systemConfig: MixedSystemConfiguration,
  environmentalConditions: {
    temperature: number;
    irradiance: number;
    shadingFactor: number;
  } = { temperature: 25, irradiance: 1000, shadingFactor: 1 }
): SystemCalculationResults {
  
  // Calculate derating factors
  const deratingFactors = calculateDeratingFactors(
    environmentalConditions.temperature,
    environmentalConditions.shadingFactor,
    systemConfig.systemEfficiency
  );

  // Calculate per-string breakdown
  const perStringBreakdown: StringBreakdown[] = [];
  const mixedPanelWarnings: string[] = [];
  
  // Group strings by inverter
  const stringsByInverter = new Map<number, StringConfiguration[]>();
  
  systemConfig.strings.forEach(string => {
    if (!stringsByInverter.has(string.inverterId)) {
      stringsByInverter.set(string.inverterId, []);
    }
    stringsByInverter.get(string.inverterId)!.push(string);
  });

  // Calculate each string's characteristics
  systemConfig.strings.forEach(string => {
    const panel = string.panelPreset;
    const stringVoltage = panel.voltage * string.panelCount;
    const stringCurrent = panel.current;
    const stringPower = panel.power * string.panelCount;
    const stringVoc = panel.voc * string.panelCount;
    const stringIsc = panel.isc;

    perStringBreakdown.push({
      stringId: string.stringId,
      inverterId: string.inverterId,
      panelType: panel,
      panelCount: string.panelCount,
      voltage: stringVoltage,
      current: stringCurrent,
      power: stringPower,
      voc: stringVoc,
      isc: stringIsc,
      powerLossFromMismatch: 0, // Will be calculated later
      efficiencyImpact: 0 // Will be calculated later
    });
  });

  // Calculate voltage mismatch effects per inverter
  stringsByInverter.forEach((strings, inverterId) => {
    if (strings.length > 1) {
      // Find minimum voltage string (MPPT operating point)
      const voltages = strings.map(s => {
        const stringData = perStringBreakdown.find(sb => sb.stringId === s.stringId);
        return stringData ? stringData.voltage : 0;
      });
      
      const minVoltage = Math.min(...voltages);
      const maxVoltage = Math.max(...voltages);
      
      if (maxVoltage - minVoltage > 10) { // More than 10V difference
        mixedPanelWarnings.push(
          `Inverter ${inverterId}: Voltage mismatch detected (${minVoltage.toFixed(1)}V - ${maxVoltage.toFixed(1)}V). System will operate at ${minVoltage.toFixed(1)}V.`
        );
      }

      // Calculate power losses for each string
      strings.forEach(string => {
        const stringData = perStringBreakdown.find(sb => sb.stringId === string.stringId);
        if (stringData && stringData.voltage > minVoltage) {
          // Power loss calculation: higher voltage strings lose power when forced to lower voltage
          const voltageLossRatio = (stringData.voltage - minVoltage) / stringData.voltage;
          stringData.powerLossFromMismatch = stringData.power * voltageLossRatio;
          stringData.efficiencyImpact = voltageLossRatio * 100;
          
          // Update actual operating power
          stringData.power = stringData.power - stringData.powerLossFromMismatch;
        }
      });
    }
  });

  // Calculate system totals
  let totalSystemPower = 0;
  let totalSystemCurrent = 0;
  let totalSystemVoc = 0;
  let totalSystemIsc = 0;  // Group by inverter to get proper totals
  stringsByInverter.forEach((strings) => {
    strings.forEach(string => {
      const stringData = perStringBreakdown.find(sb => sb.stringId === string.stringId);
      if (stringData) {
        totalSystemPower += stringData.power;
        totalSystemCurrent += stringData.current;
        totalSystemIsc += stringData.isc;
      }
    });
    
    // VOC is maximum across all strings
    const inverterVocs = strings.map(s => {
      const stringData = perStringBreakdown.find(sb => sb.stringId === s.stringId);
      return stringData ? stringData.voc : 0;
    });
    totalSystemVoc = Math.max(totalSystemVoc, Math.max(...inverterVocs));
  });

  // Apply derating
  const deratedSystemPower = totalSystemPower * deratingFactors.totalDerating;
  
  // Calculate system voltage (minimum across all strings for parallel connection)
  const allVoltages = perStringBreakdown.map(s => s.voltage);
  const totalSystemVoltage = Math.min(...allVoltages);

  // Per-inverter breakdown for mixed systems
  const perInverterBreakdown: InverterBreakdown[] = [];
  
  stringsByInverter.forEach((strings, inverterId) => {
    let inverterPower = 0;
    let inverterCurrent = 0;
    let inverterVoc = 0;
    let inverterIsc = 0;
    
    const inverterVoltages = strings.map(s => {
      const stringData = perStringBreakdown.find(sb => sb.stringId === s.stringId);
      return stringData ? stringData.voltage : 0;
    });
    const inverterVoltage = Math.min(...inverterVoltages);
    
    strings.forEach(string => {
      const stringData = perStringBreakdown.find(sb => sb.stringId === string.stringId);
      if (stringData) {
        inverterPower += stringData.power;
        inverterCurrent += stringData.current;
        inverterIsc += stringData.isc;
        inverterVoc = Math.max(inverterVoc, stringData.voc);
      }
    });
    
    const deratedInverterPower = inverterPower * deratingFactors.totalDerating;
    const utilizationPercent = (deratedInverterPower / inverter.ratedPower) * 100;
    
    perInverterBreakdown.push({
      inverterId,
      voltage: inverterVoltage,
      current: inverterCurrent,
      power: deratedInverterPower,
      voc: inverterVoc,
      isc: inverterIsc,
      stringCount: strings.length,
      utilizationPercent
    });
  });

  // Safety margins (use worst case from all strings)
  const worstCaseVoc = Math.max(...perStringBreakdown.map(s => s.voc));
  const maxCurrentPerInverter = Math.max(...perInverterBreakdown.map(i => i.current));
  const maxPowerPerInverter = Math.max(...perInverterBreakdown.map(i => i.power));
  
  const safetyMargins: SafetyMargins = {
    voltageMargin: ((inverter.maxSolarVoltage - worstCaseVoc) / inverter.maxSolarVoltage) * 100,
    currentMargin: ((inverter.maxSolarCurrent - maxCurrentPerInverter) / inverter.maxSolarCurrent) * 100,
    powerMargin: ((inverter.maxPvPower - maxPowerPerInverter) / inverter.maxPvPower) * 100,
    vocMargin: ((inverter.maxSolarVoltage - worstCaseVoc) / inverter.maxSolarVoltage) * 100,
    temperatureMargin: 15
  };

  // Utilization factors
  const utilizationFactors: UtilizationFactors = {
    voltage: (totalSystemVoltage / inverter.mpptVoltageRange.max) * 100,
    current: (maxCurrentPerInverter / inverter.maxSolarCurrent) * 100,
    power: (maxPowerPerInverter / inverter.maxPvPower) * 100,
    mpptEfficiency: calculateMpptEfficiency(totalSystemVoltage, inverter)
  };

  // Real-world performance (simplified for mixed systems)
  const realWorldPerformance: RealWorldPerformance = {
    nominalPower: totalSystemPower,
    deratedPower: deratedSystemPower,
    annualEnergyProduction: 0, // TODO: Calculate based on location
    dailyEnergyProduction: 0, // TODO: Calculate based on peak sun hours
    capacityFactor: 20 // TODO: Calculate based on environmental conditions
  };

  // Calculate average values for legacy compatibility
  const avgPanelsPerString = systemConfig.strings.reduce((sum, s) => sum + s.panelCount, 0) / systemConfig.strings.length;
  const stringsPerInverter = systemConfig.strings.length / systemConfig.numInverters;

  return {
    totalSystemVoltage,
    totalSystemCurrent,
    totalSystemPower: deratedSystemPower,
    totalSystemVoc,
    totalSystemIsc,
    stringsPerInverter,
    panelsPerString: avgPanelsPerString,
    stringVoltage: totalSystemVoltage, // Average for compatibility
    stringCurrent: totalSystemCurrent / systemConfig.strings.length, // Average
    stringPower: deratedSystemPower / systemConfig.strings.length, // Average
    stringVoc: totalSystemVoc,
    stringIsc: totalSystemIsc / systemConfig.strings.length, // Average
    perInverterBreakdown,
    perStringBreakdown,
    safetyMargins,
    utilizationFactors,
    derating: deratingFactors,
    realWorldPerformance,
    mixedPanelWarnings
  };
}
