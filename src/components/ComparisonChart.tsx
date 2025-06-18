'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { ConfigurationResults } from '@/types';
import { useState } from 'react';
import { BarChart3, TrendingUp, Target, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ComparisonChartProps {
  results: ConfigurationResults;
}

type ChartType = 'bar' | 'line' | 'radar';

export default function ComparisonChart({ results }: ComparisonChartProps) {
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [viewMode, setViewMode] = useState<'power' | 'voltage' | 'current' | 'all'>('power');

  // Prepare data for charts
  const chartData = [
    {
      name: 'Series',
      voltage: results.series.voltage,
      current: results.series.current,
      power: results.series.power,
      efficiency: (results.series.power / Math.max(results.series.power, results.parallel.power, results.combined.power)) * 100
    },
    {
      name: 'Parallel',
      voltage: results.parallel.voltage,
      current: results.parallel.current,
      power: results.parallel.power,
      efficiency: (results.parallel.power / Math.max(results.series.power, results.parallel.power, results.combined.power)) * 100
    },
    {
      name: 'Combined',
      voltage: results.combined.voltage,
      current: results.combined.current,
      power: results.combined.power,
      efficiency: (results.combined.power / Math.max(results.series.power, results.parallel.power, results.combined.power)) * 100
    }
  ];

  // Radar chart data
  const radarData = [
    {
      metric: 'Voltage',
      Series: (results.series.voltage / Math.max(results.series.voltage, results.parallel.voltage, results.combined.voltage)) * 100,
      Parallel: (results.parallel.voltage / Math.max(results.series.voltage, results.parallel.voltage, results.combined.voltage)) * 100,
      Combined: (results.combined.voltage / Math.max(results.series.voltage, results.parallel.voltage, results.combined.voltage)) * 100
    },
    {
      metric: 'Current',
      Series: (results.series.current / Math.max(results.series.current, results.parallel.current, results.combined.current)) * 100,
      Parallel: (results.parallel.current / Math.max(results.series.current, results.parallel.current, results.combined.current)) * 100,
      Combined: (results.combined.current / Math.max(results.series.current, results.parallel.current, results.combined.current)) * 100
    },
    {
      metric: 'Power',
      Series: (results.series.power / Math.max(results.series.power, results.parallel.power, results.combined.power)) * 100,
      Parallel: (results.parallel.power / Math.max(results.series.power, results.parallel.power, results.combined.power)) * 100,
      Combined: (results.combined.power / Math.max(results.series.power, results.parallel.power, results.combined.power)) * 100
    }
  ];

  const chartTypes = [
    { id: 'bar' as const, label: 'Bar Chart', icon: BarChart3 },
    { id: 'line' as const, label: 'Line Chart', icon: TrendingUp },
    { id: 'radar' as const, label: 'Radar Chart', icon: Target }
  ];

  const viewModes = [
    { id: 'power' as const, label: 'Power (W)', color: '#8884d8' },
    { id: 'voltage' as const, label: 'Voltage (V)', color: '#82ca9d' },
    { id: 'current' as const, label: 'Current (A)', color: '#ffc658' },
    { id: 'all' as const, label: 'All Metrics', color: '#ff7300' }
  ];
  interface TooltipProps {
    active?: boolean;
    payload?: Array<{
      dataKey: string;
      value: number;
      color: string;
    }>;
    label?: string;
  }

  const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800 dark:text-white">{`${label} Configuration`}</p>
          {payload.map((entry, index: number) => (
            <p key={index} className={cn(
              'text-sm',
              entry.color === '#8884d8' && 'text-blue-600',
              entry.color === '#82ca9d' && 'text-green-600',
              entry.color === '#ffc658' && 'text-yellow-600',
              entry.color === '#ff7300' && 'text-orange-600'
            )}>
              {`${entry.dataKey}: ${entry.value.toFixed(1)}${
                entry.dataKey === 'voltage' ? 'V' : 
                entry.dataKey === 'current' ? 'A' : 
                entry.dataKey === 'power' ? 'W' : 
                entry.dataKey === 'efficiency' ? '%' : ''
              }`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="name" 
                className="text-sm text-gray-600 dark:text-gray-400"
              />
              <YAxis className="text-sm text-gray-600 dark:text-gray-400" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {(viewMode === 'power' || viewMode === 'all') && (
                <Bar dataKey="power" fill="#8884d8" name="Power (W)" />
              )}
              {(viewMode === 'voltage' || viewMode === 'all') && (
                <Bar dataKey="voltage" fill="#82ca9d" name="Voltage (V)" />
              )}
              {(viewMode === 'current' || viewMode === 'all') && (
                <Bar dataKey="current" fill="#ffc658" name="Current (A)" />
              )}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="name" 
                className="text-sm text-gray-600 dark:text-gray-400"
              />
              <YAxis className="text-sm text-gray-600 dark:text-gray-400" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {(viewMode === 'power' || viewMode === 'all') && (
                <Line 
                  type="monotone" 
                  dataKey="power" 
                  stroke="#8884d8" 
                  strokeWidth={3}
                  dot={{ r: 6 }}
                  name="Power (W)"
                />
              )}
              {(viewMode === 'voltage' || viewMode === 'all') && (
                <Line 
                  type="monotone" 
                  dataKey="voltage" 
                  stroke="#82ca9d" 
                  strokeWidth={3}
                  dot={{ r: 6 }}
                  name="Voltage (V)"
                />
              )}
              {(viewMode === 'current' || viewMode === 'all') && (
                <Line 
                  type="monotone" 
                  dataKey="current" 
                  stroke="#ffc658" 
                  strokeWidth={3}
                  dot={{ r: 6 }}
                  name="Current (A)"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'radar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" className="text-sm text-gray-600 dark:text-gray-400" />
              <PolarRadiusAxis 
                angle={30} 
                domain={[0, 100]} 
                className="text-xs text-gray-500 dark:text-gray-500"
              />
              <Radar
                name="Series"
                dataKey="Series"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.1}
                strokeWidth={2}
              />
              <Radar
                name="Parallel"
                dataKey="Parallel"
                stroke="#82ca9d"
                fill="#82ca9d"
                fillOpacity={0.1}
                strokeWidth={2}
              />
              <Radar
                name="Combined"
                dataKey="Combined"
                stroke="#ffc658"
                fill="#ffc658"
                fillOpacity={0.1}
                strokeWidth={2}
              />
              <Legend />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Chart Type and View Mode Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        {/* Chart Type Selector */}
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Chart Type:</span>
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {chartTypes.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => setChartType(type.id)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all',
                    chartType === type.id
                      ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{type.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* View Mode Selector (hide for radar chart) */}
        {chartType !== 'radar' && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">View:</span>
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              {viewModes.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setViewMode(mode.id)}
                  className={cn(
                    'px-3 py-2 rounded-md text-sm font-medium transition-all',
                    viewMode === mode.id
                      ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  )}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Chart Container */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        {renderChart()}
      </div>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        {[
          { config: 'series', label: 'Series', color: 'blue' },
          { config: 'parallel', label: 'Parallel', color: 'green' },
          { config: 'combined', label: 'Combined', color: 'yellow' }
        ].map((item) => {
          const result = results[item.config as keyof ConfigurationResults];
          return (
            <div
              key={item.config}
              className={cn(
                'p-4 rounded-lg border',
                item.color === 'blue' && 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
                item.color === 'green' && 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
                item.color === 'yellow' && 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
              )}
            >
              <h4 className={cn(
                'font-semibold mb-2',
                item.color === 'blue' && 'text-blue-800 dark:text-blue-200',
                item.color === 'green' && 'text-green-800 dark:text-green-200',
                item.color === 'yellow' && 'text-yellow-800 dark:text-yellow-200'
              )}>
                {item.label} Configuration
              </h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Voltage:</span>
                  <span className="font-medium">{result.voltage.toFixed(1)}V</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Current:</span>
                  <span className="font-medium">{result.current.toFixed(1)}A</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Power:</span>
                  <span className="font-medium">{result.power.toFixed(0)}W</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
