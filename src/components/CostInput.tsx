import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CountryPricing } from '@/types';
import { formatCurrency } from '@/constants/countries';
import { Settings, RotateCcw, Info } from 'lucide-react';
import { PakistanElectricityPricing } from './PakistanElectricityPricing';

interface CustomCostInputs {
  panelCostPerWatt: number;
  installationCostPerWatt: number;
  electricityRate: number;
  laborRate: number;
  installationHours: number;
  permitCost: number;
}

interface CostInputProps {
  country: CountryPricing;
  customCosts: CustomCostInputs;
  onCostChange: (costs: CustomCostInputs) => void;
  className?: string;
}

export function CostInput({ country, customCosts, onCostChange, className }: CostInputProps) {
  const [useDetailedElectricityPricing, setUseDetailedElectricityPricing] = useState(country.id === 'pakistan');

  const handleInputChange = (field: keyof CustomCostInputs, value: string) => {
    const numValue = parseFloat(value) || 0;
    onCostChange({
      ...customCosts,
      [field]: numValue
    });
  };

  const handleElectricityRateFromDetailed = (averageRate: number, marginalRate: number) => {
    // Use marginal rate for savings calculation as that's what solar will offset first
    handleInputChange('electricityRate', marginalRate.toString());
  };

  const resetToDefaults = () => {
    onCostChange({
      panelCostPerWatt: country.pricing.panelCostPerWatt,
      installationCostPerWatt: country.pricing.installationCostPerWatt,
      electricityRate: country.pricing.electricityRate,
      laborRate: country.pricing.laborRate,
      installationHours: 40, // Default 40 hours
      permitCost: country.pricing.permitCost
    });
  };

  const hasCustomValues = (
    customCosts.panelCostPerWatt !== country.pricing.panelCostPerWatt ||
    customCosts.installationCostPerWatt !== country.pricing.installationCostPerWatt ||
    customCosts.electricityRate !== country.pricing.electricityRate ||
    customCosts.laborRate !== country.pricing.laborRate ||
    customCosts.permitCost !== country.pricing.permitCost
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Custom Cost Settings
          </div>
          <div className="flex items-center gap-2">
            {hasCustomValues && (
              <Badge variant="secondary" className="text-xs">
                Custom Values
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={resetToDefaults}
              className="h-8 px-2"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset
            </Button>
          </div>
        </CardTitle>
      </CardHeader>      <CardContent className="space-y-4">
        {/* Pakistani Detailed Electricity Pricing */}
        {country.id === 'pakistan' && (
          <>
            <div className="flex items-center gap-2 mb-4">
              <Button
                variant={useDetailedElectricityPricing ? "default" : "outline"}
                size="sm"
                onClick={() => setUseDetailedElectricityPricing(true)}
              >
                Pakistani Bill Calculator
              </Button>
              <Button
                variant={!useDetailedElectricityPricing ? "default" : "outline"}
                size="sm"
                onClick={() => setUseDetailedElectricityPricing(false)}
              >
                Simple Rate
              </Button>
            </div>
            
            {useDetailedElectricityPricing && (
              <PakistanElectricityPricing
                currency={country.currency}
                onAverageRateCalculated={handleElectricityRateFromDetailed}
                className="mb-4"
              />
            )}
          </>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Panel Cost */}
          <div className="space-y-2">
            <Label htmlFor="panel-cost" className="text-sm font-medium">
              Panel Cost per Watt
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                {country.currency.symbol}
              </span>
              <Input
                id="panel-cost"
                type="number"
                step="0.1"
                min="0"
                value={customCosts.panelCostPerWatt}
                onChange={(e) => handleInputChange('panelCostPerWatt', e.target.value)}
                className="pl-8"
                placeholder={`Default: ${country.pricing.panelCostPerWatt}`}
              />
            </div>
            <div className="text-xs text-muted-foreground">
              Default: {formatCurrency(country.pricing.panelCostPerWatt, country.currency.code)}/W
            </div>
          </div>

          {/* Installation Cost */}
          <div className="space-y-2">
            <Label htmlFor="installation-cost" className="text-sm font-medium">
              Installation Cost per Watt
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                {country.currency.symbol}
              </span>
              <Input
                id="installation-cost"
                type="number"
                step="0.1"
                min="0"
                value={customCosts.installationCostPerWatt}
                onChange={(e) => handleInputChange('installationCostPerWatt', e.target.value)}
                className="pl-8"
                placeholder={`Default: ${country.pricing.installationCostPerWatt}`}
              />
            </div>
            <div className="text-xs text-muted-foreground">
              Default: {formatCurrency(country.pricing.installationCostPerWatt, country.currency.code)}/W
            </div>
          </div>          {/* Electricity Rate */}
          <div className="space-y-2">
            <Label htmlFor="electricity-rate" className="text-sm font-medium">
              Electricity Rate per kWh
              {country.id === 'pakistan' && useDetailedElectricityPricing && (
                <span className="text-green-600 text-xs ml-2">(Auto-calculated from bill)</span>
              )}
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                {country.currency.symbol}
              </span>
              <Input
                id="electricity-rate"
                type="number"
                step="0.01"
                min="0"
                value={customCosts.electricityRate}
                onChange={(e) => handleInputChange('electricityRate', e.target.value)}
                className="pl-8"
                placeholder={`Default: ${country.pricing.electricityRate}`}
                disabled={country.id === 'pakistan' && useDetailedElectricityPricing}
              />
            </div>
            <div className="text-xs text-muted-foreground">
              {country.id === 'pakistan' && useDetailedElectricityPricing ? (
                "Rate calculated from your electricity bill slabs (marginal rate for solar savings)"
              ) : (
                `Default: ${formatCurrency(country.pricing.electricityRate, country.currency.code)}/kWh`
              )}
            </div>
          </div>

          {/* Labor Rate */}
          <div className="space-y-2">
            <Label htmlFor="labor-rate" className="text-sm font-medium">
              Labor Rate per Hour
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                {country.currency.symbol}
              </span>
              <Input
                id="labor-rate"
                type="number"
                step="1"
                min="0"
                value={customCosts.laborRate}
                onChange={(e) => handleInputChange('laborRate', e.target.value)}
                className="pl-8"
                placeholder={`Default: ${country.pricing.laborRate}`}
              />
            </div>
            <div className="text-xs text-muted-foreground">
              Default: {formatCurrency(country.pricing.laborRate, country.currency.code)}/hour
            </div>
          </div>

          {/* Installation Hours */}
          <div className="space-y-2">
            <Label htmlFor="installation-hours" className="text-sm font-medium">
              Installation Hours
            </Label>
            <Input
              id="installation-hours"
              type="number"
              step="1"
              min="1"
              max="200"
              value={customCosts.installationHours}
              onChange={(e) => handleInputChange('installationHours', e.target.value)}
              placeholder="40"
            />
            <div className="text-xs text-muted-foreground">
              Estimated hours for complete installation
            </div>
          </div>

          {/* Permit Cost */}
          <div className="space-y-2">
            <Label htmlFor="permit-cost" className="text-sm font-medium">
              Permit Cost
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                {country.currency.symbol}
              </span>
              <Input
                id="permit-cost"
                type="number"
                step="1"
                min="0"
                value={customCosts.permitCost}
                onChange={(e) => handleInputChange('permitCost', e.target.value)}
                className="pl-8"
                placeholder={`Default: ${country.pricing.permitCost}`}
              />
            </div>
            <div className="text-xs text-muted-foreground">
              Default: {formatCurrency(country.pricing.permitCost, country.currency.code)}
              {!country.regulations.requiresPermit && " (Not required)"}
            </div>
          </div>
        </div>        {/* Info Section */}
        <div className="bg-muted/50 p-3 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium">Cost Customization Tips:</p>
              <ul className="space-y-1">
                <li>• Panel costs vary by brand, efficiency, and bulk purchase discounts</li>
                <li>• Installation costs depend on roof complexity and local labor rates</li>
                {country.id === 'pakistan' ? (
                  <>
                    <li>• Use the Pakistani Bill Calculator for accurate electricity cost analysis</li>
                    <li>• Solar savings are calculated at your highest electricity slab rate</li>
                    <li>• Check your WAPDA/K-Electric bill for current unit rates and slabs</li>
                    <li>• Consider net metering policies in your area for excess energy sales</li>
                  </>
                ) : (
                  <>
                    <li>• Check your latest electricity bill for accurate rate per kWh</li>
                    <li>• Consider seasonal variations and time-of-use rates</li>
                  </>
                )}
                <li>• Get multiple quotes from local installers for realistic estimates</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
