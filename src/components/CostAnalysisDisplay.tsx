import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CostAnalysis, CountryPricing } from '@/types';
import { formatCurrency } from '@/constants/countries';
import { Calculator, TrendingUp, Clock, Percent, Zap, DollarSign } from 'lucide-react';

interface CostAnalysisDisplayProps {
  analysis: CostAnalysis;
  country: CountryPricing;
  systemPower: number;
  className?: string;
}

export function CostAnalysisDisplay({ analysis, country, systemPower, className }: CostAnalysisDisplayProps) {
  const powerInKW = systemPower / 1000;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Cost Analysis - {country.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total System Cost */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Total System Cost</span>
            </div>
            <div className="text-2xl font-bold">
              {formatCurrency(analysis.totalSystemCost, analysis.currency)}
            </div>
            <div className="text-sm text-muted-foreground">
              {formatCurrency(analysis.costPerWatt, analysis.currency)}/W
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">System Size</span>
            </div>
            <div className="text-2xl font-bold">
              {powerInKW.toFixed(1)} kW
            </div>
            <div className="text-sm text-muted-foreground">
              {systemPower.toLocaleString()} watts
            </div>
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Cost Breakdown</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span>Panels:</span>
              <span>{formatCurrency(analysis.panelCost, analysis.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span>Installation:</span>
              <span>{formatCurrency(analysis.installationCost, analysis.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span>Labor:</span>
              <span>{formatCurrency(analysis.laborCost, analysis.currency)}</span>
            </div>
            {analysis.permitCost > 0 && (
              <div className="flex justify-between">
                <span>Permits:</span>
                <span>{formatCurrency(analysis.permitCost, analysis.currency)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Financial Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-xs font-medium text-green-600">Annual Savings</span>
            </div>
            <div className="text-lg font-bold text-green-700 dark:text-green-400">
              {formatCurrency(analysis.annualSavings, analysis.currency)}
            </div>
          </div>

          <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-600">Payback Period</span>
            </div>
            <div className="text-lg font-bold text-blue-700 dark:text-blue-400">
              {analysis.paybackPeriod.toFixed(1)} years
            </div>
          </div>

          <div className="text-center p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Percent className="h-4 w-4 text-purple-600" />
              <span className="text-xs font-medium text-purple-600">25-Year ROI</span>
            </div>
            <div className="text-lg font-bold text-purple-700 dark:text-purple-400">
              {analysis.roi25Years.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Incentives */}
        {country.incentives && country.incentives.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Available Incentives</h4>
            <div className="flex flex-wrap gap-2">
              {country.incentives.map((incentive, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {incentive.name}: {incentive.value}
                  {incentive.type === 'feed_in_tariff' ? ` ${country.currency.code}/kWh` : '%'}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Note: Incentives may reduce actual costs and improve ROI
            </p>
          </div>
        )}

        {/* Important Notes */}
        <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <p className="font-medium mb-1">Important Notes:</p>
          <ul className="space-y-1">
            <li>• Costs are estimates and may vary by location and installer</li>
            <li>• Electricity rate assumed: {formatCurrency(country.pricing.electricityRate, country.currency.code)}/kWh</li>
            <li>• Calculations assume 5.5 peak sun hours daily</li>
            <li>• ROI includes 3% annual electricity rate increase</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
