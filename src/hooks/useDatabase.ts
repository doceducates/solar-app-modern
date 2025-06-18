import { useState, useEffect, useCallback } from 'react';
import { PanelPreset, PanelSpecifications, SystemConfiguration, ConfigurationResults, SafetyChecks } from '@/types';
import { CountryPricing } from '@/constants/countries';

// Custom hooks for database operations

export function useCountries() {
  const [countries, setCountries] = useState<CountryPricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCountries = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/countries');
      if (!response.ok) {
        throw new Error('Failed to fetch countries');
      }
      const data = await response.json();
      setCountries(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setCountries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  const getCountryById = useCallback((id: string) => {
    return countries.find(country => country.id === id) || null;
  }, [countries]);

  return {
    countries,
    loading,
    error,
    refetch: fetchCountries,
    getCountryById
  };
}

export function usePanelPresets() {
  const [presets, setPresets] = useState<PanelPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPresets = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/panel-presets');
      if (!response.ok) {
        throw new Error('Failed to fetch panel presets');
      }
      const data = await response.json();
      setPresets(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setPresets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPresets();
  }, [fetchPresets]);

  const addPreset = useCallback(async (preset: Omit<PanelPreset, 'id'>) => {
    try {
      const response = await fetch('/api/panel-presets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ preset }),
      });

      if (!response.ok) {
        throw new Error('Failed to add preset');
      }

      const newPreset = await response.json();
      setPresets(prev => [...prev, newPreset]);
      return newPreset;
    } catch (err) {
      console.error('Failed to add preset:', err);
      throw err;
    }
  }, []);

  const deletePreset = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/panel-presets?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete preset');
      }

      setPresets(prev => prev.filter(preset => preset.id !== id));
      return true;
    } catch (err) {
      console.error('Failed to delete preset:', err);
      throw err;
    }
  }, []);

  const getPresetById = useCallback((id: string) => {
    return presets.find(preset => preset.id === id) || null;
  }, [presets]);

  const getPresetByName = useCallback((name: string) => {
    return presets.find(preset => preset.name === name) || null;
  }, [presets]);

  return {
    presets,
    loading,
    error,
    refetch: fetchPresets,
    addPreset,
    deletePreset,
    getPresetById,
    getPresetByName
  };
}

interface CalculationHistoryItem {
  id: string;
  panel_specs: string;
  system_config: string;
  results: string;
  created_at: string;
}

interface DatabaseStatus {
  status?: string;
  countries: number;
  presets: number;
  needsSeeding?: boolean;
  success?: boolean;
  message?: string;
  countriesSeeded?: number;
  presetsSeeded?: number;
}

export function useCalculationHistory() {
  const [history, setHistory] = useState<CalculationHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async (limit: number = 50) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/calculations?limit=${limit}`);
      if (!response.ok) {
        throw new Error('Failed to fetch calculation history');
      }
      const data = await response.json();
      setHistory(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveCalculation = useCallback(async (data: {
    panelSpecs: PanelSpecifications;
    systemConfig: SystemConfiguration;
    results: ConfigurationResults;
    safetyChecks?: SafetyChecks;
    costAnalysis?: object;
  }) => {
    try {
      const response = await fetch('/api/calculations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to save calculation');
      }

      const result = await response.json();
      // Optionally refresh the history
      fetchHistory();
      return result;
    } catch (err) {
      console.error('Failed to save calculation:', err);
      throw err;
    }
  }, [fetchHistory]);

  return {
    history,
    loading,
    error,
    fetchHistory,
    saveCalculation
  };
}

export function useDatabaseSeeding() {
  const [seeding, setSeeding] = useState(false);
  const [status, setStatus] = useState<DatabaseStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/database/seed');
      if (!response.ok) {
        throw new Error('Failed to check database status');
      }
      const data = await response.json();
      setStatus(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  const seedDatabase = useCallback(async () => {
    try {
      setSeeding(true);
      const response = await fetch('/api/database/seed', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to seed database');
      }

      const result = await response.json();
      setStatus(result);
      setError(null);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setSeeding(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  return {
    seeding,
    status,
    error,
    checkStatus,
    seedDatabase
  };
}
