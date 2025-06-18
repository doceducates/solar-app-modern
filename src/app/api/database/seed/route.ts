import { NextResponse } from 'next/server';
import { DatabaseOperations } from '@/lib/database';
import { COUNTRIES } from '@/constants/countries';
import { PANEL_PRESETS } from '@/constants/panels';

const db = new DatabaseOperations();

export async function POST() {
  try {
    // Check if database already has data
    const existingCountries = db.getAllCountries();
    const existingPresets = db.getAllPanelPresets();
    
    if (existingCountries.length > 0 && existingPresets.length > 0) {
      return NextResponse.json({ 
        message: 'Database already seeded',
        countries: existingCountries.length,
        presets: existingPresets.length 
      });
    }
      // Seed countries
    let countriesSeeded = 0;
    if (existingCountries.length === 0) {
      for (const country of COUNTRIES) {
        // Use the addCountry method if it exists, or create one
        const dbInstance = (db as any).db; // Access the private db instance
        const insertCountry = dbInstance.prepare(`
          INSERT OR IGNORE INTO countries (
            id, name, currency_code, currency_name, currency_symbol,
            panel_cost_per_watt, installation_cost_per_watt, electricity_rate,
            labor_rate, permit_cost, max_system_voltage, requires_permit,
            grid_tie_allowed, net_metering_available
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        insertCountry.run(
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
        countriesSeeded++;
      }
    }
    
    // Seed panel presets
    let presetsSeeded = 0;
    if (existingPresets.length === 0) {
      for (const preset of PANEL_PRESETS) {
        db.addPanelPreset({
          ...preset,
          isCustom: false
        });
        presetsSeeded++;
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      countriesSeeded,
      presetsSeeded
    });
    
  } catch (error) {
    console.error('Failed to seed database:', error);
    return NextResponse.json({ 
      error: 'Failed to seed database',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const countries = db.getAllCountries();
    const presets = db.getAllPanelPresets();
    
    return NextResponse.json({
      status: 'Database status',
      countries: countries.length,
      presets: presets.length,
      needsSeeding: countries.length === 0 || presets.length === 0
    });
  } catch (error) {
    console.error('Failed to check database status:', error);
    return NextResponse.json({ error: 'Failed to check database status' }, { status: 500 });
  }
}
