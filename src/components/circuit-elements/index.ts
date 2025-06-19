// Circuit Elements Export Index

export * from './types';
export { BaseCircuitElement } from './BaseCircuitElement';
export { PVModule, type PVModuleProperties } from './PVModule';
export { Inverter, type InverterProperties } from './Inverter';
export { Switch, type SwitchProperties } from './Switch';
export { LightBulb, type LightBulbProperties } from './LightBulb';

// Element factory function
import { CircuitElement, Position, CircuitElementData } from './types';
import { PVModule } from './PVModule';
import { Inverter } from './Inverter';
import { Switch } from './Switch';
import { LightBulb } from './LightBulb';
import { PanelPreset } from '@/types';

export interface ElementCreationOptions {
  pvModule?: {
    preset: PanelPreset;
    irradiance?: number;
    temperature?: number;
  };
  inverter?: {
    type?: 'string' | 'central' | 'micro' | 'power-optimizer';
    maxPower?: number;
  };
  switch?: {
    type?: 'manual' | 'automatic' | 'breaker' | 'relay';
    isOpen?: boolean;
  };
  lightBulb?: {
    ratedPower?: number;
    ratedVoltage?: number;
    loadType?: 'resistive' | 'led' | 'fluorescent';
  };
}

export function createCircuitElement(
  type: string,
  id: string,
  position: Position,
  options?: ElementCreationOptions
): CircuitElement | null {
  switch (type) {
    case 'pv-module':
      if (!options?.pvModule?.preset) return null;
      return new PVModule(
        id,
        position,
        options.pvModule.preset,
        options.pvModule.irradiance,
        options.pvModule.temperature
      );
      
    case 'inverter':
      return new Inverter(
        id,
        position,
        options?.inverter?.type,
        options?.inverter?.maxPower
      );
      
    case 'switch':
      return new Switch(
        id,
        position,
        options?.switch?.type,
        options?.switch?.isOpen
      );
      
    case 'light-bulb':
      return new LightBulb(
        id,
        position,
        options?.lightBulb?.ratedPower,
        options?.lightBulb?.ratedVoltage,
        options?.lightBulb?.loadType
      );
      
    default:
      return null;
  }
}

export function createElement(data: CircuitElementData): CircuitElement | null {
  const element = createCircuitElement(data.type, data.id, data.position);
  if (element) {
    element.rotation = data.rotation;
    // Apply custom properties if needed
    Object.assign(element.properties, data.properties);
  }
  return element;
}

// Available element types
export const ELEMENT_TYPES = [
  {
    id: 'pv-module',
    name: 'PV Module',
    description: 'Solar photovoltaic panel',
    category: 'source'
  },
  {
    id: 'inverter',
    name: 'Inverter',
    description: 'DC to AC power converter',
    category: 'converter'
  },
  {
    id: 'switch',
    name: 'Switch',
    description: 'Circuit breaker or switch',
    category: 'control'
  },
  {
    id: 'light-bulb',
    name: 'Light Bulb',
    description: 'Resistive load',
    category: 'load'
  }
] as const;
