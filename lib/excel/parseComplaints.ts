/**
 * Excel parser for Complaint notifications
 * Handles SAP S/4HANA export formats with flexible column mapping
 */

import * as XLSX from 'xlsx';
import type { Complaint, NotificationType, DataSource, UnitConversion } from '@/lib/domain/types';
import {
  getCategoryFromNotificationType,
  parseNotificationType,
  generateComplaintId,
} from '@/lib/domain/types';
import {
  getComplaintColumnMapping,
  type ComplaintColumnMapping,
  DEFAULT_COMPLAINT_COLUMN_MAPPING,
} from '@/lib/config/columnMappings';

export type { ComplaintColumnMapping };

/**
 * Default column mappings for common SAP S/4HANA variations
 * @deprecated Use DEFAULT_COMPLAINT_COLUMN_MAPPING from @/lib/config/columnMappings instead
 */
export const DEFAULT_COMPLAINT_MAPPING: ComplaintColumnMapping = DEFAULT_COMPLAINT_COLUMN_MAPPING;

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
  mapping: ComplaintColumnMapping
): Record<keyof ComplaintColumnMapping, number | undefined> {
  const result: Record<string, number | undefined> = {};

  for (const [key, possibleNames] of Object.entries(mapping)) {
    if (possibleNames && possibleNames.length > 0) {
      result[key] = findColumnIndex(headers, possibleNames);
    }
  }

  return result as Record<keyof ComplaintColumnMapping, number | undefined>;
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
 * Extract bottle size from material description (e.g., "600 ML" or "600ML")
 * Returns the number in ML if found, or null
 */
function extractBottleSizeFromDescription(description: string): number | null {
  if (!description) return null;
  
  // Try to match patterns like "600 ML", "600ML", "600 ml", "600ml", etc.
  const patterns = [
    /(\d+(?:\.\d+)?)\s*ml/i, // "600 ML" or "600.5 ML"
    /(\d+(?:\.\d+)?)ml/i,     // "600ML"
  ];
  
  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match) {
      const size = parseFloat(match[1]);
      if (!isNaN(size) && size > 0) {
        return size;
      }
    }
  }
  
  return null;
}

/**
 * Extract length from material description for M (meters) unit
 * Looks for patterns like "L6100MM", "L6100", "LENGTH 6100MM", etc.
 * Returns length in meters if found, or null
 */
function extractLengthFromDescription(description: string): number | null {
  if (!description) return null;
  
  // Patterns to match length specifications:
  // - "L6100MM" or "L 6100MM" → 6100mm = 6.1m
  // - "L6100" → 6100mm = 6.1m (assume mm if no unit)
  // - "LENGTH 6100MM" or "LEN 6100MM"
  // - "6100MM" with L prefix context
  const patterns = [
    /L\s*(\d+(?:\.\d+)?)\s*MM/i,        // "L6100MM" or "L 6100MM"
    /L\s*(\d+(?:\.\d+)?)\s*M\b/i,        // "L6100M" (meters, not mm)
    /LENGTH\s*(\d+(?:\.\d+)?)\s*MM/i,    // "LENGTH 6100MM"
    /LEN\s*(\d+(?:\.\d+)?)\s*MM/i,       // "LEN 6100MM"
    /L\s*(\d{3,})\b/i,                   // "L6100" (assume mm if 3+ digits)
  ];
  
  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match) {
      const lengthValue = parseFloat(match[1]);
      if (!isNaN(lengthValue) && lengthValue > 0) {
        // If pattern contains "MM" or is 3+ digits without unit, assume mm and convert to m
        if (pattern.source.includes('MM') || (pattern.source.includes('\\d{3,}') && !pattern.source.includes('M\\b'))) {
          return lengthValue / 1000; // Convert mm to m
        } else {
          // Already in meters
          return lengthValue;
        }
      }
    }
  }
  
  return null;
}

/**
 * Extract area from material description for M2 (square meters) unit
 * Looks for patterns like dimensions (WxH, WIDTHxHEIGHT, etc.)
 * Returns area in m2 if found, or null
 */
