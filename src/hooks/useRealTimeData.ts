import { useState, useEffect, useCallback } from 'react';
import { 
  WeatherData, 
  SolarIrradianceData, 
  SolarConditions, 
  LocationData,
  RealTimeEfficiencyFactors 
} from '@/types';

// Hook for weather data
export function useWeatherData(latitude?: number, longitude?: number) {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const fetchWeather = useCallback(async (lat: number, lon: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
      const result = await response.json();
        if (result.success) {
        setData(result.data);
        setLastUpdated(Date.now());
      } else {
        setError(result.error || 'Failed to fetch weather data');
      }
    } catch {
      setError('Network error while fetching weather data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (latitude !== undefined && longitude !== undefined) {
      fetchWeather(latitude, longitude);
    }
  }, [latitude, longitude, fetchWeather]);

  const refresh = useCallback(() => {
    if (latitude !== undefined && longitude !== undefined) {
      fetchWeather(latitude, longitude);
    }
  }, [latitude, longitude, fetchWeather]);

  return { data, loading, error, lastUpdated, refresh };
}

// Hook for solar irradiance data
export function useSolarData(latitude?: number, longitude?: number, source: 'nasa' | 'nrel' = 'nasa') {
  const [data, setData] = useState<SolarIrradianceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const fetchSolarData = useCallback(async (lat: number, lon: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/solar-data?lat=${lat}&lon=${lon}&source=${source}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
        setLastUpdated(Date.now());
      } else {
        setError(result.error || 'Failed to fetch solar data');
      }    } catch {
      setError('Network error while fetching solar data');
    } finally {
      setLoading(false);
    }
  }, [source]);

  useEffect(() => {
    if (latitude !== undefined && longitude !== undefined) {
      fetchSolarData(latitude, longitude);
    }
  }, [latitude, longitude, fetchSolarData]);

  const refresh = useCallback(() => {
    if (latitude !== undefined && longitude !== undefined) {
      fetchSolarData(latitude, longitude);
    }
  }, [latitude, longitude, fetchSolarData]);

  return { data, loading, error, lastUpdated, refresh };
}

// Hook for real-time conditions (combines weather + solar + efficiency)
export function useRealTimeConditions(latitude?: number, longitude?: number) {
  const [data, setData] = useState<SolarConditions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [nextUpdate, setNextUpdate] = useState<number | null>(null);

  const fetchConditions = useCallback(async (lat: number, lon: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/real-time-conditions?lat=${lat}&lon=${lon}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
        setLastUpdated(result.lastUpdated);
        setNextUpdate(result.nextUpdate);
      } else {
        setError(result.error || 'Failed to fetch real-time conditions');
      }    } catch {
      setError('Network error while fetching real-time conditions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (latitude !== undefined && longitude !== undefined) {
      fetchConditions(latitude, longitude);
    }
  }, [latitude, longitude, fetchConditions]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (nextUpdate && latitude !== undefined && longitude !== undefined) {
      const timeUntilNext = nextUpdate - Date.now();
      if (timeUntilNext > 0) {
        const timer = setTimeout(() => {
          fetchConditions(latitude, longitude);
        }, timeUntilNext);
        
        return () => clearTimeout(timer);
      }
    }
  }, [nextUpdate, latitude, longitude, fetchConditions]);

  const refresh = useCallback(() => {
    if (latitude !== undefined && longitude !== undefined) {
      fetchConditions(latitude, longitude);
    }
  }, [latitude, longitude, fetchConditions]);

  return { data, loading, error, lastUpdated, nextUpdate, refresh };
}

// Hook for location search
export function useLocationSearch() {
  const [results, setResults] = useState<LocationData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/location?q=${encodeURIComponent(query)}`);
      const result = await response.json();
      
      if (result.success) {
        setResults(result.data || []);
      } else {
        setError(result.error || 'Failed to search locations');
        setResults([]);
      }    } catch {
      setError('Network error while searching locations');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const reverseGeocode = useCallback(async (latitude: number, longitude: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude, longitude }),
      });
      const result = await response.json();
      
      if (result.success && result.data?.length > 0) {
        return result.data[0];
      } else {
        throw new Error(result.error || 'Failed to reverse geocode');
      }
    } catch (err) {
      setError('Network error during reverse geocoding');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { results, loading, error, search, reverseGeocode };
}

// Hook for calculating real-time efficiency factors
export function useEfficiencyFactors(
  weatherData: WeatherData | null,
  solarData: SolarIrradianceData | null,
  systemEfficiency: number = 85
): RealTimeEfficiencyFactors | null {
  return useState(() => {
    if (!weatherData || !solarData) return null;

    const baseEfficiency = systemEfficiency;
    
    // Temperature derating
    const temperatureCoeff = -0.4; // %/°C
    const temperatureDelta = weatherData.temperature - 25;
    const temperatureDerating = Math.max(0.5, 1 + (temperatureCoeff * temperatureDelta) / 100);
    
    // Irradiance derating
    const irradianceDerating = Math.min(1, solarData.ghi / 1000);
    
    // Cloud derating
    const cloudDerating = Math.max(0.1, 1 - (weatherData.cloudCover / 100) * 0.8);
    
    // Seasonal factor
    const seasonalFactor = Math.max(0.3, 1 - Math.abs(solarData.solarZenithAngle - 30) / 90);
    
    // Time of day factor
    const timeOfDayFactor = solarData.solarZenithAngle < 85 ? 
      Math.cos(solarData.solarZenithAngle * Math.PI / 180) : 0;
    
    // Combined efficiency
    const realTimeEfficiency = baseEfficiency * temperatureDerating * irradianceDerating * 
      cloudDerating * seasonalFactor * timeOfDayFactor;
    
    // Projected daily output
    const peakSunHours = (solarData.ghi / 1000) * (timeOfDayFactor * 8);
    const projectedDailyOutput = peakSunHours * (realTimeEfficiency / 100);
    
    return {
      baseEfficiency,
      temperatureDerating,
      irradianceDerating,
      cloudDerating,
      seasonalFactor,
      timeOfDayFactor,
      realTimeEfficiency: Math.max(0, realTimeEfficiency),
      projectedDailyOutput: Math.max(0, projectedDailyOutput),
    };
  })[0];
}

// Hook for user's current location
export function useCurrentLocation() {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLoading(false);
      },
      (err) => {
        setError(`Location error: ${err.message}`);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  return { location, loading, error, getCurrentLocation };
}
