// Country-specific pricing and currency information

export interface CountryPricing {
  id: string;
  name: string;
  currency: {
    code: string;
    symbol: string;
    name: string;
  };
  pricing: {
    panelCostPerWatt: number;
    installationCostPerWatt: number;
    electricityRate: number; // per kWh
    laborRate: number; // per hour
    permitCost: number; // flat rate
  };
  incentives?: {
    name: string;
    type: 'rebate' | 'tax_credit' | 'feed_in_tariff';
    value: number; // percentage or flat amount
    description: string;
  }[];
  regulations: {
    maxSystemVoltage: number;
    requiresPermit: boolean;
    gridTieAllowed: boolean;
    netMeteringAvailable: boolean;
  };
}

export const COUNTRIES: CountryPricing[] = [
  {
    id: 'pakistan',
    name: 'Pakistan',
    currency: {
      code: 'PKR',
      symbol: '₨',
      name: 'Pakistani Rupee'
    },
    pricing: {
      panelCostPerWatt: 30, // PKR per watt
      installationCostPerWatt: 45, // PKR per watt
      electricityRate: 25, // PKR per kWh
      laborRate: 800, // PKR per hour
      permitCost: 15000 // PKR flat rate
    },
    incentives: [
      {
        name: 'Net Metering',
        type: 'feed_in_tariff',
        value: 0.85, // 85% of electricity rate
        description: 'Sell excess electricity back to grid at 85% of purchase rate'
      }
    ],
    regulations: {
      maxSystemVoltage: 1000,
      requiresPermit: true,
      gridTieAllowed: true,
      netMeteringAvailable: true
    }
  },
  {
    id: 'usa',
    name: 'United States',
    currency: {
      code: 'USD',
      symbol: '$',
      name: 'US Dollar'
    },
    pricing: {
      panelCostPerWatt: 0.50, // USD per watt
      installationCostPerWatt: 1.50, // USD per watt
      electricityRate: 0.15, // USD per kWh
      laborRate: 75, // USD per hour
      permitCost: 500 // USD flat rate
    },
    incentives: [
      {
        name: 'Federal Tax Credit',
        type: 'tax_credit',
        value: 30, // 30% tax credit
        description: '30% federal tax credit on solar installations'
      }
    ],
    regulations: {
      maxSystemVoltage: 600,
      requiresPermit: true,
      gridTieAllowed: true,
      netMeteringAvailable: true
    }
  },
  {
    id: 'india',
    name: 'India',
    currency: {
      code: 'INR',
      symbol: '₹',
      name: 'Indian Rupee'
    },
    pricing: {
      panelCostPerWatt: 25, // INR per watt
      installationCostPerWatt: 35, // INR per watt
      electricityRate: 6.5, // INR per kWh
      laborRate: 300, // INR per hour
      permitCost: 5000 // INR flat rate
    },
    incentives: [
      {
        name: 'MNRE Subsidy',
        type: 'rebate',
        value: 40, // 40% subsidy
        description: 'Government subsidy up to 40% for residential solar'
      }
    ],
    regulations: {
      maxSystemVoltage: 1000,
      requiresPermit: true,
      gridTieAllowed: true,
      netMeteringAvailable: true
    }
  },
  {
    id: 'uk',
    name: 'United Kingdom',
    currency: {
      code: 'GBP',
      symbol: '£',
      name: 'British Pound'
    },
    pricing: {
      panelCostPerWatt: 0.45, // GBP per watt
      installationCostPerWatt: 1.20, // GBP per watt
      electricityRate: 0.28, // GBP per kWh
      laborRate: 50, // GBP per hour
      permitCost: 200 // GBP flat rate
    },
    incentives: [
      {
        name: 'Smart Export Guarantee',
        type: 'feed_in_tariff',
        value: 0.05, // GBP per kWh
        description: 'Export electricity to grid at guaranteed rate'
      }
    ],
    regulations: {
      maxSystemVoltage: 1000,
      requiresPermit: false,
      gridTieAllowed: true,
      netMeteringAvailable: true
    }
  },
  {
    id: 'germany',
    name: 'Germany',
    currency: {
      code: 'EUR',
      symbol: '€',
      name: 'Euro'
    },
    pricing: {
      panelCostPerWatt: 0.40, // EUR per watt
      installationCostPerWatt: 1.00, // EUR per watt
      electricityRate: 0.35, // EUR per kWh
      laborRate: 65, // EUR per hour
      permitCost: 300 // EUR flat rate
    },
    incentives: [
      {
        name: 'EEG Feed-in Tariff',
        type: 'feed_in_tariff',
        value: 0.08, // EUR per kWh
        description: 'Feed excess electricity into grid at guaranteed rate'
      }
    ],
    regulations: {
      maxSystemVoltage: 1000,
      requiresPermit: true,
      gridTieAllowed: true,
      netMeteringAvailable: true
    }
  }
];

export const getCountryById = (id: string): CountryPricing | undefined => {
  return COUNTRIES.find(country => country.id === id);
};

export const formatCurrency = (amount: number, currencyCode: string): string => {
  const country = COUNTRIES.find(c => c.currency.code === currencyCode);
  if (!country) return amount.toFixed(2);
  
  return `${country.currency.symbol}${amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })}`;
};
