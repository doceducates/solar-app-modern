'use client';

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { COUNTRIES } from '@/constants/countries';
import { Globe } from 'lucide-react';

interface CountrySelectorProps {
  selectedCountry: string;
  onCountryChange: (countryId: string) => void;
  className?: string;
}

export function CountrySelector({ selectedCountry, onCountryChange, className }: CountrySelectorProps) {
  const selectedCountryData = COUNTRIES.find(c => c.id === selectedCountry);

  return (
    <div className={className}>
      <Label htmlFor="country-select" className="flex items-center gap-2 text-sm font-medium">
        <Globe className="h-4 w-4" />
        Country & Currency
      </Label>
      <Select value={selectedCountry} onValueChange={onCountryChange}>
        <SelectTrigger id="country-select" className="mt-1">
          <SelectValue placeholder="Select your country">
            {selectedCountryData && (
              <span className="flex items-center gap-2">
                <span className="text-lg">{selectedCountryData.currency.symbol}</span>
                <span>{selectedCountryData.name}</span>
                <span className="text-muted-foreground">({selectedCountryData.currency.code})</span>
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {COUNTRIES.map((country) => (
            <SelectItem key={country.id} value={country.id}>
              <div className="flex items-center gap-3">
                <span className="text-lg min-w-[24px]">{country.currency.symbol}</span>
                <div className="flex flex-col">
                  <span className="font-medium">{country.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {country.currency.name} ({country.currency.code})
                  </span>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {selectedCountryData && (
        <div className="mt-2 p-3 bg-muted/50 rounded-lg">
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>Panel cost:</span>
              <span>{selectedCountryData.currency.symbol}{selectedCountryData.pricing.panelCostPerWatt}/W</span>
            </div>
            <div className="flex justify-between">
              <span>Installation:</span>
              <span>{selectedCountryData.currency.symbol}{selectedCountryData.pricing.installationCostPerWatt}/W</span>
            </div>
            <div className="flex justify-between">
              <span>Electricity rate:</span>
              <span>{selectedCountryData.currency.symbol}{selectedCountryData.pricing.electricityRate}/kWh</span>
            </div>
            {selectedCountryData.incentives && selectedCountryData.incentives.length > 0 && (
              <div className="mt-2 pt-2 border-t border-muted-foreground/20">
                <div className="font-medium text-green-600 dark:text-green-400">Available Incentives:</div>
                {selectedCountryData.incentives.map((incentive, index) => (
                  <div key={index} className="text-xs">
                    • {incentive.name}: {incentive.value}
                    {incentive.type === 'tax_credit' || incentive.type === 'rebate' ? '%' : ` ${selectedCountryData.currency.code}/kWh`}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
