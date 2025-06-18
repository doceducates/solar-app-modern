'use client';

import { Zap, Battery, TrendingUp, Gauge, DollarSign, Target } from 'lucide-react';
import { ConfigurationResults, PanelSpecifications, SystemConfiguration, ConfigurationType } from '@/types';
import { cn } from '@/lib/utils';

interface ResultsDisplayProps {
  results: ConfigurationResults;
  activeConfiguration: ConfigurationType;
  panelSpecs: PanelSpecifications;
  systemConfig: SystemConfiguration;
}

export default function ResultsDisplay({
  results,
  activeConfiguration,
  panelSpecs,
  systemConfig
}: ResultsDisplayProps) {
  const currentResult = results[activeConfiguration];
  
  // Calculate efficiency and performance metrics
  const theoreticalMaxPower = panelSpecs.power * systemConfig.panels;
  const actualEfficiency = (currentResult.power / theoreticalMaxPower) * 100;
  const systemEfficiency = systemConfig.efficiency;
  const realWorldPower = currentResult.power * (systemEfficiency / 100);
  
  // Calculate daily energy production (assuming 5 peak sun hours average)
  const peakSunHours = 5;
  const dailyEnergy = (realWorldPower * peakSunHours) / 1000; // kWh
  const monthlyEnergy = dailyEnergy * 30;
  const yearlyEnergy = dailyEnergy * 365;

  // Cost calculations (rough estimates)
  const costPerWatt = 3; // $3 per watt installed
  const systemCost = (realWorldPower / 1000) * costPerWatt * 1000;
  const electricityRate = 0.12; // $0.12 per kWh
  const yearlySavings = yearlyEnergy * electricityRate;
  const paybackYears = systemCost / yearlySavings;

  const metrics = [
    {
      label: 'Output Voltage',
      value: `${currentResult.voltage.toFixed(1)}V`,
      icon: Zap,
      color: 'blue',
      description: 'System operating voltage'
    },
    {
      label: 'Output Current',
      value: `${currentResult.current.toFixed(1)}A`,
      icon: Battery,
      color: 'green',
      description: 'System operating current'
    },
    {
      label: 'Theoretical Power',
      value: `${currentResult.power.toFixed(0)}W`,
      icon: TrendingUp,
      color: 'yellow',
      description: 'Maximum theoretical power output'
    },
    {
      label: 'Real-World Power',
      value: `${realWorldPower.toFixed(0)}W`,
      icon: Gauge,
      color: 'purple',
      description: `With ${systemEfficiency}% system efficiency`
    }
  ];

  const energyMetrics = [
    {
      label: 'Daily Energy',
      value: `${dailyEnergy.toFixed(1)} kWh`,
      period: 'per day',
      description: `Based on ${peakSunHours}h peak sun`
    },
    {
      label: 'Monthly Energy',
      value: `${monthlyEnergy.toFixed(0)} kWh`,
      period: 'per month',
      description: '30-day average'
    },
    {
      label: 'Yearly Energy',
      value: `${yearlyEnergy.toFixed(0)} kWh`,
      period: 'per year',
      description: '365-day total'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.label}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={cn(
                  'p-3 rounded-lg',
                  metric.color === 'blue' && 'bg-blue-100 dark:bg-blue-900/30',
                  metric.color === 'green' && 'bg-green-100 dark:bg-green-900/30',
                  metric.color === 'yellow' && 'bg-yellow-100 dark:bg-yellow-900/30',
                  metric.color === 'purple' && 'bg-purple-100 dark:bg-purple-900/30'
                )}>
                  <Icon className={cn(
                    'w-6 h-6',
                    metric.color === 'blue' && 'text-blue-600 dark:text-blue-400',
                    metric.color === 'green' && 'text-green-600 dark:text-green-400',
                    metric.color === 'yellow' && 'text-yellow-600 dark:text-yellow-400',
                    metric.color === 'purple' && 'text-purple-600 dark:text-purple-400'
                  )} />
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  {metric.value}
                </p>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {metric.label}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {metric.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Energy Production */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-green-500" />
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
            Energy Production Estimates
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {energyMetrics.map((metric) => (
            <div
              key={metric.label}
              className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
            >
              <div className="text-2xl font-bold text-green-700 dark:text-green-300 mb-1">
                {metric.value}
              </div>
              <div className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">
                {metric.label}
              </div>
              <div className="text-xs text-green-600 dark:text-green-500">
                {metric.description}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>Note:</strong> Energy estimates assume {peakSunHours} peak sun hours per day. 
            Actual production varies by location, season, weather, and system orientation.
          </p>
        </div>
      </div>

      {/* Cost Analysis */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-5 h-5 text-blue-500" />
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
            Cost Analysis (Estimates)
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-lg font-bold text-gray-800 dark:text-white mb-1">
              ${systemCost.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Estimated System Cost
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              At ${costPerWatt}/W installed
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-lg font-bold text-green-600 dark:text-green-400 mb-1">
              ${yearlySavings.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Annual Savings
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              At ${electricityRate}/kWh
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-1">
              {paybackYears.toFixed(1)} years
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Payback Period
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Before incentives
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-lg font-bold text-purple-600 dark:text-purple-400 mb-1">
              {actualEfficiency.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Configuration Efficiency
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Vs. theoretical max
            </div>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            <strong>Disclaimer:</strong> Cost estimates are rough approximations. 
            Actual costs vary significantly by location, installer, equipment, and local incentives. 
            Consult with local solar installers for accurate quotes.
          </p>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-xl shadow-lg p-6 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-blue-500" />
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
            Configuration Summary
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-800 dark:text-white mb-2">System Specifications</h4>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li>• {systemConfig.panels} panels @ {panelSpecs.power}W each</li>
              <li>• Total panel capacity: {theoreticalMaxPower}W</li>
              <li>• Configuration: {activeConfiguration}</li>
              <li>• System efficiency: {systemEfficiency}%</li>
              <li>• Real-world output: {realWorldPower.toFixed(0)}W</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Performance Highlights</h4>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li>• Operating voltage: {currentResult.voltage.toFixed(1)}V</li>
              <li>• Operating current: {currentResult.current.toFixed(1)}A</li>
              <li>• Daily energy: {dailyEnergy.toFixed(1)} kWh</li>
              <li>• Annual energy: {yearlyEnergy.toFixed(0)} kWh</li>
              <li>• Estimated payback: {paybackYears.toFixed(1)} years</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
