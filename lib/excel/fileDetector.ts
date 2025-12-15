/**
 * Detect Excel file types based on filename patterns
 */

export type FileType = 
  | 'complaints' 
  | 'deliveries-outbound' 
  | 'deliveries-inbound'
  | 'deviations' 
  | 'ppap' 
  | 'plants' 
  | 'inspections'
  | 'unknown';

export interface DetectedFile {
  type: FileType;
  fileName: string;
  plantCode?: string; // For site-specific files
}

/**
 * Detect file type from filename
 */
export function detectFileType(fileName: string): DetectedFile {
  const lowerName = fileName.toLowerCase();
  
  // Plants file
  if (lowerName.includes('plant')) {
    return { type: 'plants', fileName };
  }
  
  // Outbound deliveries - files starting with "Outbound" (e.g., "Outbound 410_PS4")
  // Customer deliveries = sum of quantities from these files
  // Check this BEFORE complaints to avoid false matches
  if (lowerName.startsWith('outbound') || (lowerName.includes('outbound') && !lowerName.includes('complaint'))) {
    const plantMatch = fileName.match(/(\d{3})/);
    const plantCode = plantMatch ? plantMatch[1] : undefined;
    return { type: 'deliveries-outbound', fileName, plantCode };
  }
  
  // Inbound deliveries - files starting with "Inbound"
  // Supplier deliveries = sum of quantities from these files
  // Check this BEFORE complaints to avoid false matches
  if (lowerName.startsWith('inbound') || (lowerName.includes('inbound') && !lowerName.includes('complaint'))) {
    const plantMatch = fileName.match(/(\d{3})/);
    const plantCode = plantMatch ? plantMatch[1] : undefined;
    return { type: 'deliveries-inbound', fileName, plantCode };
  }
  
  // Complaints files
  if (lowerName.includes('complaint') || lowerName.includes('q cockpit')) {
    // Extract plant code if present (e.g., "PPM - 101")
    const plantMatch = fileName.match(/-?\s*(\d{3})\s*\./i);
    const plantCode = plantMatch ? plantMatch[1] : undefined;
    return { type: 'complaints', fileName, plantCode };
  }
  
  // Deviations
  if (lowerName.includes('deviation')) {
    return { type: 'deviations', fileName };
  }
  
  // PPAP
  if (lowerName.includes('ppap') || lowerName.includes('p notif')) {
    return { type: 'ppap', fileName };
  }
  
  // Inspections
  if (lowerName.includes('inspection') || lowerName.includes('review')) {
    return { type: 'inspections', fileName };
  }
  
  return { type: 'unknown', fileName };
}

/**
 * Group files by type
 */
export function groupFilesByType(files: File[]): Map<FileType, File[]> {
  const grouped = new Map<FileType, File[]>();
  
  for (const file of files) {
    const detected = detectFileType(file.name);
    const existing = grouped.get(detected.type) || [];
    existing.push(file);
    grouped.set(detected.type, existing);
  }
  
  return grouped;
}

