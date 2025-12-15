/**
 * Simple test route to verify API routes are working
 */

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({ message: 'API routes are working!' });
}

export async function POST() {
  return NextResponse.json({ message: 'POST endpoint is working!' });
}

