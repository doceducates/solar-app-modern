import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { PanelPreset, PanelSpecifications, SystemConfiguration, ConfigurationResults, SafetyChecks } from '@/types';
import { CountryPricing } from '@/constants/countries';

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    const dbPath = path.join(process.cwd(), 'data', 'solar_calculator.db');
    
    // Ensure the data directory exists
    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    db = new Database(dbPath);
    initializeDatabase(db);
  }
  return db;
}

function initializeDatabase(database: Database.Database) {
  // Enable foreign keys
  database.pragma('foreign_keys = ON');
  
  // Create tables
  createTables(database);
  
  // Check if we need to seed data
  const panelCount = database.prepare('SELECT COUNT(*) as count FROM panel_presets').get() as { count: number };
  const countryCount = database.prepare('SELECT COUNT(*) as count FROM countries').get() as { count: number };
  
  if (panelCount.count === 0 || countryCount.count === 0) {
    console.log('Database is empty, will be seeded via API call');
  }
}

function createTables(database: Database.Database) {  // Countries table
  database.exec(`
    CREATE TABLE IF NOT EXISTS countries (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      currency_code TEXT NOT NULL,
      currency_name TEXT NOT NULL,
      currency_symbol TEXT NOT NULL,
      panel_cost_per_watt REAL NOT NULL,
      installation_cost_per_watt REAL NOT NULL,
      electricity_rate REAL NOT NULL,
      labor_rate REAL NOT NULL,
      permit_cost REAL NOT NULL,
      max_system_voltage REAL DEFAULT 1000,
      requires_permit BOOLEAN DEFAULT TRUE,
      grid_tie_allowed BOOLEAN DEFAULT TRUE,
      net_metering_available BOOLEAN DEFAULT TRUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Panel presets table
  database.exec(`
    CREATE TABLE IF NOT EXISTS panel_presets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL,
      manufacturer TEXT,
      model TEXT,
      category TEXT NOT NULL CHECK (category IN ('residential', 'commercial', 'utility', 'small')),
      voltage REAL NOT NULL,
      current REAL NOT NULL,
      power REAL NOT NULL,
      voc REAL NOT NULL,
      isc REAL NOT NULL,
      max_series_fuse REAL NOT NULL,
      max_system_voltage REAL NOT NULL,
      temperature_coefficient REAL,
      efficiency REAL,
      is_custom BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // User configurations (for saving custom setups)
  database.exec(`
    CREATE TABLE IF NOT EXISTS user_configurations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      panel_preset_id TEXT NOT NULL,
      num_panels INTEGER NOT NULL,
      system_efficiency REAL NOT NULL,
      series_groups INTEGER,
      panels_per_group INTEGER,
      country_id TEXT NOT NULL,
      custom_panel_cost_per_watt REAL,
      custom_installation_cost_per_watt REAL,
      custom_electricity_rate REAL,
      custom_labor_rate REAL,
      custom_installation_hours REAL,
      custom_permit_cost REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (panel_preset_id) REFERENCES panel_presets(id),
      FOREIGN KEY (country_id) REFERENCES countries(id)
    )
  `);

  // Calculation history
  database.exec(`
    CREATE TABLE IF NOT EXISTS calculation_history (
      id TEXT PRIMARY KEY,
      configuration_id TEXT,
      panel_specs TEXT NOT NULL,
      system_config TEXT NOT NULL,
      results TEXT NOT NULL,
      safety_checks TEXT,
      cost_analysis TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (configuration_id) REFERENCES user_configurations(id) ON DELETE SET NULL
    )
  `);

  // Create indexes for better performance
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_panel_presets_category ON panel_presets(category);
    CREATE INDEX IF NOT EXISTS idx_panel_presets_power ON panel_presets(power);
    CREATE INDEX IF NOT EXISTS idx_user_configurations_country ON user_configurations(country_id);
    CREATE INDEX IF NOT EXISTS idx_calculation_history_created_at ON calculation_history(created_at);
  `);
}

// Database operations
export class DatabaseOperations {
  private db: Database.Database;

  constructor() {
    this.db = getDatabase();
  }
  // Countries
  getAllCountries(): CountryPricing[] {
    const stmt = this.db.prepare(`
      SELECT 
        id,
        name,
        currency_code,
        currency_name,
        currency_symbol,
        panel_cost_per_watt,
        installation_cost_per_watt,
        electricity_rate,
        labor_rate,
        permit_cost,
        max_system_voltage,
        requires_permit,
        grid_tie_allowed,
        net_metering_available
      FROM countries 
      ORDER BY name
    `);
    
    const rows = stmt.all() as Array<{
      id: string;
      name: string;
      currency_code: string;
      currency_name: string;
      currency_symbol: string;
      panel_cost_per_watt: number;
      installation_cost_per_watt: number;
      electricity_rate: number;
      labor_rate: number;
      permit_cost: number;
      max_system_voltage: number;
      requires_permit: number;
      grid_tie_allowed: number;
      net_metering_available: number;
    }>;
    
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      currency: {
        code: row.currency_code,
        name: row.currency_name,
        symbol: row.currency_symbol
      },
      pricing: {
        panelCostPerWatt: row.panel_cost_per_watt,
        installationCostPerWatt: row.installation_cost_per_watt,
        electricityRate: row.electricity_rate,
        laborRate: row.labor_rate,
        permitCost: row.permit_cost
      },
      regulations: {
        maxSystemVoltage: row.max_system_voltage,
        requiresPermit: Boolean(row.requires_permit),
        gridTieAllowed: Boolean(row.grid_tie_allowed),
        netMeteringAvailable: Boolean(row.net_metering_available)
      }
    }));
  }
  getCountryById(id: string): CountryPricing | null {
    const stmt = this.db.prepare(`
      SELECT 
        id,
        name,
        currency_code,
        currency_name,
        currency_symbol,
        panel_cost_per_watt,
        installation_cost_per_watt,
        electricity_rate,
        labor_rate,
        permit_cost,
        max_system_voltage,
        requires_permit,
        grid_tie_allowed,
        net_metering_available
      FROM countries 
      WHERE id = ?
    `);
    
    const row = stmt.get(id) as {
      id: string;
      name: string;
      currency_code: string;
      currency_name: string;
      currency_symbol: string;
      panel_cost_per_watt: number;
      installation_cost_per_watt: number;
      electricity_rate: number;
      labor_rate: number;
      permit_cost: number;
      max_system_voltage: number;
      requires_permit: number;
      grid_tie_allowed: number;
      net_metering_available: number;
    } | undefined;
    
    if (!row) return null;
    
    return {
      id: row.id,
      name: row.name,
      currency: {
        code: row.currency_code,
        name: row.currency_name,
        symbol: row.currency_symbol
      },
      pricing: {
        panelCostPerWatt: row.panel_cost_per_watt,
        installationCostPerWatt: row.installation_cost_per_watt,
        electricityRate: row.electricity_rate,
        laborRate: row.labor_rate,
        permitCost: row.permit_cost
      },
      regulations: {
        maxSystemVoltage: row.max_system_voltage,
        requiresPermit: Boolean(row.requires_permit),
        gridTieAllowed: Boolean(row.grid_tie_allowed),
        netMeteringAvailable: Boolean(row.net_metering_available)
      }
    };
  }

  // Panel Presets
  getAllPanelPresets(): PanelPreset[] {
    const stmt = this.db.prepare(`
      SELECT * FROM panel_presets 
      ORDER BY category, power DESC
    `);
    
    const rows = stmt.all() as Array<{
      id: string;
      name: string;
      description: string;
      manufacturer: string | null;
      model: string | null;
      category: string;
      voltage: number;
      current: number;
      power: number;
      voc: number;
      isc: number;
      max_series_fuse: number;
      max_system_voltage: number;
      temperature_coefficient: number | null;
      efficiency: number | null;
    }>;
    
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      manufacturer: row.manufacturer || undefined,
      model: row.model || undefined,
      category: row.category as 'residential' | 'commercial' | 'utility' | 'small',
      voltage: row.voltage,
      current: row.current,
      power: row.power,
      voc: row.voc,
      isc: row.isc,
      maxSeriesFuse: row.max_series_fuse,
      maxSystemVoltage: row.max_system_voltage,
      temperatureCoefficient: row.temperature_coefficient || undefined,
      efficiency: row.efficiency || undefined
    }));
  }

  getPanelPresetById(id: string): PanelPreset | null {
    const stmt = this.db.prepare('SELECT * FROM panel_presets WHERE id = ?');
    const row = stmt.get(id) as {
      id: string;
      name: string;
      description: string;
      manufacturer: string | null;
      model: string | null;
      category: string;
      voltage: number;
      current: number;
      power: number;
      voc: number;
      isc: number;
      max_series_fuse: number;
      max_system_voltage: number;
      temperature_coefficient: number | null;
      efficiency: number | null;
    } | undefined;
    
    if (!row) return null;
    
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      manufacturer: row.manufacturer || undefined,
      model: row.model || undefined,
      category: row.category as 'residential' | 'commercial' | 'utility' | 'small',
      voltage: row.voltage,
      current: row.current,
      power: row.power,
      voc: row.voc,
      isc: row.isc,
      maxSeriesFuse: row.max_series_fuse,
      maxSystemVoltage: row.max_system_voltage,
      temperatureCoefficient: row.temperature_coefficient || undefined,
      efficiency: row.efficiency || undefined
    };
  }

  addPanelPreset(preset: Omit<PanelPreset, 'id'> & { isCustom?: boolean }): string {
    const id = `panel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const stmt = this.db.prepare(`
      INSERT INTO panel_presets (
        id, name, description, manufacturer, model, category,
        voltage, current, power, voc, isc, max_series_fuse,
        max_system_voltage, temperature_coefficient, efficiency, is_custom
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id, preset.name, preset.description, preset.manufacturer, preset.model,
      preset.category, preset.voltage, preset.current, preset.power,
      preset.voc, preset.isc, preset.maxSeriesFuse, preset.maxSystemVoltage,
      preset.temperatureCoefficient, preset.efficiency, preset.isCustom || false
    );
    
    return id;
  }

  deletePanelPreset(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM panel_presets WHERE id = ? AND is_custom = TRUE');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Save calculation history
  saveCalculation(data: {
    configurationId?: string;
    panelSpecs: PanelSpecifications;
    systemConfig: SystemConfiguration;
    results: ConfigurationResults;
    safetyChecks?: SafetyChecks;
    costAnalysis?: object;
  }): string {
    const id = `calc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const stmt = this.db.prepare(`
      INSERT INTO calculation_history (
        id, configuration_id, panel_specs, system_config, results, safety_checks, cost_analysis
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      data.configurationId || null,
      JSON.stringify(data.panelSpecs),
      JSON.stringify(data.systemConfig),
      JSON.stringify(data.results),
      JSON.stringify(data.safetyChecks),
      JSON.stringify(data.costAnalysis)
    );
    
    return id;
  }
  getCalculationHistory(limit: number = 50): Array<{
    id: string;
    panel_specs: string;
    system_config: string;
    results: string;
    created_at: string;
  }> {
    const stmt = this.db.prepare(`
      SELECT id, panel_specs, system_config, results, created_at
      FROM calculation_history 
      ORDER BY created_at DESC 
      LIMIT ?
    `);
    
    return stmt.all(limit) as Array<{
      id: string;
      panel_specs: string;
      system_config: string;
      results: string;
      created_at: string;
    }>;
  }

  // Database seeding methods
  seedCountry(country: CountryPricing): boolean {
    try {
      const stmt = this.db.prepare(`
        INSERT OR IGNORE INTO countries (
          id, name, currency_code, currency_name, currency_symbol,
          panel_cost_per_watt, installation_cost_per_watt, electricity_rate,
          labor_rate, permit_cost, max_system_voltage, requires_permit,
          grid_tie_allowed, net_metering_available
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run(
        country.id,
        country.name,
        country.currency.code,
        country.currency.name,
        country.currency.symbol,
        country.pricing.panelCostPerWatt,
        country.pricing.installationCostPerWatt,
        country.pricing.electricityRate,
        country.pricing.laborRate,
        country.pricing.permitCost,
        country.regulations.maxSystemVoltage,
        country.regulations.requiresPermit ? 1 : 0,
        country.regulations.gridTieAllowed ? 1 : 0,
        country.regulations.netMeteringAvailable ? 1 : 0
      );
      
      return result.changes > 0;
    } catch (error) {
      console.error('Failed to seed country:', error);
      return false;
    }
  }

  seedPanelPreset(preset: PanelPreset): boolean {
    try {
      const stmt = this.db.prepare(`
        INSERT OR IGNORE INTO panel_presets (
          id, name, description, manufacturer, model, category,
          voltage, current, power, voc, isc, max_series_fuse,
          max_system_voltage, temperature_coefficient, efficiency, is_custom
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run(
        preset.id,
        preset.name,
        preset.description || '',
        preset.manufacturer || '',
        preset.model || '',
        preset.category,
        preset.voltage,
        preset.current,
        preset.power,
        preset.voc,
        preset.isc,
        preset.maxSeriesFuse,
        preset.maxSystemVoltage,
        preset.temperatureCoefficient || null,
        preset.efficiency || null,
        preset.id.startsWith('custom-') ? 1 : 0
      );
      
      return result.changes > 0;
    } catch (error) {
      console.error('Failed to seed panel preset:', error);
      return false;
    }
  }
}

export default getDatabase;
