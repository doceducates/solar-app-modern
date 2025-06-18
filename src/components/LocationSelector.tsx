'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, Loader2, Navigation, Sun, CloudRain, Thermometer } from 'lucide-react';
import { LocationData, SolarConditions } from '@/types';
import { useLocationSearch, useCurrentLocation, useRealTimeConditions } from '@/hooks/useRealTimeData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface LocationSelectorProps {
  onLocationSelect: (location: LocationData, conditions?: SolarConditions) => void;
  selectedLocation?: LocationData | null;
  showRealTimeData?: boolean;
}

export default function LocationSelector({ 
  onLocationSelect, 
  selectedLocation, 
  showRealTimeData = true 
}: LocationSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  
  const { results, loading: searchLoading, search } = useLocationSearch();
  const { location: userLocation, loading: locationLoading, getCurrentLocation } = useCurrentLocation();
  const { 
    data: realTimeData, 
    loading: conditionsLoading, 
    refresh: refreshConditions 
  } = useRealTimeConditions(
    selectedLocation?.latitude, 
    selectedLocation?.longitude
  );

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        search(searchQuery);
        setShowResults(true);
      } else {
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, search]);  const handleLocationSelect = useCallback(async (location: LocationData) => {
    setSearchQuery(`${location.city}, ${location.country}`);
    setShowResults(false);
    
    // Pass location and real-time data to parent
    onLocationSelect(location, realTimeData || undefined);
  }, [onLocationSelect, realTimeData]);

  // Auto-select user location when available
  useEffect(() => {
    if (userLocation && !selectedLocation) {
      handleLocationSelect({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        city: 'Current Location',
        country: '',
        timezone: '',
      });
    }
  }, [userLocation, selectedLocation, handleLocationSelect]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!showResults || results.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        event.preventDefault();
        if (selectedIndex >= 0) {
          handleLocationSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowResults(false);
        setSelectedIndex(-1);
        break;
    }
  };

  return (
    <div className="space-y-4">
      {/* Location Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-500" />
            Location Selection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative" ref={searchRef}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search for your city or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-10"
              />
              {searchLoading && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 animate-spin" />
              )}
            </div>

            {/* Search Results Dropdown */}
            {showResults && results.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {results.map((location, index) => (
                  <button
                    key={`${location.latitude}-${location.longitude}`}
                    onClick={() => handleLocationSelect(location)}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 ${
                      index === selectedIndex ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {location.city}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {location.country} • {location.latitude.toFixed(2)}, {location.longitude.toFixed(2)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Current Location Button */}
          <div className="flex gap-2">
            <Button
              onClick={getCurrentLocation}
              disabled={locationLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              {locationLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Navigation className="w-4 h-4" />
              )}
              Use Current Location
            </Button>

            {selectedLocation && (
              <Button
                onClick={refreshConditions}
                disabled={conditionsLoading}
                variant="outline"
                className="flex items-center gap-2"
              >
                {conditionsLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sun className="w-4 h-4" />
                )}
                Refresh Data
              </Button>
            )}
          </div>

          {/* Selected Location Info */}
          {selectedLocation && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-800 dark:text-blue-200">
                  Selected Location
                </span>
              </div>
              <div className="text-sm">
                <div className="font-medium">{selectedLocation.city}, {selectedLocation.country}</div>
                <div className="text-gray-600 dark:text-gray-400">
                  Coordinates: {selectedLocation.latitude.toFixed(4)}, {selectedLocation.longitude.toFixed(4)}
                </div>
                {selectedLocation.timezone && (
                  <div className="text-gray-600 dark:text-gray-400">
                    Timezone: {selectedLocation.timezone}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Real-Time Environmental Conditions */}
      {showRealTimeData && selectedLocation && realTimeData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sun className="w-5 h-5 text-orange-500" />
              Current Solar Conditions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Weather Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <Thermometer className="w-6 h-6 text-orange-500 mx-auto mb-1" />
                <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                  {realTimeData.weather.temperature.toFixed(1)}°C
                </div>
                <div className="text-xs text-orange-600 dark:text-orange-400">Temperature</div>
              </div>

              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <CloudRain className="w-6 h-6 text-blue-500 mx-auto mb-1" />
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {realTimeData.weather.cloudCover}%
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400">Cloud Cover</div>
              </div>

              <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <Sun className="w-6 h-6 text-yellow-500 mx-auto mb-1" />
                <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                  {realTimeData.irradiance.ghi.toFixed(0)}
                </div>
                <div className="text-xs text-yellow-600 dark:text-yellow-400">Solar Irradiance (W/m²)</div>
              </div>

              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {(realTimeData.efficiency.overallEfficiency * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-green-600 dark:text-green-400">Current Efficiency</div>
              </div>
            </div>

            {/* Efficiency Breakdown */}
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 dark:text-white">Efficiency Factors:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span>Temperature Factor:</span>
                  <span className="font-medium">{(realTimeData.efficiency.temperatureFactor * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Irradiance Factor:</span>
                  <span className="font-medium">{(realTimeData.efficiency.irradianceFactor * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Weather Factor:</span>
                  <span className="font-medium">{(realTimeData.efficiency.weatherFactor * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className={`p-3 rounded-lg border ${
              realTimeData.recommendations.isOptimal 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
            }`}>
              <div className="font-medium mb-2">
                {realTimeData.recommendations.message}
              </div>
              {realTimeData.recommendations.improvements.length > 0 && (
                <ul className="text-sm space-y-1">
                  {realTimeData.recommendations.improvements.map((improvement, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-current rounded-full flex-shrink-0" />
                      {improvement}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Data Source and Update Info */}
            <div className="text-xs text-gray-500 dark:text-gray-400 border-t pt-2">
              <div>Data source: {realTimeData.irradiance.dataSource.toUpperCase()}</div>
              <div>Last updated: {new Date(realTimeData.weather.timestamp).toLocaleString()}</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State for Real-Time Data */}
      {showRealTimeData && selectedLocation && conditionsLoading && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              <span className="text-gray-600 dark:text-gray-400">
                Loading real-time solar conditions...
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
