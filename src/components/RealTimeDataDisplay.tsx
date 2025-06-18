'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Thermometer, 
  Sun, 
  Cloud, 
  Wind, 
  Eye, 
  Activity,
  RefreshCw,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useRealTimeConditions, useLocationSearch, useCurrentLocation } from '@/hooks/useRealTimeData';
import { LocationData } from '@/types';

interface RealTimeDataDisplayProps {
  onEfficiencyUpdate?: (efficiency: number) => void;
  systemSize?: number; // kW
}

export default function RealTimeDataDisplay({ 
  onEfficiencyUpdate, 
  systemSize = 1 
}: RealTimeDataDisplayProps) {
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [locationQuery, setLocationQuery] = useState('');
  const [showLocationResults, setShowLocationResults] = useState(false);

  const { location: currentLocation, getCurrentLocation, loading: locationLoading } = useCurrentLocation();
  const { results: locationResults, search: searchLocations, loading: searchLoading } = useLocationSearch();
  const { 
    data: conditions, 
    loading: conditionsLoading, 
    error: conditionsError,
    lastUpdated,
    refresh: refreshConditions 
  } = useRealTimeConditions(
    selectedLocation?.latitude || currentLocation?.latitude,
    selectedLocation?.longitude || currentLocation?.longitude
  );

  useEffect(() => {
    if (locationQuery.trim().length >= 2) {
      searchLocations(locationQuery);
      setShowLocationResults(true);
    } else {
      setShowLocationResults(false);
    }
  }, [locationQuery, searchLocations]);

  useEffect(() => {
    if (conditions && onEfficiencyUpdate) {
      onEfficiencyUpdate(conditions.efficiency.overallEfficiency * 100);
    }
  }, [conditions, onEfficiencyUpdate]);

  const handleLocationSelect = (location: LocationData) => {
    setSelectedLocation(location);
    setLocationQuery(`${location.city}, ${location.country}`);
    setShowLocationResults(false);
  };

  const handleUseCurrentLocation = () => {
    getCurrentLocation();
    setSelectedLocation(null);
    setLocationQuery('Current Location');
  };

  const formatLastUpdated = (timestamp: number | null) => {
    if (!timestamp) return 'Never';
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const getConditionIcon = (isOptimal: boolean) => {
    return isOptimal ? (
      <CheckCircle className="w-5 h-5 text-green-500" />
    ) : (
      <AlertTriangle className="w-5 h-5 text-yellow-500" />
    );
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 0.8) return 'text-green-600 dark:text-green-400';
    if (efficiency >= 0.6) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="space-y-6">
      {/* Location Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-500" />
            Location for Real-Time Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Label htmlFor="location-search">Search Location</Label>
              <Input
                id="location-search"
                type="text"
                placeholder="Enter city name..."
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                className="mt-1"
              />
              
              {showLocationResults && locationResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {locationResults.map((location, index) => (
                    <button
                      key={index}
                      onClick={() => handleLocationSelect(location)}
                      className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-600 last:border-b-0"
                    >
                      <div className="font-medium">{location.city}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {location.country} • {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <Button 
              onClick={handleUseCurrentLocation}
              disabled={locationLoading}
              variant="outline"
              className="mt-6"
            >
              {locationLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <MapPin className="w-4 h-4" />
              )}
              Use My Location
            </Button>
          </div>

          {searchLoading && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Searching locations...
            </div>
          )}

          {selectedLocation && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="font-medium text-blue-800 dark:text-blue-200">
                Selected: {selectedLocation.city}, {selectedLocation.country}
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-300">
                Coordinates: {selectedLocation.latitude.toFixed(4)}, {selectedLocation.longitude.toFixed(4)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Real-Time Conditions */}
      {(selectedLocation || currentLocation) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-500" />
                Real-Time Solar Conditions
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Updated: {formatLastUpdated(lastUpdated)}
                </span>
                <Button
                  onClick={refreshConditions}
                  disabled={conditionsLoading}
                  variant="outline"
                  size="sm"
                >
                  {conditionsLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {conditionsError ? (
              <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Unable to fetch real-time data: {conditionsError}
                </p>
                <Button onClick={refreshConditions} variant="outline">
                  Try Again
                </Button>
              </div>
            ) : conditionsLoading ? (
              <div className="text-center py-8">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Fetching real-time solar conditions...
                </p>
              </div>
            ) : conditions ? (
              <div className="space-y-6">
                {/* Current Conditions Summary */}
                <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getConditionIcon(conditions.recommendations.isOptimal)}
                      <h3 className="font-semibold text-lg">
                        Overall Conditions
                      </h3>
                    </div>
                    <Badge 
                      variant={conditions.recommendations.isOptimal ? "default" : "secondary"}
                      className={conditions.recommendations.isOptimal ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"}
                    >
                      {conditions.recommendations.isOptimal ? 'Optimal' : 'Moderate'}
                    </Badge>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-3">
                    {conditions.recommendations.message}
                  </p>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Tips:</strong>
                    <ul className="list-disc list-inside mt-1">
                      {conditions.recommendations.improvements.map((tip, index) => (
                        <li key={index}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Weather Data */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
                    <Thermometer className="w-8 h-8 text-red-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {conditions.weather.temperature.toFixed(1)}°C
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Temperature
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
                    <Sun className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {conditions.irradiance.ghi.toFixed(0)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Solar Irradiance (W/m²)
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
                    <Cloud className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {conditions.weather.cloudCover}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Cloud Cover
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
                    <Wind className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {conditions.weather.windSpeed.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Wind Speed (m/s)
                    </div>
                  </div>
                </div>

                {/* Efficiency Factors */}
                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    Real-Time Efficiency Analysis
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Temperature Factor:</span>
                          <span className={`font-medium ${getEfficiencyColor(conditions.efficiency.temperatureFactor)}`}>
                            {(conditions.efficiency.temperatureFactor * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Irradiance Factor:</span>
                          <span className={`font-medium ${getEfficiencyColor(conditions.efficiency.irradianceFactor)}`}>
                            {(conditions.efficiency.irradianceFactor * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Weather Factor:</span>
                          <span className={`font-medium ${getEfficiencyColor(conditions.efficiency.weatherFactor)}`}>
                            {(conditions.efficiency.weatherFactor * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <div className="text-center">
                        <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
                        <div className={`text-3xl font-bold ${getEfficiencyColor(conditions.efficiency.overallEfficiency)}`}>
                          {(conditions.efficiency.overallEfficiency * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Overall Efficiency
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Estimated Output */}
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3 text-green-800 dark:text-green-200">
                    Estimated Current Output
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                        {((conditions.efficiency.overallEfficiency * systemSize) || 0).toFixed(2)} kW
                      </div>
                      <div className="text-sm text-green-600 dark:text-green-400">
                        Current Output
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                        {((conditions.irradiance.ghi / 1000) * systemSize * conditions.efficiency.overallEfficiency).toFixed(2)} kWh
                      </div>
                      <div className="text-sm text-green-600 dark:text-green-400">
                        Hourly Generation
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                        {((conditions.irradiance.ghi / 1000) * systemSize * conditions.efficiency.overallEfficiency * 8).toFixed(2)} kWh
                      </div>
                      <div className="text-sm text-green-600 dark:text-green-400">
                        Est. Daily Generation
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Details */}
                <details className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <summary className="cursor-pointer font-medium text-gray-900 dark:text-white">
                    Additional Weather Details
                  </summary>
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <Eye className="w-4 h-4 text-gray-500 inline mr-2" />
                      <span className="text-gray-600 dark:text-gray-400">Visibility:</span>
                      <div className="font-medium">{conditions.weather.visibility} km</div>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Humidity:</span>
                      <div className="font-medium">{conditions.weather.humidity}%</div>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Pressure:</span>
                      <div className="font-medium">{conditions.weather.pressure} hPa</div>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">UV Index:</span>
                      <div className="font-medium">{conditions.weather.uvIndex}</div>
                    </div>
                  </div>
                </details>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
