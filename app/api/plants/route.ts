/**
 * API endpoint to get plant data
 * Uses "Webasto ET Plants.xlsx" from attachments folder as the authoritative source
 * This file is the reference for all plant numbers and locations
 */

import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import { parsePlants } from '@/lib/excel/parsePlants';

export async function GET() {
  try {
    // Reference file: "Webasto ET Plants .xlsx" (note: space at end)
    // This file is the authoritative source for plant validation
    let filePath = join(process.cwd(), 'attachments', 'Webasto ET Plants .xlsx');
    
    // If file doesn't exist, try without space
    try {
      readFileSync(filePath);
    } catch {
      filePath = join(process.cwd(), 'attachments', 'Webasto ET Plants.xlsx');
    }
    
    const buffer = readFileSync(filePath);
    const plants = parsePlants(buffer);
    
    const plantCodes = plants.map(p => p.code).sort((a, b) => {
      const aNum = parseInt(a);
      const bNum = parseInt(b);
      if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
      return a.localeCompare(b);
    });
    
    console.log(`Loaded ${plants.length} plants from ${filePath}`);
    console.log(`Plant codes: ${plantCodes.join(', ')}`);
    
    // Check if plant 106 exists
    const has106 = plants.some(p => String(p.code) === '106');
    if (!has106) {
      console.warn('WARNING: Plant 106 not found in loaded plants!');
    }
    
    return NextResponse.json({ plants });
  } catch (error) {
    console.error('Error loading plants:', error);
    // Return empty array instead of error to allow fallback
    return NextResponse.json({ plants: [] });
  }
}