function extractAreaFromDescription(description: string): number | null {
  if (!description) return null;
  
  // Patterns to match area/dimensions:
  // - "W1000MM H2000MM" → 1000mm x 2000mm = 1m x 2m = 2m2
  // - "1000x2000MM" → 1000mm x 2000mm = 2m2
  // - "WIDTH 1000MM HEIGHT 2000MM"
  const patterns = [
    /W\s*(\d+(?:\.\d+)?)\s*MM\s*H\s*(\d+(?:\.\d+)?)\s*MM/i,  // "W1000MM H2000MM"
    /WIDTH\s*(\d+(?:\.\d+)?)\s*MM\s*HEIGHT\s*(\d+(?:\.\d+)?)\s*MM/i,  // "WIDTH 1000MM HEIGHT 2000MM"
    /(\d+(?:\.\d+)?)\s*MM\s*x\s*(\d+(?:\.\d+)?)\s*MM/i,      // "1000MM x 2000MM"
    /(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*MM/i,           // "1000 x 2000MM"
  ];
  
  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match && match.length >= 3) {
      const width = parseFloat(match[1]);
      const height = parseFloat(match[2]);
      if (!isNaN(width) && !isNaN(height) && width > 0 && height > 0) {
        // Convert mm to m and calculate area
        const widthM = width / 1000;
        const heightM = height / 1000;
        return widthM * heightM; // Area in m2
      }
    }
  }
  
  return null;
}

/**
 * Convert various units to PC (pieces) based on material description
 * Supports: ML (milliliters), M (meters), M2 (square meters)
 * Returns conversion info or null if conversion not applicable
 */
