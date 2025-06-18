import { NextResponse } from 'next/server';
import { DatabaseOperations } from '@/lib/database';

const db = new DatabaseOperations();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { panelSpecs, systemConfig, results, safetyChecks, costAnalysis } = body;
    
    if (!panelSpecs || !systemConfig || !results) {
      return NextResponse.json({ error: 'Required calculation data is missing' }, { status: 400 });
    }
    
    const calculationId = db.saveCalculation({
      panelSpecs,
      systemConfig,
      results,
      safetyChecks,
      costAnalysis
    });
    
    return NextResponse.json({ id: calculationId, success: true });
  } catch (error) {
    console.error('Failed to save calculation:', error);
    return NextResponse.json({ error: 'Failed to save calculation' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    
    const history = db.getCalculationHistory(limit);
    return NextResponse.json(history);
  } catch (error) {
    console.error('Failed to fetch calculation history:', error);
    return NextResponse.json({ error: 'Failed to fetch calculation history' }, { status: 500 });
  }
}
