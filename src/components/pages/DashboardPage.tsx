'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Calculator, 
  DollarSign, 
  BarChart3, 
  Settings, 
  Zap, 
  Sun,
  TrendingUp,
  Shield,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSolar } from '@/components/providers/SolarProvider';
import { formatCurrency, getCountryById } from '@/constants/countries';

export function DashboardPage() {
  const { panelSpecs, systemConfig, results, costAnalysis, selectedCountry } = useSolar();
  const country = getCountryById(selectedCountry);

  const quickActions = [
    {
      title: 'Start Calculation',
      description: 'Configure your solar panel system',
      icon: Calculator,
      href: '/calculator',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      title: 'Cost Analysis',
      description: 'Analyze costs and savings',
      icon: DollarSign,
      href: '/cost-analysis',
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      title: 'Compare Systems',
      description: 'Compare different configurations',
      icon: BarChart3,
      href: '/comparison',
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      title: 'Settings',
      description: 'Manage preferences',
      icon: Settings,
      href: '/settings',
      color: 'text-gray-500',
      bgColor: 'bg-gray-50 dark:bg-gray-900/20'
    }
  ];

  const systemPower = panelSpecs.power * systemConfig.panels;
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 lg:p-8">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">
            Welcome to Solar Calculator
          </h1>          <p className="text-blue-100 mb-4 max-w-2xl">
            Design and analyze your solar panel system with advanced calculations, 
            cost analysis, and country-specific pricing. Get started by configuring 
            your system parameters.
          </p>
          <Link href="/calculator">
            <Button className="bg-white text-blue-600 hover:bg-blue-50">
              Start Calculating
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
        <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 opacity-20">
          <Sun className="w-32 h-32" />
        </div>
      </div>      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-lg ${action.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-6 h-6 ${action.color}`} />
                    </div>
                    <h3 className="font-semibold mb-2">{action.title}</h3>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Current System Overview */}
      <div>
        <h2 className="text-2xl font-semibold mb-6">Current System Overview</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* System Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                System Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">              <div className="flex justify-between">
                <span className="text-muted-foreground">Panel Power:</span>
                <span className="font-medium">{panelSpecs.power}W</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Panels:</span>
                <span className="font-medium">{systemConfig.panels}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">System Power:</span>
                <span className="font-medium">{systemPower}W</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Country:</span>
                <Badge variant="secondary">{country?.name}</Badge>
              </div>
              <Link href="/calculator">
                <Button className="w-full mt-4" variant="outline">
                  Configure System
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {results ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Series Power:</span>
                    <span className="font-medium">{results.series.power.toFixed(1)}W</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Parallel Power:</span>
                    <span className="font-medium">{results.parallel.power.toFixed(1)}W</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Combined Power:</span>
                    <span className="font-medium">{results.combined.power.toFixed(1)}W</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Efficiency:</span>
                    <span className="font-medium">{systemConfig.efficiency}%</span>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Configure your system to see performance data
                </p>
              )}
              <Link href="/comparison">
                <Button className="w-full mt-4" variant="outline">
                  View Details
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Cost Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-500" />
                Cost Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {costAnalysis && country ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Cost:</span>
                    <span className="font-medium">
                      {formatCurrency(costAnalysis.totalSystemCost, country.currency.code)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Annual Savings:</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(costAnalysis.annualSavings, country.currency.code)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payback Period:</span>
                    <span className="font-medium">{costAnalysis.paybackPeriod.toFixed(1)} years</span>
                  </div>                  <div className="flex justify-between">
                    <span className="text-muted-foreground">25-Year ROI:</span>
                    <span className="font-medium text-green-600">
                      {costAnalysis.roi25Years.toFixed(1)}%
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Configure your system to see cost analysis
                </p>
              )}
              <Link href="/cost-analysis">
                <Button className="w-full mt-4" variant="outline">
                  Detailed Analysis
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tips & Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-500" />
            Getting Started Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">1. System Configuration</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Start by selecting your panel specifications or choose from our preset models. 
                Configure the number of panels and system arrangement.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">2. Cost Analysis</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Analyze the financial aspects including installation costs, savings, 
                and return on investment for your specific location.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">3. Performance Comparison</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Compare different wiring configurations (series, parallel, combined) 
                to optimize your system performance.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">4. Safety Checks</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Our calculator automatically validates your configuration against 
                safety standards and electrical limits.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
