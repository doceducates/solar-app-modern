import { NextRequest, NextResponse } from 'next/server';
import { WeatherData, WeatherAPIResponse } from '@/types';

// Rate limiting store (in production, use Redis or database)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = parseInt(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE || '60');
  
  const current = rateLimitStore.get(ip);
  
  if (!current || now > current.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (current.count >= maxRequests) {
    return false;
  }
  
  current.count++;
  return true;
}

async function fetchOpenWeatherData(lat: number, lon: number): Promise<WeatherData | null> {
  if (!process.env.OPENWEATHER_API_KEY) {
    throw new Error('OpenWeather API key not configured');
  }

  const url = `${process.env.OPENWEATHER_BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`OpenWeather API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      temperature: data.main.temp,
      humidity: data.main.humidity,
      cloudCover: data.clouds.all,
      uvIndex: data.uvi || 0, // UV index might not be available in current weather
      visibility: (data.visibility || 10000) / 1000, // Convert to km
      windSpeed: data.wind.speed,
      pressure: data.main.pressure,
      sunrise: data.sys.sunrise * 1000,
      sunset: data.sys.sunset * 1000,
      description: data.weather[0].description,
      location: {
        city: data.name,
        country: data.sys.country,
        latitude: lat,
        longitude: lon,
      },
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('OpenWeather API error:', error);
    return null;
  }
}

async function fetchWeatherAPIData(lat: number, lon: number): Promise<WeatherData | null> {
  if (!process.env.WEATHERAPI_KEY) {
    throw new Error('WeatherAPI key not configured');
  }

  const url = `${process.env.WEATHERAPI_BASE_URL}/current.json?key=${process.env.WEATHERAPI_KEY}&q=${lat},${lon}&aqi=no`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`WeatherAPI error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      temperature: data.current.temp_c,
      humidity: data.current.humidity,
      cloudCover: data.current.cloud,
      uvIndex: data.current.uv,
      visibility: data.current.vis_km,
      windSpeed: data.current.wind_kph / 3.6, // Convert to m/s
      pressure: data.current.pressure_mb,
      sunrise: 0, // Would need astronomy API call
      sunset: 0, // Would need astronomy API call
      description: data.current.condition.text,
      location: {
        city: data.location.name,
        country: data.location.country,
        latitude: lat,
        longitude: lon,
      },
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('WeatherAPI error:', error);
    return null;
  }
}

export async function GET(request: NextRequest): Promise<NextResponse<WeatherAPIResponse>> {  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    
    if (!checkRateLimit(ip)) {
      return NextResponse.json({
        success: false,
        error: 'Rate limit exceeded. Please try again later.',
      }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const latParam = searchParams.get('lat');
    const lonParam = searchParams.get('lon');
    const provider = searchParams.get('provider') || 'openweather';

    if (!latParam || !lonParam) {
      return NextResponse.json({
        success: false,
        error: 'Latitude and longitude parameters are required',
      }, { status: 400 });
    }

    const lat = parseFloat(latParam);
    const lon = parseFloat(lonParam);

    if (isNaN(lat) || isNaN(lon)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid latitude or longitude values',
      }, { status: 400 });
    }

    let weatherData: WeatherData | null = null;

    // Try different weather providers
    if (provider === 'weatherapi' && process.env.WEATHERAPI_KEY) {
      weatherData = await fetchWeatherAPIData(lat, lon);
    } else if (provider === 'openweather' && process.env.OPENWEATHER_API_KEY) {
      weatherData = await fetchOpenWeatherData(lat, lon);
    }

    // Fallback to other provider if first one fails
    if (!weatherData) {
      if (provider !== 'weatherapi' && process.env.WEATHERAPI_KEY) {
        weatherData = await fetchWeatherAPIData(lat, lon);
      } else if (provider !== 'openweather' && process.env.OPENWEATHER_API_KEY) {
        weatherData = await fetchOpenWeatherData(lat, lon);
      }
    }

    if (!weatherData) {
      return NextResponse.json({
        success: false,
        error: 'Unable to fetch weather data from any provider',
      }, { status: 503 });
    }

    return NextResponse.json({
      success: true,
      data: weatherData,
    });

  } catch (error) {
    console.error('Weather API route error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
