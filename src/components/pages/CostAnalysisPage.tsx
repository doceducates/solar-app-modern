'use client';

import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  DollarSign, 
  TrendingUp, 
  Calculator, 
  AlertCircle, 
  Zap, 
  Clock, 
  Percent, 
  PiggyBank,
  BarChart3,
  RefreshCw,
  Info,
  Home,
  Sun,
  Target,
  ArrowRight
} from 'lucide-react';
import { useSolar } from '@/components/providers/SolarProvider';
import { useCountries } from '@/hooks/useDatabase';
import { calculateSystemCost } from '@/lib/cost-calculations';

interface LocalCosts {
  panelCostPerWatt: number;
  installationCostPerWatt: number;
  electricityRate: number;
  laborRate: number;
  installationHours: number;
  permitCost: number;
}

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

  const { countries, loading: countriesLoading } = useCountries();
  const [isCalculating, setIsCalculating] = useState(false);
  const [localCosts, setLocalCosts] = useState<LocalCosts>(customCosts);

  // Memoize current country to prevent unnecessary re-renders
  const currentCountry = useMemo(() => {
    if (!countries || countries.length === 0) return null;
    return countries.find(c => c.id === selectedCountry) || null;
  }, [countries, selectedCountry]);  // Debounced calculation function
  const performCalculation = useCallback(() => {
    if (!panelSpecs.power || !systemConfig.panels || !currentCountry) return;

    setIsCalculating(true);
    
    // Use setTimeout to ensure this runs asynchronously
    const calculateAsync = async () => {
      try {
        const totalPower = panelSpecs.power * systemConfig.panels;
        const newCostAnalysis = calculateSystemCost({
          totalPower,
          country: currentCountry,
          customCosts: localCosts
        });
        setCostAnalysis(newCostAnalysis);
      } catch (error) {
        console.error('Cost calculation error:', error);
        setCostAnalysis(null);
      } finally {
        setIsCalculating(false);
      }
    };
    
    calculateAsync();
  }, [panelSpecs.power, systemConfig.panels, currentCountry, localCosts, setCostAnalysis]);

  // Trigger calculation on dependency changes with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(performCalculation, 300);
    return () => clearTimeout(timeoutId);
  }, [performCalculation]);
  // Update local costs and sync with global state
  const updateLocalCost = useCallback((field: keyof LocalCosts, value: number) => {
    const newCosts = { ...localCosts, [field]: value };
    setLocalCosts(newCosts);
    // Immediate global state update for better responsiveness
    setCustomCosts(newCosts);
  }, [localCosts, setCustomCosts]);

  // Calculate system power
  const systemPower = panelSpecs.power * systemConfig.panels;
  const systemPowerKW = systemPower / 1000;

  // Format currency utility
  const formatCurrency = useCallback((amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }, []);

  if (countriesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Loading cost data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4">
      <div className="container mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-green-500 rounded-full text-white">
              <DollarSign className="w-8 h-8" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            Solar Cost Analysis
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Comprehensive financial analysis with real-time optimization
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-muted-foreground">System Size</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">{systemPowerKW.toFixed(1)} kW</div>
              <div className="text-xs text-muted-foreground">{systemConfig.panels} panels</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-muted-foreground">Efficiency</span>
              </div>
              <div className="text-2xl font-bold text-green-600">{systemConfig.efficiency}%</div>
              <div className="text-xs text-muted-foreground">System efficiency</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Home className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium text-muted-foreground">Location</span>
              </div>
              <div className="text-lg font-bold text-purple-600">
                {currentCountry?.name || 'Not Selected'}
              </div>              <div className="text-xs text-muted-foreground">
                {currentCountry?.currency.code || 'USD'}
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sun className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium text-muted-foreground">Per Panel</span>
              </div>
              <div className="text-2xl font-bold text-orange-600">{panelSpecs.power}W</div>
              <div className="text-xs text-muted-foreground">Power rating</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cost Configuration */}
          <Card className="shadow-lg lg:col-span-1">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Cost Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {currentCountry ? (
                <>
                  <div className="space-y-4">
                    {(['panelCostPerWatt', 'installationCostPerWatt', 'electricityRate', 'laborRate', 'installationHours', 'permitCost'] as const).map((field) => (
                      <div key={field}>
                        <Label htmlFor={field} className="text-sm font-medium capitalize">
                          {field.replace(/([A-Z])/g, ' $1').trim()}
                        </Label>
                        <div className="flex items-center mt-1">                          {field !== 'installationHours' && (
                            <span className="text-sm text-muted-foreground mr-2">
                              {currentCountry.currency.code}
                            </span>
                          )}
                          <Input
                            id={field}
                            type="number"
                            step={field === 'installationHours' ? '1' : '0.01'}
                            value={localCosts[field]}
                            onChange={(e) => updateLocalCost(field, Number(e.target.value))}
                            className="flex-1"
                            min={0}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={performCalculation}
                    className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
                    disabled={isCalculating}
                  >
                    {isCalculating ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Calculating...
                      </>
                    ) : (
                      <>
                        <Calculator className="w-4 h-4 mr-2" />
                        Recalculate Costs
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No Country Selected</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Please select a country in the Calculator page to see cost analysis.
                  </p>
                  <Button asChild>
                    <a href="/calculator" className="inline-flex items-center">
                      Go to Calculator <ArrowRight className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results */}
          <div className="lg:col-span-2 space-y-6">
            {costAnalysis && currentCountry ? (
              <>
                <Card className="shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg">
                    <CardTitle className="flex items-center gap-2">
                      <PiggyBank className="w-5 h-5" />
                      Financial Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="w-4 h-4 text-blue-500" />
                            <span className="text-sm font-medium">Total Investment</span>
                          </div>
                          <div className="text-2xl font-bold text-blue-600">
                            {formatCurrency(costAnalysis.totalSystemCost, costAnalysis.currency)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatCurrency(costAnalysis.costPerWatt, costAnalysis.currency)}/W
                          </div>
                        </div>
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-4 h-4 text-green-500" />
                            <span className="text-sm font-medium">Annual Savings</span>
                          </div>
                          <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(costAnalysis.annualSavings, costAnalysis.currency)}
                          </div>
                          <div className="text-sm text-muted-foreground">Per year</div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-4 h-4 text-purple-500" />
                            <span className="text-sm font-medium">Payback Period</span>
                          </div>
                          <div className="text-2xl font-bold text-purple-600">
                            {costAnalysis.paybackPeriod.toFixed(1)} years
                          </div>
                          <div className="text-sm text-muted-foreground">Break-even time</div>
                        </div>
                        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Percent className="w-4 h-4 text-orange-500" />
                            <span className="text-sm font-medium">25-Year ROI</span>
                          </div>                          <div className="text-2xl font-bold text-orange-600">
                            {(costAnalysis.roi25Years * 100).toFixed(0)}%
                          </div>
                          <div className="text-sm text-muted-foreground">Return on investment</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Cost Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-lg font-semibold text-blue-600">
                          {formatCurrency(systemPower * localCosts.panelCostPerWatt, currentCountry.currency.code)}
                        </div>
                        <div className="text-sm text-muted-foreground">Panel Costs</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-lg font-semibold text-green-600">
                          {formatCurrency(systemPower * localCosts.installationCostPerWatt, currentCountry.currency.code)}
                        </div>
                        <div className="text-sm text-muted-foreground">Installation</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-lg font-semibold text-purple-600">
                          {formatCurrency(localCosts.permitCost + (localCosts.laborRate * localCosts.installationHours), currentCountry.currency.code)}
                        </div>
                        <div className="text-sm text-muted-foreground">Labor & Permits</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="shadow-lg">
                <CardContent className="text-center py-12">
                  <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
                  <h3 className="text-xl font-semibold mb-4">No Analysis Available</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Configure your solar system in the Calculator page to see detailed cost analysis and financial projections.
                  </p>
                  <Button asChild className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600">
                    <a href="/calculator">
                      <Calculator className="w-4 h-4 mr-2" />
                      Go to Calculator
                    </a>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Info Section */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              Understanding Solar Economics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2 text-blue-600 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Initial Investment
                </h3>
                <p className="text-sm text-muted-foreground">
                  Includes all upfront costs: panels, inverters, installation, permits, and labor.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2 text-green-600 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Annual Savings
                </h3>
                <p className="text-sm text-muted-foreground">
                  Yearly reduction in electricity bills based on your system power generation.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2 text-purple-600 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Payback Period
                </h3>
                <p className="text-sm text-muted-foreground">
                  Time needed to recover your initial investment through savings.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2 text-orange-600 flex items-center gap-2">
                  <Percent className="w-4 h-4" />
                  Return on Investment
                </h3>
                <p className="text-sm text-muted-foreground">
                  Total financial return over 25 years as a percentage of initial investment.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}