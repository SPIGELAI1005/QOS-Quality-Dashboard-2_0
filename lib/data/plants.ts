/**
 * Plant data management
 * Loads and caches plant data from "Webasto ET Plants.xlsx" Excel file
 * This file is the authoritative source for plant validation and location data
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { parsePlants, type PlantData } from '@/lib/excel/parsePlants';

let cachedPlants: PlantData[] | null = null;

/**
 * Load plants from Excel file
 * Uses "Webasto ET Plants.xlsx" from attachments folder as reference
 */
export function loadPlants(): PlantData[] {
  if (cachedPlants) {
    return cachedPlants;
  }

  try {
    // Reference file: "Webasto ET Plants .xlsx" (note: space at end)
    let filePath = join(process.cwd(), 'attachments', 'Webasto ET Plants .xlsx');
    
    // If file doesn't exist, try without space
    try {
      readFileSync(filePath);
    } catch {
      filePath = join(process.cwd(), 'attachments', 'Webasto ET Plants.xlsx');
    }
    
    const buffer = readFileSync(filePath);
    cachedPlants = parsePlants(buffer);
    console.log(`[Plants] Loaded ${cachedPlants.length} plants from official reference file`);
    return cachedPlants;
  } catch (error) {
    console.error('Error loading plants file:', error);
    return [];
  }
}

/**
 * Get plant by code
 */
export function getPlantByCode(code: string): PlantData | undefined {
  const plants = loadPlants();
  return plants.find((p) => p.code === code);
}

/**
 * Get all plant codes
 */
export function getAllPlantCodes(): string[] {
  const plants = loadPlants();
  return plants.map((p) => p.code).sort();
}

