import React from 'react';
import { PanelInput } from '../PanelInput';
import { CountrySelector } from '../CountrySelector';
import { PanelSpecifications, SystemConfiguration } from '@/types';

interface ConfigurationSectionProps {
  selectedCountry: string;
  onCountryChange: (country: string) => void;
  panelSpecs: PanelSpecifications;
  systemConfig: SystemConfiguration;
  onPanelSpecsChange: (specs: PanelSpecifications) => void;
  onSystemConfigChange: (config: SystemConfiguration) => void;
}

export function ConfigurationSection({
  selectedCountry,
  onCountryChange,
  panelSpecs,
  systemConfig,
  onPanelSpecsChange,
  onSystemConfigChange
}: ConfigurationSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          System Configuration
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Configure your solar panel specifications and system parameters.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CountrySelector
          selectedCountry={selectedCountry}
          onCountryChange={onCountryChange}
        />
        
        <PanelInput
          panelSpecs={panelSpecs}
          systemConfig={systemConfig}
          onPanelSpecsChange={onPanelSpecsChange}
          onSystemConfigChange={onSystemConfigChange}
          selectedCountry={selectedCountry}
        />
      </div>
    </div>
  );
}
