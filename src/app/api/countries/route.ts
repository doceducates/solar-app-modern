import { NextResponse } from 'next/server';
import { DatabaseOperations } from '@/lib/database';

const db = new DatabaseOperations();

export async function GET() {
  try {
    const countries = db.getAllCountries();
    return NextResponse.json(countries);
  } catch (error) {
    console.error('Failed to fetch countries:', error);
    return NextResponse.json({ error: 'Failed to fetch countries' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'Country ID is required' }, { status: 400 });
    }
    
    const country = db.getCountryById(id);
    if (!country) {
      return NextResponse.json({ error: 'Country not found' }, { status: 404 });
    }
    
    return NextResponse.json(country);
  } catch (error) {
    console.error('Failed to fetch country:', error);
    return NextResponse.json({ error: 'Failed to fetch country' }, { status: 500 });
  }
}
