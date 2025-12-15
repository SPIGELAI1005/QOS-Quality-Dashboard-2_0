/**
 * Parse PPAP Notifications from Excel file
 */

import * as XLSX from 'xlsx';
import type { Complaint, DataSource } from '@/lib/domain/types';
import { NotificationCategory } from '@/lib/domain/types';

export interface PPAPNotification extends Complaint {
  notificationType: 'P1' | 'P2' | 'P3';
  status?: 'In Progress' | 'Completed' | 'Pending';
  statusText?: string; // raw "Notification Status" / status text from SAP extract
  partNumber?: string;
}

function excelSerialDateToJsDate(value: number): Date | null {
  // Excel serial date (days since 1899-12-30 for Windows Excel)
  // 25569 = days between 1899-12-30 and 1970-01-01
  if (!Number.isFinite(value)) return null;
  const ms = Math.round((value - 25569) * 86400 * 1000);
  const d = new Date(ms);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Parse PPAP notifications from Excel file buffer
 */
export function parsePPAP(buffer: Buffer): PPAPNotification[] {
  const ppaps: PPAPNotification[] = [];
  
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    
    if (workbook.SheetNames.length === 0) {
      console.warn('PPAP file has no worksheets');
      return [];
    }
    
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null }) as unknown[][];
    
    if (rows.length < 2) {
      console.warn('PPAP file has no data rows');
      return [];
    }
    
    const headers = (rows[0] as string[]).map((h) => String(h || '').trim().toLowerCase());
    
    function findIndexPreferred(
      preferred: string[],
      fallback: (h: string) => boolean
    ): number {
      for (const p of preferred) {
        const idx = headers.findIndex((h) => h === p || h.includes(p));
        if (idx !== -1) return idx;
      }
      return headers.findIndex(fallback);
    }

    function findIndexExact(preferredExact: string[]): number {
      for (const p of preferredExact) {
        const idx = headers.findIndex((h) => h === p);
        if (idx !== -1) return idx;
      }
      return -1;
    }

    // Map column indices (prefer exact/specific matches first)
    // Important: "notification" is a substring of "notification type/status", so we must prefer exact matches first.
    const notificationNumberIndex =
      findIndexExact(['notification number', 'notification']) !== -1
        ? findIndexExact(['notification number', 'notification'])
        : headers.findIndex(
            (h) =>
              (h.includes('notification') || h.includes('notif') || h.includes('number') || h.includes('nr')) &&
              !h.includes('notification type') &&
              !h.includes('notification status')
          );

    const notificationTypeIndex = findIndexPreferred(
      ['notification type', 'notif type'],
      (h) =>
        (h.includes('notification type') || h.includes('notif type') || h === 'type' || h.includes('p1') || h.includes('p2') || h.includes('p3')) &&
        !h.includes('notification status')
    );
    const plantIndex = headers.findIndex((h) =>
      ['plant', 'werk', 'site', 'site code', 'plant code'].some((term) => h.includes(term))
    );
    const siteNameIndex = headers.findIndex((h) =>
      ['site name', 'plant name', 'location', 'city'].some((term) => h.includes(term))
    );
    const createdOnIndex = findIndexPreferred(
      ['created on', 'created date', 'erstellt', 'created'],
      (h) => (h.includes('created') || h.includes('erstellt')) && !h.includes('created by')
    );
    const partNumberIndex = headers.findIndex((h) =>
      ['part number', 'part', 'material', 'material number'].some((term) => h.includes(term))
    );
    const statusIndex = findIndexPreferred(
      ['notification status', 'status'],
      (h) => (h.includes('status') || h.includes('state') || h.includes('phase')) && !h.includes('notification type')
    );
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i] as unknown[];
      
      if (row.every((cell) => cell === null || cell === '' || cell === undefined)) {
        continue;
      }
      
      const notificationNumber = notificationNumberIndex !== -1 
        ? String(row[notificationNumberIndex] || '').trim() 
        : '';
      const notificationTypeRaw = notificationTypeIndex !== -1
        ? String(row[notificationTypeIndex] || '').trim().toUpperCase()
        : '';
      
      // Determine P1, P2, or P3
      let notificationType: 'P1' | 'P2' | 'P3' = 'P1';
      if (notificationTypeRaw.includes('P2') || notificationTypeRaw === '2' || 
          notificationTypeRaw.includes('completed') || notificationTypeRaw.includes('approved')) {
        notificationType = 'P2';
      } else if (notificationTypeRaw.includes('P3') || notificationTypeRaw === '3') {
        notificationType = 'P3';
      }
      
      const plant = plantIndex !== -1 ? String(row[plantIndex] || '').trim() : '';
      const siteName = siteNameIndex !== -1 ? String(row[siteNameIndex] || '').trim() : '';
      const createdOnRaw = createdOnIndex !== -1 ? row[createdOnIndex] : null;
      const partNumber = partNumberIndex !== -1 
        ? String(row[partNumberIndex] || '').trim() 
        : undefined;
      const statusRaw = statusIndex !== -1 
        ? String(row[statusIndex] || '').trim() 
        : undefined;
      
      // Parse status
      let status: 'In Progress' | 'Completed' | 'Pending' | undefined = undefined;
      if (statusRaw) {
        // SAP QM system-status prefixes are the most reliable signal here:
        // - NOCO = Notification completed (Closed)
        // - OSNO = Outstanding notification (Open / In Progress)
        const upper = statusRaw.toUpperCase();
        if (/\bNOCO\b/.test(upper)) {
          status = 'Completed';
        } else if (/\bOSNO\b/.test(upper)) {
          status = 'In Progress';
        } else {
          // Fallback heuristics (for non-standard extracts)
          const lower = statusRaw.toLowerCase();
          if (lower.includes('closed') || lower.includes('complete') || lower.includes('done')) status = 'Completed';
          else if (
            lower.includes('progress') ||
            lower.includes('ongoing') ||
            lower.includes('init') ||
            lower.includes('dlfl') ||
            lower.includes('osts') ||
            lower.includes('atco')
          ) status = 'In Progress';
          else status = 'Pending';
        }
      }
      
      // Parse date
      let createdOn: Date | null = null;
      if (createdOnRaw) {
        if (createdOnRaw instanceof Date) {
          createdOn = createdOnRaw;
        } else if (typeof createdOnRaw === 'number') {
          createdOn = excelSerialDateToJsDate(createdOnRaw);
        } else {
          const dateStr = String(createdOnRaw);
          const parsed = new Date(dateStr);
          if (!isNaN(parsed.getTime())) {
            createdOn = parsed;
          }
        }
      }
      
      if (!notificationNumber || !createdOn) {
        continue;
      }
      
      ppaps.push({
        id: `ppap-${notificationNumber}-${i}`,
        notificationNumber,
        notificationType,
        category: NotificationCategory.PPAP,
        plant,
        siteCode: plant,
        siteName: siteName || plant,
        createdOn,
        defectiveParts: 0, // PPAP typically doesn't have defective parts
        source: 'Import' as DataSource,
        status,
        statusText: statusRaw,
        partNumber,
      });
    }
    
    console.log(`Parsed ${ppaps.length} PPAP notifications from file`);
    return ppaps;
  } catch (error) {
    console.error('Error parsing PPAP file:', error);
    return [];
  }
}

