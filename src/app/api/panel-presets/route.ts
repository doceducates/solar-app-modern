import { NextResponse } from 'next/server';
import { DatabaseOperations } from '@/lib/database';

const db = new DatabaseOperations();

export async function GET() {
  try {
    const presets = db.getAllPanelPresets();
    return NextResponse.json(presets);
  } catch (error) {
    console.error('Failed to fetch panel presets:', error);
    return NextResponse.json({ error: 'Failed to fetch panel presets' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { preset } = body;
    
    if (!preset) {
      return NextResponse.json({ error: 'Preset data is required' }, { status: 400 });
    }
    
    const presetId = db.addPanelPreset({ ...preset, isCustom: true });
    const savedPreset = db.getPanelPresetById(presetId);
    
    return NextResponse.json(savedPreset);
  } catch (error) {
    console.error('Failed to add panel preset:', error);
    return NextResponse.json({ error: 'Failed to add panel preset' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Preset ID is required' }, { status: 400 });
    }
    
    const success = db.deletePanelPreset(id);
    if (!success) {
      return NextResponse.json({ error: 'Failed to delete preset or preset not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete panel preset:', error);
    return NextResponse.json({ error: 'Failed to delete panel preset' }, { status: 500 });
  }
}
