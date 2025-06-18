'use client';

import React, { useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, Calculator, AlertCircle } from 'lucide-react';
import { useSolar } from '@/components/providers/SolarProvider';
import { CostAnalysisDisplay } from '@/components/CostAnalysisDisplay';
import { CostInput } from '@/components/CostInput';
import { getCountryById } from '@/constants/countries';
import { calculateSystemCost } from '@/lib/cost-calculations';

export function CostAnalysisPage() {
  const {
    selectedCountry,
    panelSpecs,
    systemConfig,
    customCosts,
    costAnalysis,
    setCostAnalysis,
    setCustomCosts
  } = useSolar();

  const currentCountry = useMemo(() => getCountryById(selectedCountry), [selectedCountry]);

  // Calculate cost analysis when relevant data changes
  useEffect(() => {
    if (panelSpecs.power > 0 && systemConfig.panels > 0 && currentCountry) {
      const totalPower = panelSpecs.power * systemConfig.panels;
      const newCostAnalysis = calculateSystemCost({
        totalPower,
        country: currentCountry,
        customCosts
      });
      setCostAnalysis(newCostAnalysis);
    } else {
      setCostAnalysis(null);
    }
  }, [panelSpecs.power, systemConfig.panels, selectedCountry, customCosts, currentCountry, setCostAnalysis]);

  const systemPower = panelSpecs.power * systemConfig.panels;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <DollarSign className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Cost Analysis</h1>
          <p className="text-muted-foreground">
            Analyze installation costs, savings, and return on investment
          </p>
        </div>
      </div>

      {/* System Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            System Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{systemConfig.panels}</p>
              <p className="text-sm text-muted-foreground">Total Panels</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{systemPower}W</p>
              <p className="text-sm text-muted-foreground">System Power</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{systemConfig.efficiency}%</p>
              <p className="text-sm text-muted-foreground">Efficiency</p>
            </div>
            <div className="text-center">
              <Badge variant="secondary" className="text-lg py-1">
                {currentCountry?.name}
              </Badge>
              <p className="text-sm text-muted-foreground mt-1">Location</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cost Configuration */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Cost Parameters
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentCountry ? (
                <CostInput
                  country={currentCountry}
                  customCosts={customCosts}
                  onCostChange={setCustomCosts}
                />
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <AlertCircle className="w-4 h-4" />
                  <span>Please configure your system first</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Cost Analysis Results */}
        <div className="lg:col-span-2">
          {costAnalysis && currentCountry ? (
            <CostAnalysisDisplay
              analysis={costAnalysis}
              country={currentCountry}
              systemPower={systemPower}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Cost Analysis Results</CardTitle>
              </CardHeader>
              <CardContent className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
                <p className="text-muted-foreground mb-6">
                  Configure your solar system in the Calculator page to see cost analysis
                </p>
                <a href="/calculator" className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                  Go to Calculator
                </a>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Cost Breakdown Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Understanding Your Costs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold mb-2 text-blue-600">Initial Investment</h3>
              <p className="text-sm text-muted-foreground">
                Includes panel costs, installation, labor, and permits. This is your upfront investment.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-green-600">Annual Savings</h3>              <p className="text-sm text-muted-foreground">
                Estimated yearly electricity bill reduction based on your system&apos;s power generation.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-purple-600">Payback Period</h3>
              <p className="text-sm text-muted-foreground">
                Time required to recover your initial investment through electricity savings.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-orange-600">ROI (25 Years)</h3>
              <p className="text-sm text-muted-foreground">
                Total return on investment over the typical lifespan of solar panels.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-red-600">Cost Per Watt</h3>
              <p className="text-sm text-muted-foreground">
                Industry benchmark metric for comparing solar system costs across different installations.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-teal-600">Net Present Value</h3>
              <p className="text-sm text-muted-foreground">
                Present value of future savings minus initial investment, accounting for inflation.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
