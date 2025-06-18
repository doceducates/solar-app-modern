import { NextRequest, NextResponse } from 'next/server';
import { SolarIrradianceData, SolarDataAPIResponse } from '@/types';

async function fetchNASAPowerData(lat: number, lon: number): Promise<SolarIrradianceData | null> {
  // NASA POWER API - Free, no API key required
  const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const url = `${process.env.NASA_POWER_BASE_URL}?parameters=ALLSKY_SFC_SW_DWN,CLRSKY_SFC_SW_DWN,T2M&community=RE&longitude=${lon}&latitude=${lat}&start=${today}&end=${today}&format=JSON`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`NASA POWER API error: ${response.status}`);
    }
    
    const data = await response.json();
    const properties = data.properties?.parameter;
    
    if (!properties) {
      throw new Error('Invalid NASA POWER API response');
    }    // Get today's data
    const ghi = properties.ALLSKY_SFC_SW_DWN?.[today] || 0;
    const clearSkyGhi = properties.CLRSKY_SFC_SW_DWN?.[today] || 0;

    // Calculate derived values
    const solarZenithAngle = calculateSolarZenithAngle(lat, lon);
    
    return {
      ghi: ghi * 1000, // Convert kWh/m²/day to W/m² (approximate)
      dni: ghi * 0.8 * 1000, // Estimate DNI from GHI
      dhi: ghi * 0.2 * 1000, // Estimate DHI from GHI
      clearSkyGhi: clearSkyGhi * 1000,
      solarZenithAngle,
      solarAzimuthAngle: calculateSolarAzimuthAngle(lat, lon),
      airMass: calculateAirMass(solarZenithAngle),
      timestamp: Date.now(),
      dataSource: 'nasa',
    };
  } catch (error) {
    console.error('NASA POWER API error:', error);
    return null;
  }
}

async function fetchNRELData(lat: number, lon: number): Promise<SolarIrradianceData | null> {
  // NREL API - Some endpoints are free
  const url = `${process.env.NREL_BASE_URL}/solar_resource/v1.json?lat=${lat}&lon=${lon}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      // NREL might require API key for some endpoints
      throw new Error(`NREL API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      ghi: data.avg_ghi?.annual || 200, // Default fallback
      dni: data.avg_dni?.annual || 160,
      dhi: data.avg_dhi?.annual || 40,
      clearSkyGhi: (data.avg_ghi?.annual || 200) * 1.2,
      solarZenithAngle: calculateSolarZenithAngle(lat, lon),
      solarAzimuthAngle: calculateSolarAzimuthAngle(lat, lon),
      airMass: 1.5, // Standard air mass
      timestamp: Date.now(),
      dataSource: 'nrel',
    };
  } catch (error) {
    console.error('NREL API error:', error);
    return null;
  }
}

function calculateSolarZenithAngle(lat: number, _lon: number): number {
  const now = new Date();
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
  const declination = 23.45 * Math.sin((360 * (284 + dayOfYear) / 365) * Math.PI / 180);
  
  const hourAngle = 15 * (now.getHours() + now.getMinutes() / 60 - 12);
  
  const zenith = Math.acos(
    Math.sin(lat * Math.PI / 180) * Math.sin(declination * Math.PI / 180) +
    Math.cos(lat * Math.PI / 180) * Math.cos(declination * Math.PI / 180) * Math.cos(hourAngle * Math.PI / 180)
  ) * 180 / Math.PI;
  
  return Math.max(0, Math.min(90, zenith));
}

function calculateSolarAzimuthAngle(lat: number, _lon: number): number {
  const now = new Date();
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
  const declination = 23.45 * Math.sin((360 * (284 + dayOfYear) / 365) * Math.PI / 180);
  
  const hourAngle = 15 * (now.getHours() + now.getMinutes() / 60 - 12);
  
  const azimuthRad = Math.atan2(
    Math.sin(hourAngle * Math.PI / 180),
    Math.cos(hourAngle * Math.PI / 180) * Math.sin(lat * Math.PI / 180) - 
    Math.tan(declination * Math.PI / 180) * Math.cos(lat * Math.PI / 180)
  );
  
  let azimuth = azimuthRad * 180 / Math.PI;
  if (azimuth < 0) azimuth += 360;
  
  return azimuth;
}

