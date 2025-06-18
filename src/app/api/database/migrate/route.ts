import { NextResponse } from 'next/server';
import { DatabaseOperations } from '@/lib/database';
import { COUNTRIES } from '@/constants/countries';
import { PANEL_PRESETS } from '@/constants/panels';

const db = new DatabaseOperations();

export async function GET() {
  try {
    // Check current database status
    const countries = db.getAllCountries();
    const presets = db.getAllPanelPresets();
    
    return NextResponse.json({
      status: 'ready_for_migration',
      current_data: {
        countries: countries.length,
        presets: presets.length
      },
      available_data: {
        countries: COUNTRIES.length,
        presets: PANEL_PRESETS.length
      },
      message: 'Use POST to run migration/seeding'
    });
  } catch (error) {
    console.error('Migration status check failed:', error);
    return NextResponse.json({ 
      error: 'Failed to check migration status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { force = false, clear = false } = body;
    
    console.log('🚀 Starting database migration...');
    console.log(`Force mode: ${force}, Clear existing: ${clear}`);
      let countriesSeeded = 0;
    let presetsSeeded = 0;
    const errors: string[] = [];
    
    // Clear existing data if requested
    if (clear) {      try {
        console.log('🗑️ Clearing existing data...');
        db.clearAllData();
        console.log('Data cleared successfully');
      } catch (error) {
        console.error('Failed to clear data:', error);
        errors.push(`Clear failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    // Seed countries
    console.log('🌍 Seeding countries...');
    for (const country of COUNTRIES) {
      try {
        const success = db.seedCountry(country);
        if (success) {
          countriesSeeded++;
          console.log(`✅ Seeded country: ${country.name}`);
        } else {
          console.log(`⏭️ Skipped country: ${country.name} (already exists)`);
        }
      } catch (error) {
        const errorMsg = `Failed to seed country ${country.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(`❌ ${errorMsg}`);
        errors.push(errorMsg);
      }
    }
      // Seed panel presets
    console.log('🔌 Seeding panel presets...');
    console.log(`Found ${PANEL_PRESETS.length} panel presets to seed`);
    for (const preset of PANEL_PRESETS) {
      try {
        console.log(`Attempting to seed preset: ${preset.name}`);
        console.log(`Preset details:`, {
          id: preset.id,
          voltage: preset.voltage,
          current: preset.current,
          power: preset.power,
          voc: preset.voc,
          isc: preset.isc
        });
        const success = db.seedPanelPreset(preset);
        if (success) {
          presetsSeeded++;
          console.log(`✅ Seeded preset: ${preset.name}`);
        } else {
          console.log(`⏭️ Skipped preset: ${preset.name} (already exists)`);
        }
      } catch (error) {
        const errorMsg = `Failed to seed preset ${preset.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(`❌ ${errorMsg}`);
        console.error('Full error:', error);
        errors.push(errorMsg);
      }
    }
    
    // Final verification
    const finalCountries = db.getAllCountries();
    const finalPresets = db.getAllPanelPresets();
    
    console.log('✨ Migration completed!');
    console.log(`📊 Final counts - Countries: ${finalCountries.length}, Presets: ${finalPresets.length}`);
    
    const result = {
      success: true,
      message: 'Database migration completed',
      seeded: {
        countries: countriesSeeded,
        presets: presetsSeeded
      },
      final_counts: {
        countries: finalCountries.length,
        presets: finalPresets.length
      },
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString()
    };
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Migration failed:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function DELETE() {  try {
    console.log('🗑️ Clearing all database data...');
    
    db.clearAllData();
    
    console.log('✅ Database cleared successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Database cleared successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Failed to clear database:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to clear database',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
