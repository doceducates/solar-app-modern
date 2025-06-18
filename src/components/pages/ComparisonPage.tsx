'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Zap, Battery, TrendingUp } from 'lucide-react';
import { useSolar } from '@/components/providers/SolarProvider';
import ComparisonChart from '@/components/ComparisonChart';
import ResultsDisplay from '@/components/ResultsDisplay';

export function ComparisonPage() {
  const { results, panelSpecs, systemConfig } = useSolar();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BarChart3 className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Configuration Comparison</h1>
          <p className="text-muted-foreground">
            Compare different wiring configurations and their performance
          </p>
        </div>
      </div>

      {results ? (
        <div className="space-y-8">
          {/* Comparison Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                Performance Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ComparisonChart results={results} />
            </CardContent>
          </Card>

          {/* Detailed Results */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Series Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-orange-500" />
                  Series Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Voltage</p>
                    <p className="text-lg font-semibold">{results.series.voltage.toFixed(1)}V</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Current</p>
                    <p className="text-lg font-semibold">{results.series.current.toFixed(1)}A</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Power</p>
                    <p className="text-lg font-semibold text-blue-600">{results.series.power.toFixed(1)}W</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Efficiency</p>
                    <p className="text-lg font-semibold">{systemConfig.efficiency}%</p>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-2">Characteristics</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Higher voltage output</li>
                    <li>• Same current as single panel</li>
                    <li>• Better for long cable runs</li>
                    <li>• Shading affects entire string</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Parallel Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Battery className="w-5 h-5 text-green-500" />
                  Parallel Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Voltage</p>
                    <p className="text-lg font-semibold">{results.parallel.voltage.toFixed(1)}V</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Current</p>
                    <p className="text-lg font-semibold">{results.parallel.current.toFixed(1)}A</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Power</p>
                    <p className="text-lg font-semibold text-blue-600">{results.parallel.power.toFixed(1)}W</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Efficiency</p>
                    <p className="text-lg font-semibold">{systemConfig.efficiency}%</p>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-2">Characteristics</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Higher current output</li>
                    <li>• Same voltage as single panel</li>
                    <li>• Better shade tolerance</li>
                    <li>• Requires thicker cables</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Combined Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-500" />
                  Combined Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Voltage</p>
                    <p className="text-lg font-semibold">{results.combined.voltage.toFixed(1)}V</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Current</p>
                    <p className="text-lg font-semibold">{results.combined.current.toFixed(1)}A</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Power</p>
                    <p className="text-lg font-semibold text-blue-600">{results.combined.power.toFixed(1)}W</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Efficiency</p>
                    <p className="text-lg font-semibold">{systemConfig.efficiency}%</p>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-2">Characteristics</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Balanced voltage & current</li>
                    <li>• {systemConfig.seriesGroups} groups of {systemConfig.panelsPerGroup} panels</li>
                    <li>• Flexible system design</li>
                    <li>• Optimal for most installations</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Technical Results */}
          <ResultsDisplay
            results={results}
            activeConfiguration="combined"
            panelSpecs={panelSpecs}
            systemConfig={systemConfig}
          />
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Configuration Data</h3>
            <p className="text-muted-foreground mb-6">
              Configure your solar system in the Calculator page to see comparisons
            </p>
            <a href="/calculator" className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
              Go to Calculator
            </a>
          </CardContent>
        </Card>
      )}

      {/* Configuration Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">
                Series Configuration
              </h3>
              <p className="text-sm text-orange-700 dark:text-orange-200 mb-3">
                Best for systems with consistent sunlight and no shading issues.
              </p>
              <ul className="text-xs text-orange-600 dark:text-orange-300 space-y-1">
                <li>✓ Higher system voltage</li>
                <li>✓ Reduced current losses</li>
                <li>✗ Sensitive to shading</li>
              </ul>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                Parallel Configuration
              </h3>
              <p className="text-sm text-green-700 dark:text-green-200 mb-3">
                Ideal for installations with partial shading or varying orientations.
              </p>
              <ul className="text-xs text-green-600 dark:text-green-300 space-y-1">
                <li>✓ Shade tolerant</li>
                <li>✓ Individual panel optimization</li>
                <li>✗ Higher current requirements</li>
              </ul>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                Combined Configuration
              </h3>
              <p className="text-sm text-purple-700 dark:text-purple-200 mb-3">
                Balanced approach combining benefits of both series and parallel.
              </p>
              <ul className="text-xs text-purple-600 dark:text-purple-300 space-y-1">
                <li>✓ Optimized voltage & current</li>
                <li>✓ Flexible design options</li>
                <li>✓ Best overall performance</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