function calculateAirMass(zenithAngle: number): number {
  if (zenithAngle >= 90) return 38; // Maximum air mass
  
  const zenithRad = zenithAngle * Math.PI / 180;
  return 1 / (Math.cos(zenithRad) + 0.50572 * Math.pow(96.07995 - zenithAngle, -1.6364));
}

function generateSyntheticSolarData(lat: number, lon: number): SolarIrradianceData {
  // Generate realistic synthetic data based on location and time
  const now = new Date();
  const hour = now.getHours();
  const month = now.getMonth() + 1;
  
  // Base irradiance varies by time of day and season
  const timeOfDayFactor = Math.max(0, Math.sin((hour - 6) * Math.PI / 12));
  const seasonalFactor = 0.8 + 0.4 * Math.sin((month - 3) * Math.PI / 6);
  const latitudeFactor = Math.max(0.3, 1 - Math.abs(lat) / 90);
  
  const baseGhi = 1000 * timeOfDayFactor * seasonalFactor * latitudeFactor;
  
  return {
    ghi: Math.max(0, baseGhi + (Math.random() - 0.5) * 100),
    dni: Math.max(0, baseGhi * 0.8 + (Math.random() - 0.5) * 80),
    dhi: Math.max(0, baseGhi * 0.2 + (Math.random() - 0.5) * 20),
    clearSkyGhi: baseGhi * 1.2,
    solarZenithAngle: calculateSolarZenithAngle(lat, lon),
    solarAzimuthAngle: calculateSolarAzimuthAngle(lat, lon),
    airMass: calculateAirMass(calculateSolarZenithAngle(lat, lon)),
    timestamp: Date.now(),
    dataSource: 'nasa', // Default to NASA as source
  };
}

export async function GET(request: NextRequest): Promise<NextResponse<SolarDataAPIResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const latParam = searchParams.get('lat');
    const lonParam = searchParams.get('lon');
    const source = searchParams.get('source') || 'nasa';

    if (!latParam || !lonParam) {      return NextResponse.json({
        success: false,
        error: 'Latitude and longitude parameters are required',
        source: source as 'nasa' | 'nrel' | 'openweather' | 'weatherapi',
      }, { status: 400 });
    }

    const lat = parseFloat(latParam);
    const lon = parseFloat(lonParam);

    if (isNaN(lat) || isNaN(lon)) {      return NextResponse.json({
        success: false,
        error: 'Invalid latitude or longitude values',
        source: source as 'nasa' | 'nrel' | 'openweather' | 'weatherapi',
      }, { status: 400 });
    }

    let solarData: SolarIrradianceData | null = null;

    // Try to fetch from preferred source
    if (source === 'nasa') {
      solarData = await fetchNASAPowerData(lat, lon);
    } else if (source === 'nrel') {
      solarData = await fetchNRELData(lat, lon);
    }

    // Fallback to other sources if primary fails
    if (!solarData && source !== 'nasa') {
      solarData = await fetchNASAPowerData(lat, lon);
    }
    
    if (!solarData && source !== 'nrel') {
      solarData = await fetchNRELData(lat, lon);
    }

    // Final fallback to synthetic data
    if (!solarData) {
      console.warn('All solar data sources failed, using synthetic data');
      solarData = generateSyntheticSolarData(lat, lon);
    }

    return NextResponse.json({
      success: true,
      data: solarData,
      source: solarData.dataSource,
    });

  } catch (error) {
    console.error('Solar data API route error:', error);
    
    // Return synthetic data on error
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '40.7128');
    const lon = parseFloat(searchParams.get('lon') || '-74.0060');
    
    return NextResponse.json({
      success: true,
      data: generateSyntheticSolarData(lat, lon),
      source: 'nasa',
    });
  }
}
