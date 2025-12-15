/**
 * Parse plants from Excel file
 */

import * as XLSX from 'xlsx';
import type { Plant } from '@/lib/domain/types';

export interface PlantData {
  code: string;
  name: string;
  erp?: string;
  city?: string;
  abbreviation?: string;
  country?: string;
  location?: string;
}

/**
 * Parse plants from Excel file buffer
 * Expected columns: Code, City, Country (or similar variations)
 */
export function parsePlants(buffer: Buffer): PlantData[] {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) return [];

    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null }) as unknown[][];

    if (rows.length < 2) return []; // Need at least header + 1 row

    // Find header row (usually first row)
    const headers = (rows[0] as string[]).map((h) => String(h || '').trim().toLowerCase());

    // Map column indices
    const codeIndex = headers.findIndex((h) =>
      ['code', 'plant code', 'site code', 'id', 'plant id', 'site id', 'plant'].some((term) =>
        h.includes(term)
      )
    );
    const erpIndex = headers.findIndex((h) =>
      ['erp', 'system', 'sap'].some((term) => h.includes(term))
    );
    const nameIndex = headers.findIndex((h) =>
      ['name', 'plant name', 'site name', 'description', 'city'].some((term) =>
        h.includes(term)
      )
    );
    const cityIndex = headers.findIndex((h) =>
      ['city', 'location', 'plant city'].some((term) => h.includes(term))
    );
    const abbreviationIndex = headers.findIndex((h) => {
      const lowerH = h.toLowerCase();
      return ['abbreviation', 'abbr', 'short'].some((term) => lowerH.includes(term)) && 
             !lowerH.includes('plant') && !lowerH.includes('site'); // Exclude "plant code" etc.
    });
    const countryIndex = headers.findIndex((h) =>
      ['country', 'nation'].some((term) => h.includes(term))
    );

    if (codeIndex === -1) {
      console.warn('Plants file: Could not find code column. Available columns:', headers);
      return [];
    }

    const plants: PlantData[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i] as unknown[];

      // Skip empty rows
      if (row.every((cell) => cell === null || cell === '' || cell === undefined)) {
        continue;
      }

      // Get code and ensure it's a string (handles numeric codes like 106)
      const codeValue = row[codeIndex];
      if (codeValue === null || codeValue === undefined) {
        console.warn(`Row ${i + 1}: Code is null/undefined, skipping`);
        continue;
      }
      
      // Convert to string - handle both numeric and string codes
      // Important: Handle numeric values like 106 correctly
      let code: string;
      if (typeof codeValue === 'number') {
        code = String(codeValue);
      } else {
        code = String(codeValue).trim();
      }
      
      // Skip if code is empty after trimming
      if (!code || code === '') {
        console.warn(`Row ${i + 1}: Empty code after conversion, skipping. Original value:`, codeValue);
        continue;
      }
      
      // Log plant 106 specifically for debugging
      if (code === '106' || codeValue === 106) {
        console.log(`Found plant 106 at row ${i + 1}:`, { code, row: row.slice(0, 5) });
      }

      const erp = erpIndex !== -1 ? String(row[erpIndex] || '').trim() : undefined;
      const name =
        nameIndex !== -1
          ? String(row[nameIndex] || '').trim()
          : cityIndex !== -1
            ? String(row[cityIndex] || '').trim()
            : code;
      const city = cityIndex !== -1 ? String(row[cityIndex] || '').trim() : undefined;
      const abbreviation = abbreviationIndex !== -1 ? String(row[abbreviationIndex] || '').trim() : undefined;
      const country = countryIndex !== -1 ? String(row[countryIndex] || '').trim() : undefined;

      const plant: PlantData = {
        code,
        name: name || code,
        erp: erp || undefined,
        city: city || undefined,
        abbreviation: abbreviation || undefined,
        country: country || undefined,
        location: country ? `${city || name}, ${country}` : city || name || code,
      };
      
      plants.push(plant);
    }

    // Log all parsed plants for debugging
    const plantCodes = plants.map(p => p.code).sort((a, b) => {
      const aNum = parseInt(a);
      const bNum = parseInt(b);
      if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
      return a.localeCompare(b);
    });
    console.log(`Parsed ${plants.length} plants. Codes: ${plantCodes.join(', ')}`);
    
    // Verify plant 106 is included
    const has106 = plants.some((p) => p.code === "106");
    if (!has106) {
      console.warn('Plant 106 not found in parsed plants. Available codes:', plantCodes);
    }
    
    return plants;
  } catch (error) {
    console.error('Error parsing plants file:', error);
    return [];
  }
}