function convertToPC(
  defectiveQuantity: number,
  unitOfMeasure: string | undefined,
  materialDescription: string | undefined
): UnitConversion | null {
  if (!unitOfMeasure || defectiveQuantity <= 0) {
    return null;
  }
  
  const unit = unitOfMeasure.toUpperCase().trim();
  
  // Handle ML (milliliters) - convert to PC based on bottle size
  if (unit === 'ML') {
    const bottleSize = materialDescription ? extractBottleSizeFromDescription(materialDescription) : null;
    
    if (!bottleSize || bottleSize <= 0) {
      return null;
    }
    
    const convertedPC = defectiveQuantity / bottleSize;
    
    return {
      originalValue: defectiveQuantity,
      originalUnit: 'ML',
      convertedValue: Math.round(convertedPC * 100) / 100, // Round to 2 decimal places
      bottleSize,
      materialDescription,
      wasConverted: true,
    };
  }
  
  // Handle M (meters) - convert to PC based on length per piece
  if (unit === 'M' || unit === 'METER' || unit === 'METERS') {
    const lengthPerPiece = materialDescription ? extractLengthFromDescription(materialDescription) : null;
    
    if (!lengthPerPiece || lengthPerPiece <= 0) {
      return null;
    }
    
    // Convert: defectiveM / lengthPerPieceM = number of pieces
    const convertedPC = defectiveQuantity / lengthPerPiece;
    
    return {
      originalValue: defectiveQuantity,
      originalUnit: 'M',
      convertedValue: Math.round(convertedPC * 100) / 100, // Round to 2 decimal places
      bottleSize: lengthPerPiece, // Reuse bottleSize field for length per piece
      materialDescription,
      wasConverted: true,
    };
  }
  
  // Handle M2 (square meters) - convert to PC based on area per piece
  if (unit === 'M2' || unit === 'M²' || unit === 'SQ M' || unit === 'SQ M2') {
    const areaPerPiece = materialDescription ? extractAreaFromDescription(materialDescription) : null;
    
    if (!areaPerPiece || areaPerPiece <= 0) {
      return null;
    }
    
    // Convert: defectiveM2 / areaPerPieceM2 = number of pieces
    const convertedPC = defectiveQuantity / areaPerPiece;
    
    return {
      originalValue: defectiveQuantity,
      originalUnit: 'M2',
      convertedValue: Math.round(convertedPC * 100) / 100, // Round to 2 decimal places
      bottleSize: areaPerPiece, // Reuse bottleSize field for area per piece
      materialDescription,
      wasConverted: true,
    };
  }
  
  // Unit not supported for conversion
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
 * Parse complaints from Excel file buffer
 */
export function parseComplaints(
  buffer: Buffer,
  mapping?: ComplaintColumnMapping,
  source: DataSource = 'SAP_S4'
): Complaint[] {
  const columnMapping = mapping || getComplaintColumnMapping();
  const complaints: Complaint[] = [];
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

    // Validate required columns
    const requiredColumns: (keyof ComplaintColumnMapping)[] = [
      'notificationNumber',
      'notificationType',
      'createdOn',
    ];

    const missingColumns = requiredColumns.filter((col) => columnMap[col] === undefined);
    if (missingColumns.length > 0) {
      console.error(
        `Missing required columns: ${missingColumns.join(', ')}. Available columns: ${headers.join(', ')}`
      );
      return [];
    }

    // Process data rows
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i] as unknown[];

      // Skip empty rows
      if (row.every((cell) => cell === null || cell === '' || cell === undefined)) {
        continue;
      }

      try {
        // Extract values
        const notificationNumber = String(
          extractValue(row, columnMap.notificationNumber, '') || ''
        ).trim();

        const notificationTypeStr = String(
          extractValue(row, columnMap.notificationType, '') || ''
        ).trim();

        const plant = String(extractValue(row, columnMap.plant, '') || '').trim();
        const siteCode =
          String(extractValue(row, columnMap.siteCode, '') || plant).trim() || plant;
        const siteName = columnMap.siteName
          ? String(extractValue(row, columnMap.siteName, '') || '').trim() || undefined
          : undefined;

        const createdOn = parseDate(extractValue(row, columnMap.createdOn));
        
        // Extract unit of measure and material description first (needed to determine Q2)
        const unitOfMeasure = columnMap.unitOfMeasure !== undefined
          ? String(extractValue(row, columnMap.unitOfMeasure, '') || '').trim().toUpperCase()
          : undefined;
        
        // For customer complaints (Q1), prefer "Defective (Internal)" column if available
        // For supplier complaints (Q2), prefer "Defective (External)" column if available
        // Otherwise fall back to "defectiveParts" column
        let defectiveParts = 0;
        const notificationTypeStrUpper = notificationTypeStr.toUpperCase();
        const isQ1 = notificationTypeStrUpper === 'Q1';
        const isQ2 = notificationTypeStrUpper === 'Q2';
        
        if (isQ1) {
          // For Q1, prioritize "Defective (Internal)" column if it exists
          if (columnMap.defectiveInternal !== undefined) {
            const internalValue = extractValue(row, columnMap.defectiveInternal);
            const parsedInternal = parseNumber(internalValue);
            // Use internal value if it's a valid number (including 0)
            if (!isNaN(parsedInternal) && internalValue !== null && internalValue !== undefined && internalValue !== '') {
              defectiveParts = parsedInternal;
            } else if (columnMap.defectiveParts !== undefined) {
              // Fall back to regular defectiveParts if internal is empty/null
              defectiveParts = parseNumber(extractValue(row, columnMap.defectiveParts));
            }
          } else if (columnMap.defectiveParts !== undefined) {
            // No internal column, use regular defectiveParts
            defectiveParts = parseNumber(extractValue(row, columnMap.defectiveParts));
          }
        } else if (isQ2) {
          // For Q2, prioritize "Defective (External)" column if it exists
          if (columnMap.defectiveExternal !== undefined) {
            const externalValue = extractValue(row, columnMap.defectiveExternal);
            const parsedExternal = parseNumber(externalValue);
            // Use external value if it's a valid number (including 0)
            if (!isNaN(parsedExternal) && externalValue !== null && externalValue !== undefined && externalValue !== '') {
              defectiveParts = parsedExternal;
            } else if (columnMap.defectiveParts !== undefined) {
              // Fall back to regular defectiveParts if external is empty/null
              defectiveParts = parseNumber(extractValue(row, columnMap.defectiveParts));
            }
          } else if (columnMap.defectiveParts !== undefined) {
            // No external column, use regular defectiveParts
            defectiveParts = parseNumber(extractValue(row, columnMap.defectiveParts));
          }
        } else {
          // For non-Q1/Q2 complaints, use regular defectiveParts column
          if (columnMap.defectiveParts !== undefined) {
            defectiveParts = parseNumber(extractValue(row, columnMap.defectiveParts));
          }
        }
        
        // Material description (unitOfMeasure already extracted above)
        const materialDescription = columnMap.materialDescription !== undefined
          ? String(extractValue(row, columnMap.materialDescription, '') || '').trim()
          : undefined;

        // Validate critical fields
        if (!notificationNumber) {
          errors.push(`Row ${i + 1}: Missing notification number`);
          continue;
        }

        if (!notificationTypeStr) {
          errors.push(`Row ${i + 1}: Missing notification type`);
          continue;
        }

        if (!createdOn) {
          errors.push(`Row ${i + 1}: Missing or invalid creation date`);
          continue;
        }

        // Parse and validate notification type
        const notificationType: NotificationType = parseNotificationType(notificationTypeStr);
        const category = getCategoryFromNotificationType(notificationType);

        // Generate ID
        const id = generateComplaintId(notificationNumber, plant || siteCode);

        // For customer complaints (Q1) and supplier complaints (Q2), convert to PC if applicable (ML, M, M2)
        // If unit is already PC, use the value as-is
        // IMPORTANT: All Q1 and Q2 defective parts should be in PC for consistent reporting
        let finalDefectiveParts = Math.max(0, defectiveParts);
        let conversion: UnitConversion | null = null;
        
        if (notificationType === 'Q1' || notificationType === 'Q2') {
          if (defectiveParts > 0) {
            // If unit is PC (or empty/undefined, assume PC), use value as-is
            if (!unitOfMeasure || unitOfMeasure.toUpperCase() === 'PC' || unitOfMeasure.toUpperCase() === 'PIECE' || unitOfMeasure.toUpperCase() === 'PIECES' || unitOfMeasure.toUpperCase() === 'PCS') {
              // Already in PC, no conversion needed - use value as-is
              finalDefectiveParts = defectiveParts;
            } else if (unitOfMeasure) {
              // Try to convert ML, M, or M2 to PC
              conversion = convertToPC(defectiveParts, unitOfMeasure, materialDescription);
              if (conversion && conversion.wasConverted) {
                finalDefectiveParts = conversion.convertedValue;
              } else {
                // Conversion not possible (no conversion info found), use original value
                // This might be in a different unit, but we'll use it as-is
                finalDefectiveParts = defectiveParts;
                console.warn(`[${notificationType} Complaint ${notificationNumber}] Could not convert ${defectiveParts} ${unitOfMeasure} to PC. Using original value.`);
              }
            } else {
              // No unit specified, assume PC
              finalDefectiveParts = defectiveParts;
            }
          }
          // If defectiveParts is 0, keep it as 0 (valid case)
        }

        // Create complaint object
        const complaint: Complaint = {
          id,
          notificationNumber,
          notificationType,
          category,
          plant: plant || siteCode,
          siteCode,
          siteName,
          createdOn,
          defectiveParts: finalDefectiveParts, // Use converted value for Q2 if applicable
          source,
          unitOfMeasure,
          materialDescription,
          conversion: conversion || undefined,
        };

        complaints.push(complaint);
      } catch (error) {
        errors.push(
          `Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        console.error(`Error parsing row ${i + 1}:`, error);
      }
    }

    // Log errors if any
    if (errors.length > 0) {
      console.warn(`Parsed ${complaints.length} complaints with ${errors.length} errors:`);
      errors.forEach((error) => console.warn(`  - ${error}`));
    } else {
      console.log(`Successfully parsed ${complaints.length} complaints`);
    }
  } catch (error) {
    console.error('Error parsing Excel file:', error);
    throw new Error(
      `Failed to parse complaints: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  return complaints;
}

