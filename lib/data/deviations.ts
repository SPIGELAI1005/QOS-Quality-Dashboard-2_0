/**
 * Deviations data management
 * Loads and caches deviations (D1/D2/D3) from attachments:
 * - "Deviations Notifications_PS4.XLSX" (base deviations notifications)
 * - "Deviations Notifications_STATUS_PS4.XLSX" (status reference)
 */

import { readFileSync } from "fs";
import { join } from "path";
import { parseDeviations, type Deviation } from "@/lib/excel/parseDeviations";
import { parseDeviationsStatus } from "@/lib/excel/parseDeviationsStatus";

export interface DeviationNotification extends Deviation {
  status?: "In Progress" | "Completed" | "Pending";
  statusText?: string;
}

let cachedDeviations: DeviationNotification[] | null = null;

function safeReadAttachment(fileName: string): Buffer | null {
  try {
    const filePath = join(process.cwd(), "attachments", fileName);
    return readFileSync(filePath);
  } catch (e) {
    console.warn(`[Deviations] Could not read attachments/${fileName}:`, e instanceof Error ? e.message : String(e));
    return null;
  }
}

export function loadDeviations(): DeviationNotification[] {
  if (cachedDeviations && process.env.NODE_ENV === "production") return cachedDeviations;

  try {
    const baseBuf =
      safeReadAttachment("Deviations Notifications_PS4.XLSX") ||
      safeReadAttachment("Deviations Notifications_PS4.xlsx") ||
      safeReadAttachment("Deviations Notifications_P01.xlsx");
    const statusBuf =
      safeReadAttachment("Deviations Notifications_STATUS_PS4.XLSX") ||
      safeReadAttachment("Deviations Notifications_STATUS_PS4.xlsx");

    const base = baseBuf ? parseDeviations(baseBuf) : [];
    const statusList = statusBuf ? parseDeviationsStatus(statusBuf) : [];

    const statusByNotif = new Map<string, { status?: DeviationNotification["status"]; statusText?: string }>();
    for (const s of statusList) {
      const key = String(s.notificationNumber || "").trim();
      if (!key) continue;
      statusByNotif.set(key, { status: s.status, statusText: s.statusText });
    }

    const merged: DeviationNotification[] = base.map((d) => {
      const key = String(d.notificationNumber || "").trim();
      const st = key ? statusByNotif.get(key) : undefined;
      return {
        ...d,
        status: st?.status,
        statusText: st?.statusText,
      };
    });

    if (process.env.NODE_ENV === "production") cachedDeviations = merged;
    console.log(`[Deviations] Loaded ${merged.length} deviations, merged ${statusByNotif.size} statuses`);
    return merged;
  } catch (e) {
    console.error("[Deviations] Error loading deviations files:", e);
    cachedDeviations = [];
    return cachedDeviations;
  }
}


