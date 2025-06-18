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
        const seeded = db.seedCountry(country);
        if (seeded) countriesSeeded++;
      }
    }

    // Seed panel presets
    let presetsSeeded = 0;
    if (existingPresets.length === 0) {
      for (const preset of PANEL_PRESETS) {
        const seeded = db.seedPanelPreset(preset);
        if (seeded) presetsSeeded++;
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      countriesSeeded,
      presetsSeeded,
      totalCountries: existingCountries.length + countriesSeeded,
      totalPresets: existingPresets.length + presetsSeeded
    });
    
  } catch (error) {
    console.error('Database seeding error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to seed database',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const countries = db.getAllCountries();
    const presets = db.getAllPanelPresets();
    
    return NextResponse.json({
      countries: countries.length,
      presets: presets.length,
      seeded: countries.length > 0 && presets.length > 0
    });
  } catch (error) {
    console.error('Database status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check database status' },
      { status: 500 }
    );
  }
}
