/**
 * Excel parser for Delivery records
 * Handles SAP S/4HANA export formats with flexible column mapping
 */

import * as XLSX from 'xlsx';
import type { Delivery, DeliveryKind } from '@/lib/domain/types';
import { generateDeliveryId } from '@/lib/domain/types';
import {
  getDeliveryColumnMapping,
  DEFAULT_DELIVERY_COLUMN_MAPPING,
  type DeliveryColumnMapping,
} from '@/lib/config/columnMappings';

export type { DeliveryColumnMapping };

/**
 * Default column mappings for common SAP S/4HANA variations
 * @deprecated Use DEFAULT_DELIVERY_COLUMN_MAPPING from @/lib/config/columnMappings instead
 */
export const DEFAULT_DELIVERY_MAPPING: DeliveryColumnMapping = DEFAULT_DELIVERY_COLUMN_MAPPING;

/**
 * Normalize string for comparison (lowercase, trim, remove special chars)
 */
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Find matching column index in headers
 */
function findColumnIndex(
  headers: string[],
  possibleNames: string[]
): number | undefined {
  const normalizedHeaders = headers.map(normalizeString);

  for (const possibleName of possibleNames) {
    const normalized = normalizeString(possibleName);
    const index = normalizedHeaders.findIndex(
      (h) => h === normalized || h.includes(normalized) || normalized.includes(h)
    );
    if (index !== -1) {
      return index;
    }
  }

  return undefined;
}

/**
 * Map Excel headers to column indices
 */
function mapHeaders(
  headers: string[],
  mapping: DeliveryColumnMapping
): Record<keyof DeliveryColumnMapping, number | undefined> {
  const result: Record<string, number | undefined> = {};

  for (const [key, possibleNames] of Object.entries(mapping)) {
    if (possibleNames && possibleNames.length > 0) {
      result[key] = findColumnIndex(headers, possibleNames);
    }
  }

  return result as Record<keyof DeliveryColumnMapping, number | undefined>;
}

/**
 * Extract value from row using column index
 */
function extractValue(
  row: unknown[],
  columnIndex: number | undefined,
  defaultValue: unknown = undefined
): unknown {
  if (columnIndex === undefined) return defaultValue;
  const value = row[columnIndex];
  return value !== undefined && value !== null && value !== '' ? value : defaultValue;
}

/**
 * Parse date from various formats
 */
function parseDate(value: unknown): Date | null {
  if (!value) return null;

  // If already a Date object
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  // If it's a number (Excel serial date)
  if (typeof value === 'number') {
    // Excel serial date: days since 1900-01-01
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
    return isNaN(date.getTime()) ? null : date;
  }

  // If it's a string, try to parse it
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;

    // Try ISO format first
    const isoDate = new Date(trimmed);
    if (!isNaN(isoDate.getTime())) return isoDate;

    // Try common formats
    const formats = [
      /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
      /(\d{2})\/(\d{2})\/(\d{4})/, // MM/DD/YYYY
      /(\d{2})\.(\d{2})\.(\d{4})/, // DD.MM.YYYY
      /(\d{4})(\d{2})(\d{2})/, // YYYYMMDD
    ];

    for (const format of formats) {
      const match = trimmed.match(format);
      if (match) {
        let year: number, month: number, day: number;
        if (format === formats[0]) {
          // YYYY-MM-DD
          [, year, month, day] = match.map(Number);
        } else if (format === formats[1]) {
          // MM/DD/YYYY
          [, month, day, year] = match.map(Number);
        } else if (format === formats[2]) {
          // DD.MM.YYYY
          [, day, month, year] = match.map(Number);
        } else {
          // YYYYMMDD
          [, year, month, day] = [
            match[1],
            match[2],
            match[3],
          ].map(Number);
        }
        const date = new Date(year, month - 1, day);
        if (!isNaN(date.getTime())) return date;
      }
    }
  }

  return null;
}

/**
 * Parse number from various formats
 */
function parseNumber(value: unknown): number {
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^\d.-]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

/**
 * Extract plant number from filename
 * Example: "Outbound 235_PS4" -> "235"
 */
