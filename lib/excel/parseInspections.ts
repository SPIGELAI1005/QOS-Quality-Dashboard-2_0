/**
 * Parse Inspection/Review data from Excel file
 */

import * as XLSX from 'xlsx';

export interface Inspection {
  id: string;
  plant: string;
  siteCode: string;
  siteName?: string;
  date: Date;
  inspectionType?: string;
  result?: 'Pass' | 'Fail' | 'Pending';
  findings?: string;
  warehouse?: string;
}

/**
 * Parse inspections from Excel file buffer
 */
export function parseInspections(buffer: Buffer): Inspection[] {
  const inspections: Inspection[] = [];
  
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    
    if (workbook.SheetNames.length === 0) {
      console.warn('Inspection file has no worksheets');
      return [];
    }
    
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null }) as unknown[][];
    
    if (rows.length < 2) {
      console.warn('Inspection file has no data rows');
      return [];
    }
    
    const headers = (rows[0] as string[]).map((h) => String(h || '').trim().toLowerCase());
    
    // Map column indices
    const plantIndex = headers.findIndex((h) =>
      ['plant', 'werk', 'site', 'site code', 'plant code'].some((term) => h.includes(term))
    );
    const siteNameIndex = headers.findIndex((h) =>
      ['site name', 'plant name', 'location', 'city'].some((term) => h.includes(term))
    );
    const dateIndex = headers.findIndex((h) =>
      ['date', 'inspection date', 'review date', 'datum'].some((term) => h.includes(term))
    );
    const inspectionTypeIndex = headers.findIndex((h) =>
      ['type', 'inspection type', 'review type', 'category'].some((term) => h.includes(term))
    );
    const resultIndex = headers.findIndex((h) =>
      ['result', 'status', 'outcome', 'finding'].some((term) => h.includes(term))
    );
    const findingsIndex = headers.findIndex((h) =>
      ['findings', 'notes', 'comments', 'remarks'].some((term) => h.includes(term))
    );
    const warehouseIndex = headers.findIndex((h) =>
      ['warehouse', 'warehouse code', 'storage'].some((term) => h.includes(term))
    );
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i] as unknown[];
      
      if (row.every((cell) => cell === null || cell === '' || cell === undefined)) {
        continue;
      }
      
      const plant = plantIndex !== -1 ? String(row[plantIndex] || '').trim() : '';
      const siteName = siteNameIndex !== -1 ? String(row[siteNameIndex] || '').trim() : undefined;
      const dateRaw = dateIndex !== -1 ? row[dateIndex] : null;
      const inspectionType = inspectionTypeIndex !== -1 
        ? String(row[inspectionTypeIndex] || '').trim() 
        : undefined;
      const resultRaw = resultIndex !== -1 
        ? String(row[resultIndex] || '').trim() 
        : undefined;
      const findings = findingsIndex !== -1 
        ? String(row[findingsIndex] || '').trim() 
        : undefined;
      const warehouse = warehouseIndex !== -1 
        ? String(row[warehouseIndex] || '').trim() 
        : undefined;
      
      // Parse date
      let date: Date | null = null;
      if (dateRaw) {
        if (dateRaw instanceof Date) {
          date = dateRaw;
        } else {
          const dateStr = String(dateRaw);
          const parsed = new Date(dateStr);
          if (!isNaN(parsed.getTime())) {
            date = parsed;
          }
        }
      }
      
      // Parse result
      let result: 'Pass' | 'Fail' | 'Pending' | undefined = undefined;
      if (resultRaw) {
        const resultLower = resultRaw.toLowerCase();
        if (resultLower.includes('pass') || resultLower.includes('ok') || resultLower.includes('approved')) {
          result = 'Pass';
        } else if (resultLower.includes('fail') || resultLower.includes('reject') || resultLower.includes('non-conform')) {
          result = 'Fail';
        } else {
          result = 'Pending';
        }
      }
      
      if (!plant || !date) {
        continue;
      }
      
      inspections.push({
        id: `insp-${plant}-${i}-${date.getTime()}`,
        plant,
        siteCode: plant,
        siteName: siteName || plant,
        date,
        inspectionType,
        result,
        findings,
        warehouse,
      });
    }
    
    console.log(`Parsed ${inspections.length} inspections from file`);
    return inspections;
  } catch (error) {
    console.error('Error parsing inspection file:', error);
    return [];
  }
}

