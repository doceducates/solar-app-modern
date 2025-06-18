import { NextRequest, NextResponse } from 'next/server';
import { LocationData } from '@/types';

interface LocationAPIResponse {
  success: boolean;
  data?: LocationData[];
  error?: string;
}

async function searchOpenWeatherGeocode(query: string): Promise<LocationData[] | null> {
  if (!process.env.OPENWEATHER_API_KEY) {
    return null;
  }

  try {
    const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${process.env.OPENWEATHER_API_KEY}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`OpenWeather Geocoding API error: ${response.status}`);
    }
      const data = await response.json();
    
    return data.map((location: { lat: number; lon: number; name: string; country: string }) => ({
      latitude: location.lat,
      longitude: location.lon,
      city: location.name,
      country: location.country,
      timezone: '', // OpenWeather doesn't provide timezone
    }));
  } catch (error) {
    console.error('OpenWeather geocoding error:', error);
    return null;
  }
}

async function searchWeatherAPIGeocode(query: string): Promise<LocationData[] | null> {
  if (!process.env.WEATHERAPI_KEY) {
    return null;
  }

  try {
    const url = `${process.env.WEATHERAPI_BASE_URL}/search.json?key=${process.env.WEATHERAPI_KEY}&q=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`WeatherAPI search error: ${response.status}`);
    }
      const data = await response.json();
    
    return data.map((location: { lat: number; lon: number; name: string; country: string; tz_id?: string }) => ({
      latitude: location.lat,
      longitude: location.lon,
      city: location.name,
      country: location.country,
      timezone: location.tz_id || '',
    }));
  } catch (error) {
    console.error('WeatherAPI geocoding error:', error);
    return null;
  }
}

function generateMockLocations(query: string): LocationData[] {
  // Common city coordinates for fallback
  const commonCities = [
    { city: 'New York', country: 'US', latitude: 40.7128, longitude: -74.0060, timezone: 'America/New_York' },
    { city: 'Los Angeles', country: 'US', latitude: 34.0522, longitude: -118.2437, timezone: 'America/Los_Angeles' },
    { city: 'London', country: 'GB', latitude: 51.5074, longitude: -0.1278, timezone: 'Europe/London' },
    { city: 'Tokyo', country: 'JP', latitude: 35.6762, longitude: 139.6503, timezone: 'Asia/Tokyo' },
    { city: 'Sydney', country: 'AU', latitude: -33.8688, longitude: 151.2093, timezone: 'Australia/Sydney' },
    { city: 'Berlin', country: 'DE', latitude: 52.5200, longitude: 13.4050, timezone: 'Europe/Berlin' },
    { city: 'Paris', country: 'FR', latitude: 48.8566, longitude: 2.3522, timezone: 'Europe/Paris' },
    { city: 'Mumbai', country: 'IN', latitude: 19.0760, longitude: 72.8777, timezone: 'Asia/Kolkata' },
    { city: 'São Paulo', country: 'BR', latitude: -23.5505, longitude: -46.6333, timezone: 'America/Sao_Paulo' },
    { city: 'Cairo', country: 'EG', latitude: 30.0444, longitude: 31.2357, timezone: 'Africa/Cairo' },
  ];

  const searchTerm = query.toLowerCase();
  return commonCities
    .filter(city => 
      city.city.toLowerCase().includes(searchTerm) || 
      city.country.toLowerCase().includes(searchTerm)
    )
    .slice(0, 3); // Return max 3 results
}

export async function GET(request: NextRequest): Promise<NextResponse<LocationAPIResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        success: false,
        error: 'Query parameter must be at least 2 characters long',
      }, { status: 400 });
    }

    let locations: LocationData[] | null = null;

    // Try different geocoding services
    if (!locations && process.env.WEATHERAPI_KEY) {
      locations = await searchWeatherAPIGeocode(query);
    }

    if (!locations && process.env.OPENWEATHER_API_KEY) {
      locations = await searchOpenWeatherGeocode(query);
    }

    // Fallback to mock data
    if (!locations || locations.length === 0) {
      locations = generateMockLocations(query);
    }

    return NextResponse.json({
      success: true,
      data: locations,
    });

  } catch (error) {
    console.error('Location search API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<LocationAPIResponse>> {
  try {
    const body = await request.json();
    const { latitude, longitude } = body;

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return NextResponse.json({
        success: false,
        error: 'Valid latitude and longitude are required',
      }, { status: 400 });
    }

    // Reverse geocoding
    let locationData: LocationData | null = null;

    if (process.env.OPENWEATHER_API_KEY) {
      try {
        const url = `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${process.env.OPENWEATHER_API_KEY}`;
        const response = await fetch(url);
        
        if (response.ok) {
          const data = await response.json();
          if (data.length > 0) {
            const location = data[0];
            locationData = {
              latitude,
              longitude,
              city: location.name,
              country: location.country,
              timezone: '', // Not provided by OpenWeather
            };
          }
        }
      } catch (error) {
        console.error('Reverse geocoding error:', error);
      }
    }

    // Fallback location data
    if (!locationData) {
      locationData = {
        latitude,
        longitude,
        city: 'Unknown Location',
        country: 'Unknown',
        timezone: '',
      };
    }

    return NextResponse.json({
      success: true,
      data: [locationData],
    });

  } catch (error) {
    console.error('Reverse geocoding API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