function extractPlantFromFileName(fileName?: string): string | null {
  if (!fileName) return null;
  
  // Match pattern: "Outbound" or "Inbound" followed by space and number
  // Examples: "Outbound 235_PS4", "Inbound 411", "Outbound_235_PS4"
  const match = fileName.match(/(?:outbound|inbound)[\s_]+(\d+)/i);
  if (match && match[1]) {
    return match[1];
  }
  
  // Alternative: match any number after "Outbound" or "Inbound"
  const altMatch = fileName.match(/(?:outbound|inbound).*?(\d{3,})/i);
  if (altMatch && altMatch[1]) {
    return altMatch[1];
  }
  
  return null;
}

/**
 * Parse delivery kind from value or filename
 */
function parseDeliveryKind(
  value: unknown,
  fileName?: string
): DeliveryKind {
  // Try to parse from column value first
  if (value) {
    const str = String(value).toLowerCase().trim();
    if (str.includes('customer') || str === 'c' || str === 'cust' || str.includes('outbound') || str.includes('out')) {
      return 'Customer';
    }
    if (str.includes('supplier') || str === 's' || str === 'supp' || str.includes('inbound') || str.includes('in')) {
      return 'Supplier';
    }
  }

  // Fall back to filename detection
  if (fileName) {
    const fileNameLower = fileName.toLowerCase();
    if (fileNameLower.includes('outbound') || fileNameLower.includes('out')) {
      return 'Customer';
    }
    if (fileNameLower.includes('inbound') || fileNameLower.includes('in')) {
      return 'Supplier';
    }
  }

  // Default to Customer if uncertain
  return 'Customer';
}

/**
 * Parse deliveries from Excel file buffer
 * Aggregates quantities by plant, date, and kind (Customer/Supplier)
 * Returns one Delivery record per plant-date-kind combination with summed quantities
 */
