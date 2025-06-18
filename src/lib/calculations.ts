import {
  PanelSpecifications,
  SystemConfiguration,
  CalculationResults,
  ConfigurationResults,
  SafetyCheck,
  SafetyChecks,
  CostAnalysis,
  EnvironmentalImpact
} from '@/types';
import {
  COST_ASSUMPTIONS,
  ENVIRONMENTAL_CONSTANTS
} from '@/constants/panels';

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
    combined: convertChecksToFormat(checkCombinedSafety(panelSpecs, config))
  };
}

/**
 * Calculate cost analysis
 */
export function calculateCostAnalysis(
  panelSpecs: PanelSpecifications,
  config: SystemConfiguration,
  results: ConfigurationResults
): CostAnalysis {
  const systemPower = Math.max(results.series.power, results.parallel.power, results.combined.power);
  const panelCost = systemPower * COST_ASSUMPTIONS.PANEL_COST_PER_WATT;
  const installationCost = systemPower * COST_ASSUMPTIONS.INSTALLATION_COST_PER_WATT;
  const totalCost = panelCost + installationCost;
  const costPerWatt = totalCost / systemPower;
  
  // Calculate annual energy production (assuming 4.5 peak sun hours average)
  const annualEnergy = systemPower * 4.5 * 365 / 1000; // kWh per year
  const annualSavings = annualEnergy * COST_ASSUMPTIONS.ELECTRICITY_RATE;
  const paybackPeriod = totalCost / annualSavings;
  
  // Calculate 20-year savings with rate increases and system degradation
  let totalSavings = 0;
  let currentEnergy = annualEnergy;
  let currentRate = COST_ASSUMPTIONS.ELECTRICITY_RATE;
  
  for (let year = 1; year <= 20; year++) {
    currentRate *= (1 + COST_ASSUMPTIONS.ANNUAL_RATE_INCREASE);
    currentEnergy *= (1 - COST_ASSUMPTIONS.SYSTEM_DEGRADATION);
    totalSavings += currentEnergy * currentRate;
  }
  
  const savings20Years = totalSavings - totalCost;
  const roi = (savings20Years / totalCost) * 100;

  return {
    panelCost,
    installationCost,
    totalCost,
    costPerWatt,
    paybackPeriod,
    roi,
    savings20Years
  };
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
