import { NextRequest, NextResponse } from 'next/server';
import { SolarConditions, RealTimeDataResponse, WeatherData, SolarIrradianceData, RealTimeEfficiencyFactors } from '@/types';

async function fetchWeatherData(lat: number, lon: number): Promise<WeatherData | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/weather?lat=${lat}&lon=${lon}`);
    if (!response.ok) return null;
    
    const data = await response.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return null;
  }
}

async function fetchSolarData(lat: number, lon: number): Promise<SolarIrradianceData | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/solar-data?lat=${lat}&lon=${lon}`);
    if (!response.ok) return null;
    
    const data = await response.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error('Error fetching solar data:', error);
    return null;
  }
}

function calculateEfficiencyFactors(weather: WeatherData, solar: SolarIrradianceData): RealTimeEfficiencyFactors {
  const baseEfficiency = 85; // Base system efficiency (%)
  
  // Temperature derating (panels lose efficiency at high temperatures)
  // Standard Test Conditions (STC) is 25°C
  const temperatureCoeff = -0.4; // %/°C (typical for silicon panels)
  const temperatureDelta = weather.temperature - 25;
  const temperatureDerating = Math.max(0.5, 1 + (temperatureCoeff * temperatureDelta) / 100);
  
  // Irradiance derating (lower irradiance = lower efficiency)
  const standardIrradiance = 1000; // W/m² (STC)
  const irradianceDerating = Math.min(1, solar.ghi / standardIrradiance);
  
  // Cloud cover derating
  const cloudDerating = Math.max(0.1, 1 - (weather.cloudCover / 100) * 0.8);
  
  // Seasonal factor (based on sun angle)
  const seasonalFactor = Math.max(0.3, 1 - Math.abs(solar.solarZenithAngle - 30) / 90);
  
  // Time of day factor (based on solar zenith angle)
  const timeOfDayFactor = solar.solarZenithAngle < 85 ? 
    Math.cos(solar.solarZenithAngle * Math.PI / 180) : 0;
  
  // Combined real-time efficiency
  const realTimeEfficiency = baseEfficiency * temperatureDerating * irradianceDerating * 
    cloudDerating * seasonalFactor * timeOfDayFactor;
  
  // Projected daily output (kWh per kW installed)
  const peakSunHours = (solar.ghi / 1000) * (timeOfDayFactor * 8); // Estimate peak sun hours
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
}

function generateRecommendations(weather: WeatherData, solar: SolarIrradianceData, _efficiency: RealTimeEfficiencyFactors): {
  isOptimal: boolean;
  message: string;
  improvements: string[];
} {
  const improvements: string[] = [];
  let isOptimal = true;
  let message = "Excellent conditions for solar generation!";
  
  // Check temperature
  if (weather.temperature > 35) {
    isOptimal = false;
    message = "High temperature is reducing panel efficiency";
    improvements.push("Consider panel cooling or better ventilation");
  } else if (weather.temperature < 0) {
    message = "Cold weather - panels may perform better but check for snow coverage";
    improvements.push("Clear any snow from panels");
  }
  
  // Check irradiance
  if (solar.ghi < 200) {
    isOptimal = false;
    message = "Low solar irradiance - limited power generation";
    improvements.push("Wait for clearer skies for optimal generation");
  } else if (solar.ghi > 800) {
    message = "High solar irradiance - excellent generation conditions";
  }
  
  // Check cloud cover
  if (weather.cloudCover > 70) {
    isOptimal = false;
    message = "Heavy cloud cover is significantly reducing output";
    improvements.push("Generation will improve as clouds clear");
  } else if (weather.cloudCover > 30) {
    improvements.push("Partial clouds may cause variable output");
  }
  
  // Check time of day
  if (solar.solarZenithAngle > 70) {
    message = "Low sun angle - limited generation expected";
    improvements.push("Peak generation typically occurs around midday");
  }
    // Check for optimal conditions
  if (weather.temperature >= 15 && weather.temperature <= 25 && 
      solar.ghi >= 600 && weather.cloudCover <= 20) {
    isOptimal = true;
    message = "Optimal conditions for maximum solar generation!";
    improvements.splice(0, improvements.length, "Conditions are ideal - no improvements needed");
  }
  
  return { isOptimal, message, improvements };
}

export async function GET(request: NextRequest): Promise<NextResponse<RealTimeDataResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const latParam = searchParams.get('lat');
    const lonParam = searchParams.get('lon');

    if (!latParam || !lonParam) {
      return NextResponse.json({
        success: false,
        error: 'Latitude and longitude parameters are required',
        lastUpdated: Date.now(),
        nextUpdate: Date.now() + 300000, // 5 minutes
      }, { status: 400 });
    }

    const lat = parseFloat(latParam);
    const lon = parseFloat(lonParam);

    if (isNaN(lat) || isNaN(lon)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid latitude or longitude values',
        lastUpdated: Date.now(),
        nextUpdate: Date.now() + 300000,
      }, { status: 400 });
    }

    // Fetch weather and solar data in parallel
    const [weatherData, solarData] = await Promise.all([
      fetchWeatherData(lat, lon),
      fetchSolarData(lat, lon)
    ]);

    if (!weatherData || !solarData) {
      return NextResponse.json({
        success: false,
        error: 'Unable to fetch complete real-time data',
        lastUpdated: Date.now(),
        nextUpdate: Date.now() + 300000,
      }, { status: 503 });
    }

    // Calculate efficiency factors
    const efficiencyFactors = calculateEfficiencyFactors(weatherData, solarData);
    
    // Generate recommendations
    const recommendations = generateRecommendations(weatherData, solarData, efficiencyFactors);

    const solarConditions: SolarConditions = {
      weather: weatherData,
      irradiance: solarData,
      efficiency: {
        temperatureFactor: efficiencyFactors.temperatureDerating,
        irradianceFactor: efficiencyFactors.irradianceDerating,
        weatherFactor: efficiencyFactors.cloudDerating,
        overallEfficiency: efficiencyFactors.realTimeEfficiency / 100,
      },
      recommendations,
    };

    return NextResponse.json({
      success: true,
      data: solarConditions,
      lastUpdated: Date.now(),
      nextUpdate: Date.now() + 300000, // Update every 5 minutes
    });

  } catch (error) {
    console.error('Real-time conditions API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      lastUpdated: Date.now(),
      nextUpdate: Date.now() + 300000,
    }, { status: 500 });
  }
}