export function parseDeliveries(
  buffer: Buffer,
  mapping?: DeliveryColumnMapping,
  fileName?: string
): Delivery[] {
  const columnMapping = mapping || getDeliveryColumnMapping();
  // Use a Map to aggregate quantities by plant-date-kind combination
  // Key: `${plant}-${dateKey}-${kind}`
  const deliveryMap = new Map<string, { plant: string; siteCode: string; siteName?: string; date: Date; quantity: number; kind: DeliveryKind }>();
  const errors: string[] = [];

  try {
    // Parse Excel file
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });

    if (workbook.SheetNames.length === 0) {
      console.warn('Excel file has no worksheets');
      return [];
    }

    // Get first worksheet
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convert to JSON array
    const rows = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: null,
    }) as unknown[][];

    if (rows.length < 2) {
      console.warn('Excel file has no data rows (only header or empty)');
      return [];
    }

    // Get headers from first row
    const headers = (rows[0] as string[]).map((h) => String(h || '').trim());
    const columnMap = mapHeaders(headers, columnMapping);

    // Log detected columns for debugging
    console.log(`[parseDeliveries] File: ${fileName || 'unknown'}`);
    console.log(`[parseDeliveries] Available columns: ${headers.join(', ')}`);
    console.log(`[parseDeliveries] Mapped columns:`, {
      plant: columnMap.plant !== undefined ? headers[columnMap.plant] : 'NOT FOUND',
      date: columnMap.date !== undefined ? headers[columnMap.date] : 'NOT FOUND',
      quantity: columnMap.quantity !== undefined ? headers[columnMap.quantity] : 'NOT FOUND',
      actualGoodsIssueDate: columnMap.actualGoodsIssueDate !== undefined ? headers[columnMap.actualGoodsIssueDate] : 'NOT FOUND',
      actualGoodsReceiptDate: columnMap.actualGoodsReceiptDate !== undefined ? headers[columnMap.actualGoodsReceiptDate] : 'NOT FOUND',
    });

    // For Outbound files (Customer deliveries), "Actual Goods Issue Date" is preferred
    // This indicates the delivery has been completed
    const isOutboundFile = fileName && (fileName.toLowerCase().includes('outbound') || fileName.toLowerCase().includes('out'));
    
    // For Inbound files (Supplier deliveries), "Actual Goods Receipt Date" is preferred
    // This indicates the delivery has been received
    const isInboundFile = fileName && (fileName.toLowerCase().includes('inbound') || fileName.toLowerCase().includes('in'));
    
    console.log(`[parseDeliveries] File type: ${isOutboundFile ? 'Outbound' : isInboundFile ? 'Inbound' : 'Unknown'}`);
    
    // Try to extract plant from filename first
    const plantFromFileName = (isOutboundFile || isInboundFile) ? extractPlantFromFileName(fileName) : null;
    console.log(`[parseDeliveries] Plant extracted from filename: ${plantFromFileName || 'NOT FOUND'}`);
    
    // Validate required columns
    // Plant is optional if we can extract it from filename
    const requiredColumns: (keyof DeliveryColumnMapping)[] = ['date', 'quantity'];
    const optionalColumns: (keyof DeliveryColumnMapping)[] = ['plant'];

    const missingColumns = requiredColumns.filter((col) => columnMap[col] === undefined);
    if (missingColumns.length > 0) {
      console.error(
        `[parseDeliveries] ERROR: Missing required columns: ${missingColumns.join(', ')}`
      );
      console.error(
        `[parseDeliveries] Available columns in file: ${headers.join(', ')}`
      );
      console.error(
        `[parseDeliveries] Column mapping attempted:`, {
          plant: columnMapping.plant,
          date: columnMapping.date,
          quantity: columnMapping.quantity,
        }
      );
      return [];
    }
    
    // Check if plant column is missing and we can't extract from filename
    if (columnMap.plant === undefined && !plantFromFileName) {
      console.error(
        `[parseDeliveries] ERROR: Missing plant column and cannot extract from filename`
      );
      console.error(
        `[parseDeliveries] Available columns in file: ${headers.join(', ')}`
      );
      console.error(
        `[parseDeliveries] Filename: ${fileName}`
      );
      return [];
    }
    
    if (columnMap.plant === undefined && plantFromFileName) {
      console.log(`[parseDeliveries] Plant column not found in file, but extracted from filename: ${plantFromFileName}`);
    }

    // Process data rows
    let rowsProcessed = 0;
    let rowsSkippedEmpty = 0;
    let rowsSkippedNoDate = 0;
    let rowsSkippedNoPlant = 0;
    let rowsSkippedNoQuantity = 0;
    let rowsAdded = 0;
    
    console.log(`[parseDeliveries] Total rows in file: ${rows.length - 1} (excluding header)`);
    
    // Log sample of first few data rows for debugging
    if (rows.length > 1) {
      console.log(`[parseDeliveries] Sample data row (row 2):`, rows[1]);
      if (rows.length > 2) {
        console.log(`[parseDeliveries] Sample data row (row 3):`, rows[2]);
      }
    }
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i] as unknown[];
      rowsProcessed++;

      // Skip empty rows
      if (row.every((cell) => cell === null || cell === '' || cell === undefined)) {
        rowsSkippedEmpty++;
        continue;
      }

      try {
        // Extract values from row
        // For plant: use column value if available, otherwise use filename extraction
        let plant = '';
        if (columnMap.plant !== undefined) {
          plant = String(extractValue(row, columnMap.plant, '') || '').trim();
        }
        
        // For Outbound and Inbound files, prefer plant number from filename (already extracted above)
        // This is more reliable than column values which might be inconsistent
        if ((isOutboundFile || isInboundFile) && plantFromFileName) {
          plant = plantFromFileName;
        } else if (!plant && plantFromFileName) {
          // Fallback: use filename if column value is empty
          plant = plantFromFileName;
        }
        
        // Final validation: plant must be set
        if (!plant) {
          rowsSkippedNoPlant++;
          if (rowsSkippedNoPlant <= 3) {
            console.log(`[parseDeliveries] Row ${i + 1} skipped: Missing plant (cannot extract from filename and no plant column)`);
          }
          errors.push(`Row ${i + 1}: Missing plant (cannot extract from filename and no plant column)`);
          continue;
        }
        
        const siteCode =
          String(extractValue(row, columnMap.siteCode, '') || plant).trim() || plant;
        const siteName = columnMap.siteName
          ? String(extractValue(row, columnMap.siteName, '') || '').trim() || undefined
          : undefined;

        // For Outbound files, prefer "Actual Goods Issue Date" if available
        // For Inbound files, prefer "Actual Goods Receipt Date" if available
        // Otherwise, use the regular date column
        const actualGoodsIssueDate = columnMap.actualGoodsIssueDate !== undefined
          ? parseDate(extractValue(row, columnMap.actualGoodsIssueDate))
          : null;
        
        const actualGoodsReceiptDate = columnMap.actualGoodsReceiptDate !== undefined
          ? parseDate(extractValue(row, columnMap.actualGoodsReceiptDate))
          : null;
        
        const regularDate = parseDate(extractValue(row, columnMap.date));
        
        // Log first few rows with date extraction details for debugging
        if (i <= 3) {
          console.log(`[parseDeliveries] Row ${i + 1} date extraction:`, {
            actualGoodsIssueDate: actualGoodsIssueDate ? actualGoodsIssueDate.toISOString() : null,
            actualGoodsReceiptDate: actualGoodsReceiptDate ? actualGoodsReceiptDate.toISOString() : null,
            regularDate: regularDate ? regularDate.toISOString() : null,
            rawIssueDate: columnMap.actualGoodsIssueDate !== undefined ? extractValue(row, columnMap.actualGoodsIssueDate) : 'N/A',
            rawReceiptDate: columnMap.actualGoodsReceiptDate !== undefined ? extractValue(row, columnMap.actualGoodsReceiptDate) : 'N/A',
            rawRegularDate: extractValue(row, columnMap.date),
            isOutbound: isOutboundFile,
            isInbound: isInboundFile,
          });
        }
        
        // Determine the date to use and whether to include this row
        let date: Date | null = null;
        let shouldInclude = true;
        
        if (isOutboundFile) {
          // For Outbound files, prefer "Actual Goods Issue Date" if the column exists
          if (columnMap.actualGoodsIssueDate !== undefined) {
            // Column exists - only include rows with a valid date
            if (actualGoodsIssueDate) {
              date = actualGoodsIssueDate;
            } else {
              // Skip rows without "Actual Goods Issue Date" when the column exists
              shouldInclude = false;
            }
          } else {
            // Column doesn't exist - use regular date column
            date = regularDate;
          }
        } else if (isInboundFile) {
          // For Inbound files, prefer "Actual Goods Receipt Date" if the column exists
          if (columnMap.actualGoodsReceiptDate !== undefined) {
            // Column exists - only include rows with a valid date
            if (actualGoodsReceiptDate) {
              date = actualGoodsReceiptDate;
            } else {
              // Skip rows without "Actual Goods Receipt Date" when the column exists
              shouldInclude = false;
            }
          } else {
            // Column doesn't exist - use regular date column
            date = regularDate;
          }
        } else {
          // Not an Outbound/Inbound file - use regular date column or actual dates if available
          date = actualGoodsIssueDate || actualGoodsReceiptDate || regularDate;
        }
        
        // Skip this row if we determined it shouldn't be included
        if (!shouldInclude) {
          rowsSkippedNoDate++;
          if (rowsSkippedNoDate <= 3) {
            console.log(`[parseDeliveries] Row ${i + 1} skipped: No valid date (Outbound needs Actual Goods Issue Date, Inbound needs Actual Goods Receipt Date)`);
            if (isOutboundFile) {
              console.log(`[parseDeliveries]   actualGoodsIssueDate: ${actualGoodsIssueDate ? actualGoodsIssueDate.toISOString() : 'null'}, regularDate: ${regularDate ? regularDate.toISOString() : 'null'}`);
            } else if (isInboundFile) {
              console.log(`[parseDeliveries]   actualGoodsReceiptDate: ${actualGoodsReceiptDate ? actualGoodsReceiptDate.toISOString() : 'null'}, regularDate: ${regularDate ? regularDate.toISOString() : 'null'}`);
            }
          }
          continue;
        }
        const quantity = parseNumber(extractValue(row, columnMap.quantity));
        const kindValue = extractValue(row, columnMap.kind);
        const kind = parseDeliveryKind(kindValue, fileName);

        // Validate critical fields
        if (!siteCode) {
          errors.push(`Row ${i + 1}: Missing plant/site code`);
          continue;
        }

        if (!date) {
          rowsSkippedNoDate++;
          if (rowsSkippedNoDate <= 3) {
            console.log(`[parseDeliveries] Row ${i + 1} skipped: No valid date`);
          }
          errors.push(`Row ${i + 1}: Missing or invalid date`);
          continue;
        }

        if (quantity <= 0) {
          rowsSkippedNoQuantity++;
          if (rowsSkippedNoQuantity <= 3) {
            console.log(`[parseDeliveries] Row ${i + 1} skipped: Quantity is ${quantity} (must be > 0)`);
          }
          continue;
        }
        
        rowsAdded++;

        // Create a key for aggregation: plant-date-kind
        // Use year-month for date key to aggregate by month
        const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const aggregationKey = `${plant || siteCode}-${dateKey}-${kind}`;
        
        // Aggregate quantities by plant-date-kind combination
        if (deliveryMap.has(aggregationKey)) {
          // Add quantity to existing aggregated delivery
          const existing = deliveryMap.get(aggregationKey)!;
          existing.quantity += Math.max(0, quantity);
        } else {
          // Create new aggregated delivery record
          deliveryMap.set(aggregationKey, {
            plant: plant || siteCode,
            siteCode,
            siteName,
            date, // Keep the first date encountered for this aggregation key
            quantity: Math.max(0, quantity),
            kind,
          });
        }
      } catch (error) {
        errors.push(
          `Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        console.error(`Error parsing row ${i + 1}:`, error);
      }
    }

    // Convert aggregated map to Delivery array with IDs
    const deliveries: Delivery[] = Array.from(deliveryMap.values()).map((agg) => {
      const id = generateDeliveryId(agg.plant, agg.siteCode, agg.date, agg.kind);
      return {
        id,
        plant: agg.plant,
        siteCode: agg.siteCode,
        siteName: agg.siteName,
        date: agg.date,
        quantity: agg.quantity,
        kind: agg.kind,
      };
    });

    // Log comprehensive summary
    const totalQuantity = deliveries.reduce((sum, d) => sum + d.quantity, 0);
    console.log(`[parseDeliveries] ===== PARSING SUMMARY =====`);
    console.log(`[parseDeliveries] File: ${fileName || 'unknown'}`);
    console.log(`[parseDeliveries] Total rows processed: ${rowsProcessed}`);
    console.log(`[parseDeliveries] Rows skipped (empty): ${rowsSkippedEmpty}`);
    console.log(`[parseDeliveries] Rows skipped (no date): ${rowsSkippedNoDate}`);
    console.log(`[parseDeliveries] Rows skipped (no plant): ${rowsSkippedNoPlant}`);
    console.log(`[parseDeliveries] Rows skipped (no quantity): ${rowsSkippedNoQuantity}`);
    console.log(`[parseDeliveries] Rows successfully added: ${rowsAdded}`);
    console.log(`[parseDeliveries] Aggregated deliveries created: ${deliveries.length}`);
    console.log(`[parseDeliveries] Total quantity across all deliveries: ${totalQuantity}`);
    if (deliveries.length > 0) {
      console.log(`[parseDeliveries] Sample delivery:`, {
        plant: deliveries[0].plant,
        siteCode: deliveries[0].siteCode,
        date: deliveries[0].date.toISOString().split('T')[0],
        quantity: deliveries[0].quantity,
        kind: deliveries[0].kind,
      });
    }
    console.log(`[parseDeliveries] ===========================`);

    // Log errors if any
    if (errors.length > 0) {
      console.warn(`[parseDeliveries] Parsed ${deliveries.length} aggregated deliveries from ${rows.length - 1} rows with ${errors.length} errors:`);
      errors.slice(0, 10).forEach((error) => console.warn(`  - ${error}`)); // Only show first 10 errors
      if (errors.length > 10) {
        console.warn(`  ... and ${errors.length - 10} more errors`);
      }
    } else {
      console.log(`[parseDeliveries] Successfully parsed ${deliveries.length} aggregated deliveries (from ${rows.length - 1} data rows) from ${fileName || 'unknown file'}`);
      if (deliveries.length > 0) {
        const totalQuantity = deliveries.reduce((sum, d) => sum + d.quantity, 0);
        console.log(`[parseDeliveries] Total quantity across all deliveries: ${totalQuantity.toLocaleString('de-DE')}`);
      }
    }
    
    if (deliveries.length === 0 && rows.length > 1) {
      console.warn(`[parseDeliveries] WARNING: No deliveries parsed from ${rows.length - 1} data rows. Check column mappings and date filtering logic.`);
    }
    
    return deliveries;
  } catch (error) {
    console.error('Error parsing Excel file:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', errorMessage);
    throw new Error(
      `Failed to parse deliveries: ${errorMessage}`
    );
  }
}

