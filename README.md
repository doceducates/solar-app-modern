# Solar Panel Calculator - Advanced Next.js Application

A modern, comprehensive solar panel calculator with real-time weather data integration, built with Next.js 15, TypeScript, and SQLite.

## ✨ Features

### Core Calculator
- **Multiple Configurations**: Series, parallel, and combined setups
- **Real-time Calculations**: Live power, voltage, and current calculations
- **Safety Validation**: Comprehensive safety checks and compliance
- **Panel Presets**: 50+ predefined panel specifications
- **Custom Panels**: Save and manage custom panel configurations
- **Cost Analysis**: Country-specific pricing and ROI calculations

### Real-Time Data Integration ⚡ **NEW**
- **Weather Integration**: Live weather data from OpenWeatherMap & WeatherAPI
- **Solar Irradiance**: Real-time solar conditions from NASA POWER & NREL
- **Efficiency Analysis**: Dynamic efficiency calculations based on current conditions
- **Location Search**: Global location search with geocoding
- **Performance Optimization**: Real-time recommendations for optimal generation

### Advanced Features
- **Dark/Light Mode**: Theme switching with next-themes
- **Database Driven**: SQLite with better-sqlite3 for data persistence
- **Interactive Charts**: Recharts visualizations for data analysis
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Export Capabilities**: JSON, CSV, and PDF export options
- **Multi-language Support**: Country-specific regulations and pricing

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm, yarn, or pnpm

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd solar-app-modern
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   copy .env.example .env.local
   ```

4. **Configure API keys** (Optional but recommended for real-time data)
   
   Get free API keys from:
   - [OpenWeatherMap](https://openweathermap.org/api) (1,000 calls/day free)
   - [WeatherAPI](https://www.weatherapi.com/) (1,000 calls/day free)
   
   Add to `.env.local`:
   ```env
   OPENWEATHER_API_KEY=your_key_here
   WEATHERAPI_KEY=your_key_here
   OPENAI_API_KEY=your_key_here  # For future AI features
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open in browser**
   Visit [http://localhost:3000](http://localhost:3000)

## 📖 Real-Time Data Setup

For detailed setup instructions for weather and solar data APIs, see [REAL_TIME_SETUP.md](./REAL_TIME_SETUP.md).

### Quick Test
1. Navigate to Calculator → Real-Time Data tab
2. Search for your location or use "Use My Location"
3. View live weather and solar conditions
4. Apply real-time efficiency to your calculations

## 🏗️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript for type safety
- **Database**: SQLite with better-sqlite3
- **Styling**: Tailwind CSS + shadcn/ui components
- **Icons**: Lucide React
- **Charts**: Recharts for data visualization
- **Theme**: next-themes for dark/light mode
- **APIs**: OpenWeatherMap, WeatherAPI, NASA POWER, NREL

## 🧮 Solar Calculations

### Supported Configurations
- **Series**: Voltage adds, current constant
- **Parallel**: Current adds, voltage constant  
- **Combined**: Mixed series-parallel arrays

### Real-Time Efficiency Factors
- **Temperature Derating**: -0.4%/°C above 25°C
- **Irradiance Factor**: Based on current solar conditions (W/m²)
- **Cloud Coverage**: Atmospheric attenuation
- **Seasonal Adjustments**: Sun angle optimization
- **Time of Day**: Solar position calculations

### Safety Validations
- Maximum system voltage limits
- Current capacity checks
- MPPT range compliance
- Series fuse ratings

## 📁 Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── api/               # API routes for weather, solar data
│   ├── calculator/        # Calculator page
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── pages/            # Page components
│   └── RealTimeDataDisplay.tsx  # Real-time data integration
├── hooks/                 # Custom React hooks
│   ├── useDatabase.ts     # Database operations
│   └── useRealTimeData.ts # Weather/solar data hooks
├── lib/                   # Utilities
│   ├── calculations.ts    # Solar calculations
│   └── database.ts        # SQLite operations
└── types/                 # TypeScript definitions
```

## 🌡️ API Endpoints

### Weather & Solar Data
- `GET /api/weather` - Current weather data
- `GET /api/solar-data` - Solar irradiance data  
- `GET /api/real-time-conditions` - Combined conditions
- `GET /api/location` - Location search

### Calculator Data
- `GET /api/countries` - Country pricing data
- `GET /api/panel-presets` - Panel specifications
- `GET /api/calculations` - Calculation history

## 🔧 Development

### Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Database Management
```bash
# Database auto-initializes on first run
# See src/lib/database.ts for schema
```

## 🌍 Real-Time Data Sources

- **Weather**: OpenWeatherMap, WeatherAPI
- **Solar**: NASA POWER, NREL Solar Resource Database
- **Fallback**: Synthetic data generation for reliability
- **Caching**: 5-minute intervals to minimize API usage

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📚 **Setup Guide**: [REAL_TIME_SETUP.md](./REAL_TIME_SETUP.md)
- 🐛 **Issues**: Use GitHub Issues for bug reports
- 💡 **Features**: Request features via GitHub Issues
- 📖 **Docs**: In-app help system with comprehensive guides

## 🎯 Roadmap

- [x] Real-time weather and solar data integration
- [x] Dynamic efficiency calculations
- [x] Location-based solar conditions
- [ ] OpenAI integration for intelligent recommendations
- [ ] Historical performance analysis
- [ ] Energy storage calculations
- [ ] Panel tilt/orientation optimization
- [ ] Mobile app (React Native)

---

**Made with ❤️ for the solar energy community**
