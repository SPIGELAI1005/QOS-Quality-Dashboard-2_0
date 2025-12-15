/**
 * Script to examine Excel file structure
 * Run with: npx tsx scripts/examine-excel.ts
 */

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

function examineFile(filePath: string) {
  console.log(`\n=== Examining: ${path.basename(filePath)} ===`);
  
  try {
    const buffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    
    console.log(`Sheets: ${workbook.SheetNames.join(', ')}`);
    
    workbook.SheetNames.forEach((sheetName, idx) => {
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null }) as unknown[][];
      
      if (rows.length === 0) {
        console.log(`  Sheet ${idx + 1} (${sheetName}): Empty`);
        return;
      }
      
      const headers = (rows[0] as string[]).map(h => String(h || '').trim());
      console.log(`  Sheet ${idx + 1} (${sheetName}):`);
      console.log(`    Headers (${headers.length}):`, headers.slice(0, 20).join(', '));
      console.log(`    Rows: ${rows.length - 1} (excluding header)`);
      
      if (rows.length > 1) {
        const firstRow = rows[1] as unknown[];
        console.log(`    First data row sample:`, firstRow.slice(0, 5).map(v => String(v || '').substring(0, 20)));
      }
    });
  } catch (error) {
    console.error(`Error reading file: ${error}`);
  }
}

const attachmentsDir = path.join(process.cwd(), 'attachments');
const files = [
  'Q Cockpit QOS ET_Complaints_Parts_PPM_PS4.XLSX',
  'QOS_ET_Complaints_2509112.xlsx',
  'Outbound 145_PS4.XLSX',
  'Webasto ET Plants .xlsx',
];

files.forEach(file => {
  const filePath = path.join(attachmentsDir, file);
  if (fs.existsSync(filePath)) {
    examineFile(filePath);
  } else {
    console.log(`\nFile not found: ${file}`);
  }
});

