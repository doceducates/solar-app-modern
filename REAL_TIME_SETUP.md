# Real-Time Solar Data Integration Setup Guide

This guide will help you set up real-time weather and solar data APIs for your Solar Panel Calculator.

## Overview

The application now supports real-time weather and solar irradiance data from multiple free APIs:

- **OpenWeatherMap API** (Free tier: 1,000 calls/day)
- **WeatherAPI** (Free tier: 1,000 calls/day) 
- **NASA POWER API** (Free, no key required)
- **NREL Solar Resource API** (Some endpoints free)

## Quick Setup

### 1. Environment Configuration

Copy `.env.example` to `.env.local`:

```powershell
Copy-Item .env.example .env.local
```

### 2. Get Free API Keys

#### OpenWeatherMap (Recommended)
1. Visit [OpenWeatherMap](https://openweathermap.org/api)
2. Sign up for free account
3. Go to API Keys section
4. Copy your API key

#### WeatherAPI (Alternative)
1. Visit [WeatherAPI](https://www.weatherapi.com/)
2. Sign up for free account  
3. Go to API Keys section
4. Copy your API key

### 3. Update .env.local

Edit `.env.local` and add your API keys:

```env
# OpenWeatherMap (Primary weather source)
OPENWEATHER_API_KEY=your_actual_api_key_here

# WeatherAPI (Backup weather source)  
WEATHERAPI_KEY=your_actual_api_key_here

# OpenAI (for future AI features)
OPENAI_API_KEY=your_openai_key_here
```

**Note:** NASA POWER and NREL APIs don't require keys for basic usage.

### 4. Test the Setup

Start your development server:

```powershell
npm run dev
```

Navigate to the Calculator page and click the "Real-Time Data" tab. If configured correctly, you should see:
- Location search functionality
- Current weather conditions
- Solar irradiance data
- Real-time efficiency calculations

## API Features

### Weather Data
- **Temperature** - Affects panel efficiency (panels lose ~0.4% per °C above 25°C)
- **Cloud Cover** - Reduces solar irradiance
- **Humidity** - Affects atmospheric clarity
- **Wind Speed** - Can help cool panels
- **UV Index** - Indicates solar intensity

### Solar Irradiance Data
- **GHI (Global Horizontal Irradiance)** - Total solar energy on horizontal surface
- **DNI (Direct Normal Irradiance)** - Direct sunlight
- **DHI (Diffuse Horizontal Irradiance)** - Scattered sunlight
- **Solar Position** - Sun angle calculations

### Real-Time Efficiency Factors
- **Temperature Derating** - Efficiency loss from heat
- **Irradiance Factor** - Based on current solar conditions
- **Cloud Factor** - Reduction from cloud cover
- **Overall Efficiency** - Combined real-time efficiency

## Usage Workflow

1. **Select Location**
   - Search for your city or use current location
   - System will fetch local weather and solar data

2. **View Real-Time Conditions**
   - Current weather display
   - Solar irradiance readings
   - Efficiency analysis with recommendations

3. **Apply to Calculator**
   - Real-time efficiency automatically calculated
   - Option to apply to your solar system calculations
   - See updated power generation estimates

4. **Monitor Performance**
   - Data updates every 5 minutes
   - Historical comparison capabilities
   - Optimization suggestions

## Rate Limits & Costs

### Free Tier Limits
- **OpenWeatherMap**: 1,000 calls/day (enough for continuous monitoring)
- **WeatherAPI**: 1,000 calls/day
- **NASA POWER**: No limits (but slower response)
- **Application Cache**: 5-minute refresh interval to minimize API calls

### Cost Optimization
- Data is cached for 5 minutes to reduce API calls
- Multiple API fallbacks ensure reliability
- Synthetic data generation when APIs unavailable

## Troubleshooting

### Common Issues

1. **"Unable to fetch weather data"**
   - Check your API keys in `.env.local`
   - Verify API key is valid and activated
   - Check rate limits haven't been exceeded

2. **Location search not working**
   - Ensure at least one weather API key is configured
   - Try typing full city names
   - Use "Use My Location" button as alternative

3. **Real-time data shows errors**
   - Check browser console for specific error messages
   - Verify internet connection
   - Try refreshing the data

### Debug Steps

1. Check environment variables are loaded:
```javascript
console.log('API Keys loaded:', {
  openweather: !!process.env.OPENWEATHER_API_KEY,
  weatherapi: !!process.env.WEATHERAPI_KEY
});
```

2. Test API endpoints directly:
```bash
# Test weather API
curl "http://localhost:3000/api/weather?lat=40.7128&lon=-74.0060"

# Test solar data API  
curl "http://localhost:3000/api/solar-data?lat=40.7128&lon=-74.0060"
```

## API Documentation

### Weather API Endpoint
```
GET /api/weather?lat={latitude}&lon={longitude}&provider={openweather|weatherapi}
```

### Solar Data API Endpoint
```
GET /api/solar-data?lat={latitude}&lon={longitude}&source={nasa|nrel}
```

### Real-Time Conditions API Endpoint
```
GET /api/real-time-conditions?lat={latitude}&lon={longitude}
```

### Location Search API Endpoint
```
GET /api/location?q={search_query}
POST /api/location (for reverse geocoding)
```

## Future Enhancements

- [ ] OpenAI integration for intelligent recommendations
- [ ] Historical weather data analysis
- [ ] Seasonal performance predictions
- [ ] Panel tilt/orientation optimization
- [ ] Energy storage calculations
- [ ] Cost-benefit analysis with real-time pricing

## Support

If you encounter issues:
1. Check this guide first
2. Review the console logs
3. Verify API key configuration
4. Test with different locations
5. Try refreshing data manually

The system is designed to gracefully handle API failures by:
- Falling back to alternative APIs
- Using synthetic data when necessary
- Providing clear error messages
- Maintaining calculator functionality without real-time data
