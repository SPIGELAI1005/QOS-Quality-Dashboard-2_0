/**
 * Parse Deviations Notifications from Excel file
 */

import * as XLSX from 'xlsx';
import type { Complaint, DataSource } from '@/lib/domain/types';
import { NotificationCategory } from '@/lib/domain/types';

export interface Deviation extends Complaint {
  notificationType: 'D1' | 'D2' | 'D3';
  deviationType?: string;
  severity?: string;
}

/**
 * Parse deviations from Excel file buffer
 */
export function parseDeviations(buffer: Buffer): Deviation[] {
  const deviations: Deviation[] = [];
  
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    
    if (workbook.SheetNames.length === 0) {
      console.warn('Deviations file has no worksheets');
      return [];
    }
    
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null }) as unknown[][];
    
    if (rows.length < 2) {
      console.warn('Deviations file has no data rows');
      return [];
    }
    
    const headers = (rows[0] as string[]).map((h) => String(h || '').trim().toLowerCase());
    
    function findIndexPreferred(preferred: string[], fallback: (h: string) => boolean): number {
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

    // Map column indices (prefer exact/specific matches first).
    // Important: "notification" is a substring of "notification type/status", so we must avoid false matches.
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
        (h.includes('notification type') || h.includes('notif type') || h === 'type' || h.includes('d1') || h.includes('d2') || h.includes('d3')) &&
        !h.includes('notification status')
    );

    // In the deviations extract, the plant is typically "Plant for Material". Prefer that over generic "plant".
    const plantIndex = findIndexPreferred(
      ['plant for material', 'plant code', 'site code', 'plant', 'site', 'werk'],
      (h) => ['plant', 'werk', 'site', 'site code', 'plant code'].some((term) => h.includes(term))
    );

    const siteNameIndex = findIndexPreferred(
      ['site name', 'plant name', 'location', 'city', 'list name'],
      (h) => ['site name', 'plant name', 'location', 'city', 'list name'].some((term) => h.includes(term))
    );

    // Prefer "created on" and avoid "created by" (common source of zero-row parsing).
    const createdOnIndex = findIndexPreferred(
      ['created on', 'created date', 'created'],
      (h) => (h.includes('created') || h.includes('erstellt')) && !h.includes('created by')
    );

    // Optional fields. Keep strict to avoid accidentally binding to "notification type".
    const deviationTypeIndex = findIndexPreferred(
      ['deviation type', 'code group text', 'coding code text', 'code group'],
      (h) => h.includes('deviation type')
    );
    const severityIndex = findIndexPreferred(
      ['priority text', 'severity', 'priority', 'level'],
      (h) => h.includes('severity') || h.includes('priority') || h.includes('level')
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
      
      // Determine D1, D2, or D3
      let notificationType: 'D1' | 'D2' | 'D3' = 'D1';
      if (notificationTypeRaw.includes('D2') || notificationTypeRaw === '2') {
        notificationType = 'D2';
      } else if (notificationTypeRaw.includes('D3') || notificationTypeRaw === '3') {
        notificationType = 'D3';
      }
      
      const plant = plantIndex !== -1 ? String(row[plantIndex] || '').trim() : '';
      const siteName = siteNameIndex !== -1 ? String(row[siteNameIndex] || '').trim() : '';
      const createdOnRaw = createdOnIndex !== -1 ? row[createdOnIndex] : null;
      const deviationType = deviationTypeIndex !== -1 
        ? String(row[deviationTypeIndex] || '').trim() 
        : undefined;
      const severity = severityIndex !== -1 
        ? String(row[severityIndex] || '').trim() 
        : undefined;
      
      // Parse date
      let createdOn: Date | null = null;
      if (createdOnRaw) {
        if (createdOnRaw instanceof Date) {
          createdOn = createdOnRaw;
        } else if (typeof createdOnRaw === 'number') {
          // Excel serial date fallback
          const ms = Math.round((createdOnRaw - 25569) * 86400 * 1000);
          const d = new Date(ms);
          if (!isNaN(d.getTime())) createdOn = d;
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
      
      deviations.push({
        id: `dev-${notificationNumber}-${i}`,
        notificationNumber,
        notificationType,
        category: NotificationCategory.Deviation,
        plant,
        siteCode: plant,
        siteName: siteName || plant,
        createdOn,
        defectiveParts: 0, // Deviations typically don't have defective parts
        source: 'Import' as DataSource,
        deviationType,
        severity,
      });
    }
    
    console.log(`Parsed ${deviations.length} deviations from file`);
    return deviations;
  } catch (error) {
    console.error('Error parsing deviations file:', error);
    return [];
  }
}

