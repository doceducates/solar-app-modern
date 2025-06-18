import { CountryPricing, CostAnalysis } from '@/types';
import { formatCurrency } from '@/constants/countries';

// Default financial assumptions
export const FINANCIAL_ASSUMPTIONS = {
  ANNUAL_RATE_INCREASE: 0.03, // 3% per year
  SYSTEM_DEGRADATION: 0.005, // 0.5% per year
  DISCOUNT_RATE: 0.05, // 5% discount rate
  SYSTEM_LIFESPAN: 25, // years
  DAILY_SUN_HOURS: 5.5, // average peak sun hours
};

export interface CostCalculationInput {
  totalPower: number; // Total system power in watts
  country: CountryPricing;
  customCosts?: {
    panelCostPerWatt?: number;
    installationCostPerWatt?: number;
    electricityRate?: number;
    laborRate?: number;
    permitCost?: number;
    installationHours?: number;
  };
}

export function calculateSystemCost(input: CostCalculationInput): CostAnalysis {
  const { totalPower, country, customCosts = {} } = input;
  const powerInKW = totalPower / 1000;

  // Use custom costs or fall back to country defaults
  const panelCostPerWatt = customCosts.panelCostPerWatt ?? country.pricing.panelCostPerWatt;
  const installationCostPerWatt = customCosts.installationCostPerWatt ?? country.pricing.installationCostPerWatt;
  const electricityRate = customCosts.electricityRate ?? country.pricing.electricityRate;
  const laborRate = customCosts.laborRate ?? country.pricing.laborRate;
  const permitCost = customCosts.permitCost ?? (country.regulations.requiresPermit ? country.pricing.permitCost : 0);
  const installationHours = customCosts.installationHours ?? 40;

  // Calculate costs
  const panelCost = totalPower * panelCostPerWatt;
  const installationCost = totalPower * installationCostPerWatt;
  const laborCost = installationHours * laborRate;
  
  const totalSystemCost = panelCost + installationCost + laborCost + permitCost;
  const costPerWatt = totalSystemCost / totalPower;

  // Calculate annual energy production and savings
  const annualEnergyProduction = powerInKW * FINANCIAL_ASSUMPTIONS.DAILY_SUN_HOURS * 365;
  const annualSavings = annualEnergyProduction * electricityRate;

  // Calculate payback period
  const paybackPeriod = totalSystemCost / annualSavings;

  // Calculate 25-year ROI
  let totalSavings = 0;
  let currentProduction = annualEnergyProduction;
  let currentElectricityRate = electricityRate;

  for (let year = 1; year <= FINANCIAL_ASSUMPTIONS.SYSTEM_LIFESPAN; year++) {
    const yearSavings = currentProduction * currentElectricityRate;
    totalSavings += yearSavings / Math.pow(1 + FINANCIAL_ASSUMPTIONS.DISCOUNT_RATE, year);
    
    // Degrade production and increase electricity rates
    currentProduction *= (1 - FINANCIAL_ASSUMPTIONS.SYSTEM_DEGRADATION);
    currentElectricityRate *= (1 + FINANCIAL_ASSUMPTIONS.ANNUAL_RATE_INCREASE);
  }

  const roi25Years = ((totalSavings - totalSystemCost) / totalSystemCost) * 100;

  return {
    totalSystemCost,
    costPerWatt,
    installationCost,
    panelCost,
    laborCost,
    permitCost,
    annualSavings,
    paybackPeriod,
    roi25Years,
    currency: country.currency.code
  };
}

export function formatCostAnalysis(analysis: CostAnalysis): string {
  const formatted = {
    totalCost: formatCurrency(analysis.totalSystemCost, analysis.currency),
    costPerWatt: formatCurrency(analysis.costPerWatt, analysis.currency),
    annualSavings: formatCurrency(analysis.annualSavings, analysis.currency),
    payback: `${analysis.paybackPeriod.toFixed(1)} years`,
    roi: `${analysis.roi25Years.toFixed(1)}%`
  };

  return `Total System Cost: ${formatted.totalCost} (${formatted.costPerWatt}/W)
Annual Savings: ${formatted.annualSavings}
Payback Period: ${formatted.payback}
25-Year ROI: ${formatted.roi}`;
}

export function getIncentiveAdjustedCost(
  analysis: CostAnalysis, 
  country: CountryPricing
): CostAnalysis {
  let adjustedCost = analysis.totalSystemCost;

  if (country.incentives) {
    for (const incentive of country.incentives) {
      if (incentive.type === 'rebate' || incentive.type === 'tax_credit') {
        const incentiveAmount = (incentive.value / 100) * analysis.totalSystemCost;
        adjustedCost -= incentiveAmount;
      }
    }
  }

  return {
    ...analysis,
    totalSystemCost: adjustedCost,
    costPerWatt: adjustedCost / (analysis.totalSystemCost / analysis.costPerWatt),
    paybackPeriod: adjustedCost / analysis.annualSavings
  };
}
