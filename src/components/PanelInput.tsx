'use client';

import { Settings, Info, Lightbulb } from 'lucide-react';
import { PanelSpecifications, SystemConfiguration } from '@/types';
import { PANEL_PRESETS } from '@/constants/panels';

interface PanelInputProps {
  panelSpecs: PanelSpecifications;
  systemConfig: SystemConfiguration;
  onPanelSpecsChange: (specs: PanelSpecifications) => void;
  onSystemConfigChange: (config: SystemConfiguration) => void;
}

export default function PanelInput({
  panelSpecs,
  systemConfig,
  onPanelSpecsChange,
  onSystemConfigChange
}: PanelInputProps) {
  const handlePresetChange = (presetId: string) => {
    if (presetId === 'custom') {
      // Reset to default values for custom entry
      onPanelSpecsChange({
        voltage: 0,
        current: 0,
        power: 0,
        voc: 0,
        isc: 0,
        maxSeriesFuse: 0,
        maxSystemVoltage: 0
      });
    } else {
      const preset = PANEL_PRESETS.find(p => p.id === presetId);
      if (preset) {
        onPanelSpecsChange(preset);
      }
    }
  };

  const handleSpecChange = (field: keyof PanelSpecifications, value: number) => {
    onPanelSpecsChange({
      ...panelSpecs,
      [field]: value
    });
  };

  const handleConfigChange = (field: keyof SystemConfiguration, value: number) => {
    onSystemConfigChange({
      ...systemConfig,
      [field]: value
    });
  };

  return (
    <div className="space-y-6">
      {/* Panel Presets */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-blue-500" />
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            Panel Specifications
          </h2>
        </div>

        {/* Preset Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Quick Panel Presets (Auto-fills all values):
          </label>          <select
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            onChange={(e) => handlePresetChange(e.target.value)}
            defaultValue=""
            aria-label="Select panel preset"
          >
            <option value="">Select a preset or enter custom values below</option>
            {PANEL_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name} (Vmp: {preset.voltage}V, Imp: {preset.current}A)
              </option>
            ))}
            <option value="custom">Custom Configuration (Clear all fields)</option>
          </select>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 italic">
            💡 Tip: If your panel matches one of these presets, select it to auto-fill all fields.
          </p>
        </div>

        {/* Required Fields */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
          <h3 className="flex items-center gap-2 font-medium text-blue-800 dark:text-blue-200 mb-2">
            <span className="text-red-500">*</span>
            Required for Power Calculations
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Enter your panel&apos;s operating values (Vmp & Imp) - these determine actual power output
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Voltage per Panel (Vmp) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              placeholder="e.g., 40.3"
              value={panelSpecs.voltage || ''}
              onChange={(e) => handleSpecChange('voltage', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Enter &quot;Voltage at Maximum Power (Vmp)&quot; from your panel datasheet
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Current per Panel (Imp) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              placeholder="e.g., 14.91"
              value={panelSpecs.current || ''}
              onChange={(e) => handleSpecChange('current', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Enter &quot;Current at Maximum Power (Imp)&quot; from your panel datasheet
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Number of Panels <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              placeholder="e.g., 4"
              value={systemConfig.panels || ''}
              onChange={(e) => handleConfigChange('panels', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Total number of panels in your solar array
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              System Efficiency (%)
            </label>
            <input
              type="number"
              step="0.1"
              min="1"
              max="100"
              placeholder="e.g., 85"
              value={systemConfig.efficiency || ''}
              onChange={(e) => handleConfigChange('efficiency', parseFloat(e.target.value) || 85)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Account for real-world losses (temperature, shading, inverter losses)
            </p>
          </div>
        </div>
      </div>

      {/* Safety & System Design Values */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-5 h-5 text-green-500" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Safety & System Design Values
          </h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Optional but recommended for safety validation and proper system design.
        </p>

        {/* Reference Guide */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-yellow-500" />
            <h4 className="font-medium text-gray-800 dark:text-white">
              Where to Find These Values?
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong className="text-blue-600 dark:text-blue-400">On Panel Label:</strong>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mt-1">
                <li>Pmax = Power (e.g., 600W)</li>
                <li>Vmp = Operating Voltage</li>
                <li>Imp = Operating Current</li>
                <li>Voc = Open Circuit Voltage</li>
                <li>Isc = Short Circuit Current</li>
              </ul>
            </div>
            <div>
              <strong className="text-blue-600 dark:text-blue-400">Panel Datasheet:</strong>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mt-1">
                <li>Maximum System Voltage</li>
                <li>Maximum Series Fuse Rating</li>
                <li>Temperature coefficients</li>
                <li>Mechanical specifications</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Open Circuit Voltage (Voc)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              placeholder="e.g., 48.4"
              value={panelSpecs.voc || ''}
              onChange={(e) => handleSpecChange('voc', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              <strong>Find on panel:</strong> &quot;Voc&quot; - used for system voltage limits
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Short Circuit Current (Isc)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              placeholder="e.g., 15.80"
              value={panelSpecs.isc || ''}
              onChange={(e) => handleSpecChange('isc', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              <strong>Find on panel:</strong> &quot;Isc&quot; - used for fuse sizing
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Max Series Fuse (A)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              placeholder="e.g., 35"
              value={panelSpecs.maxSeriesFuse || ''}
              onChange={(e) => handleSpecChange('maxSeriesFuse', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              <strong>Find in datasheet:</strong> &quot;Maximum Series Fuse Rating&quot;
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Max System Voltage (V)
            </label>
            <input
              type="number"
              min="0"
              placeholder="e.g., 1500"
              value={panelSpecs.maxSystemVoltage || ''}
              onChange={(e) => handleSpecChange('maxSystemVoltage', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              <strong>Find in datasheet:</strong> Often 600V, 1000V, or 1500V
            </p>
          </div>
        </div>
      </div>

      {/* Combined Configuration Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          Combined Configuration Settings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Series Groups
            </label>
            <input
              type="number"
              min="1"
              placeholder="e.g., 2"
              value={systemConfig.seriesGroups || ''}
              onChange={(e) => handleConfigChange('seriesGroups', parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Number of parallel series strings
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Panels per Series Group
            </label>
            <input
              type="number"
              min="1"
              placeholder="e.g., 2"
              value={systemConfig.panelsPerGroup || ''}
              onChange={(e) => handleConfigChange('panelsPerGroup', parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Number of panels connected in series within each string
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
