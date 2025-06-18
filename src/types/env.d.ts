declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // OpenAI
      OPENAI_API_KEY: string;
      OPENAI_BASE_URL: string;
      
      // Weather APIs
      OPENWEATHER_API_KEY: string;
      OPENWEATHER_BASE_URL: string;
      WEATHERAPI_KEY: string;
      WEATHERAPI_BASE_URL: string;
      
      // Free APIs (no key required)
      NASA_POWER_BASE_URL: string;
      NREL_BASE_URL: string;
      
      // Application
      NEXT_PUBLIC_APP_URL: string;
      NEXT_PUBLIC_DEFAULT_LOCATION: string;
      NEXT_PUBLIC_DEFAULT_CITY: string;
      
      // Database
      DATABASE_URL: string;
      
      // Rate Limiting
      RATE_LIMIT_REQUESTS_PER_MINUTE: string;
    }
  }
}

export {};
