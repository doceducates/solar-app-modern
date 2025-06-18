'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/constants/countries';
import { Plus, Minus, Calculator, Info, Zap } from 'lucide-react';

interface ElectricitySlab {
  id: string;
  fromUnits: number;
  toUnits: number;
  ratePerUnit: number;
}

interface PakistanElectricityPricingProps {
  currency: {
    code: string;
    symbol: string;
  };
  onAverageRateCalculated: (averageRate: number, marginalRate: number) => void;
  className?: string;
}

export function PakistanElectricityPricing({ 
  currency, 
  onAverageRateCalculated, 
  className 
}: PakistanElectricityPricingProps) {
  const [monthlyConsumption, setMonthlyConsumption] = useState<number>(300);
  const [fixedCharges, setFixedCharges] = useState<number>(150);
  const [fuelAdjustment, setFuelAdjustment] = useState<number>(3.5);
  const [taxes, setTaxes] = useState<number>(17); // GST percentage
  
  // Default Pakistani electricity slabs (approximate K-Electric rates)
  const [slabs, setSlabs] = useState<ElectricitySlab[]>([
    { id: '1', fromUnits: 1, toUnits: 100, ratePerUnit: 16.0 },
    { id: '2', fromUnits: 101, toUnits: 200, ratePerUnit: 20.0 },
    { id: '3', fromUnits: 201, toUnits: 300, ratePerUnit: 24.0 },
    { id: '4', fromUnits: 301, toUnits: 500, ratePerUnit: 30.0 },
    { id: '5', fromUnits: 501, toUnits: 999999, ratePerUnit: 35.0 }
  ]);

  const addSlab = () => {
    const lastSlab = slabs[slabs.length - 1];
    const newSlab: ElectricitySlab = {
      id: Date.now().toString(),
      fromUnits: lastSlab.toUnits + 1,
      toUnits: lastSlab.toUnits + 100,
      ratePerUnit: lastSlab.ratePerUnit + 2
    };
    setSlabs([...slabs, newSlab]);
  };

  const removeSlab = (id: string) => {
    if (slabs.length > 1) {
      setSlabs(slabs.filter(slab => slab.id !== id));
    }
  };

  const updateSlab = (id: string, field: keyof ElectricitySlab, value: number) => {
    setSlabs(slabs.map(slab => 
      slab.id === id ? { ...slab, [field]: value } : slab
    ));
  };
  const calculateElectricityBill = useCallback(() => {
    let totalCost = 0;
    let unitsRemaining = monthlyConsumption;
    let marginalRate = 0;

    // Calculate cost based on slabs
    for (const slab of slabs.sort((a, b) => a.fromUnits - b.fromUnits)) {
      if (unitsRemaining <= 0) break;
      
      const slabUnits = Math.min(slab.toUnits - slab.fromUnits + 1, unitsRemaining);
      const slabCost = slabUnits * slab.ratePerUnit;
      totalCost += slabCost;
      unitsRemaining -= slabUnits;
      
      // The marginal rate is the rate of the highest slab we're using
      if (slabUnits > 0) {
        marginalRate = slab.ratePerUnit;
      }
    }

    // Add fuel adjustment
    totalCost += monthlyConsumption * fuelAdjustment;
    marginalRate += fuelAdjustment;

    // Add fixed charges
    totalCost += fixedCharges;

    // Add taxes (GST)
    const taxAmount = (totalCost * taxes) / 100;
    totalCost += taxAmount;

    // Calculate average rate per unit
    const averageRate = totalCost / monthlyConsumption;

    // Add tax to marginal rate as well
    const marginalRateWithTax = marginalRate * (1 + taxes / 100);

    return {
      totalBill: totalCost,
      averageRate,
      marginalRate: marginalRateWithTax,
      baseCharges: totalCost - fixedCharges - taxAmount,
      taxAmount
    };
  }, [monthlyConsumption, fixedCharges, fuelAdjustment, taxes, slabs]);

  const billCalculation = useMemo(() => calculateElectricityBill(), [calculateElectricityBill]);

  // Update parent component with calculated rates
  React.useEffect(() => {
    onAverageRateCalculated(billCalculation.averageRate, billCalculation.marginalRate);
  }, [billCalculation.averageRate, billCalculation.marginalRate, onAverageRateCalculated]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          Pakistani Electricity Pricing Calculator
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Enter your electricity bill details to calculate accurate savings from solar panels
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Monthly Consumption */}
        <div className="space-y-2">
          <Label htmlFor="monthly-consumption" className="text-sm font-medium">
            Monthly Consumption (Units/kWh)
          </Label>
          <Input
            id="monthly-consumption"
            type="number"
            min="1"
            value={monthlyConsumption}
            onChange={(e) => setMonthlyConsumption(parseInt(e.target.value) || 0)}
            placeholder="Enter your monthly units consumed"
          />
          <p className="text-xs text-muted-foreground">
            Check your electricity bill for &quot;Units Consumed&quot; or &quot;kWh&quot;
          </p>
        </div>

        {/* Electricity Slabs */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Electricity Rate Slabs</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={addSlab}
              className="h-8 px-2"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Slab
            </Button>
          </div>
          
          <div className="space-y-2">
            {slabs.map((slab) => (
              <div key={slab.id} className="flex items-center gap-2 p-3 border rounded-lg">
                <div className="flex-1 grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs">From Units</Label>
                    <Input
                      type="number"
                      value={slab.fromUnits}
                      onChange={(e) => updateSlab(slab.id, 'fromUnits', parseInt(e.target.value) || 0)}
                      className="h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">To Units</Label>
                    <Input
                      type="number"
                      value={slab.toUnits}
                      onChange={(e) => updateSlab(slab.id, 'toUnits', parseInt(e.target.value) || 0)}
                      className="h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Rate per Unit ({currency.symbol})</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={slab.ratePerUnit}
                      onChange={(e) => updateSlab(slab.id, 'ratePerUnit', parseFloat(e.target.value) || 0)}
                      className="h-8"
                    />
                  </div>
                </div>
                {slabs.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeSlab(slab.id)}
                    className="h-8 w-8 p-0"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Additional Charges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fixed-charges" className="text-sm font-medium">
              Fixed Charges ({currency.symbol})
            </Label>
            <Input
              id="fixed-charges"
              type="number"
              step="1"
              value={fixedCharges}
              onChange={(e) => setFixedCharges(parseFloat(e.target.value) || 0)}
              placeholder="150"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="fuel-adjustment" className="text-sm font-medium">
              Fuel Adjustment ({currency.symbol}/unit)
            </Label>
            <Input
              id="fuel-adjustment"
              type="number"
              step="0.1"
              value={fuelAdjustment}
              onChange={(e) => setFuelAdjustment(parseFloat(e.target.value) || 0)}
              placeholder="3.5"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="taxes" className="text-sm font-medium">
              Taxes/GST (%)
            </Label>
            <Input
              id="taxes"
              type="number"
              step="1"
              min="0"
              max="100"
              value={taxes}
              onChange={(e) => setTaxes(parseFloat(e.target.value) || 0)}
              placeholder="17"
            />
          </div>
        </div>

        {/* Calculation Results */}
        <div className="bg-muted/50 p-4 rounded-lg space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="h-4 w-4 text-blue-500" />
            <span className="font-medium text-sm">Bill Calculation</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Base charges:</span>
                <span>{formatCurrency(billCalculation.baseCharges, currency.code)}</span>
              </div>
              <div className="flex justify-between">
                <span>Fixed charges:</span>
                <span>{formatCurrency(fixedCharges, currency.code)}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxes ({taxes}%):</span>
                <span>{formatCurrency(billCalculation.taxAmount, currency.code)}</span>
              </div>
              <div className="flex justify-between font-medium border-t pt-2">
                <span>Total Bill:</span>
                <span>{formatCurrency(billCalculation.totalBill, currency.code)}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Average rate per unit:</span>
                <span>{formatCurrency(billCalculation.averageRate, currency.code)}/kWh</span>
              </div>
              <div className="flex justify-between">
                <span>Marginal rate (savings):</span>
                <span className="text-green-600 font-medium">
                  {formatCurrency(billCalculation.marginalRate, currency.code)}/kWh
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
              <p className="font-medium">Understanding Your Electricity Bill:</p>
              <ul className="space-y-1">
                <li>• <strong>Units</strong> = kWh (kilowatt hours) of electricity consumed</li>
                <li>• <strong>Marginal Rate</strong> is used for solar savings (highest slab you&apos;re paying)</li>
                <li>• <strong>Average Rate</strong> is your total bill divided by total units</li>
                <li>• Solar panels will save you money at the marginal rate first</li>
                <li>• Check your latest WAPDA/K-Electric bill for accurate rates</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
