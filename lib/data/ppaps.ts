/**
 * PPAP data management
 * Loads and caches PPAP P notifications from attachments:
 * - "PPAP P Notif_PS4.XLSX" (base PPAP notifications)
 * - "PPAP P Notif_STATUS_PS4.XLSX" (status reference for P notifications)
 */

import { readFileSync } from "fs";
import { join } from "path";
import { parsePPAP, type PPAPNotification } from "@/lib/excel/parsePPAP";

let cachedPpaps: PPAPNotification[] | null = null;

function safeReadAttachment(fileName: string): Buffer | null {
  try {
    const filePath = join(process.cwd(), "attachments", fileName);
    return readFileSync(filePath);
  } catch (e) {
    console.warn(`[PPAP] Could not read attachments/${fileName}:`, e instanceof Error ? e.message : String(e));
    return null;
  }
}

/**
 * Load PPAP notifications and merge status values (Closed vs In Progress).
 *
 * Notes:
 * - We treat parsePPAP() as a best-effort parser for both files.
 * - The STATUS file is only used to build a notificationNumber -> status map.
 */
export function loadPpaps(): PPAPNotification[] {
  // In dev, avoid sticky caches while parsers/headers are being tuned.
  if (cachedPpaps && process.env.NODE_ENV === "production") return cachedPpaps;

  try {
    const baseBuf = safeReadAttachment("PPAP P Notif_PS4.XLSX") || safeReadAttachment("PPAP P Notif_PS4.xlsx");
    const statusBuf =
      safeReadAttachment("PPAP P Notif_STATUS_PS4.XLSX") || safeReadAttachment("PPAP P Notif_STATUS_PS4.xlsx");

    const base = baseBuf ? parsePPAP(baseBuf) : [];
    const statusList = statusBuf ? parsePPAP(statusBuf) : [];

    const statusByNotif = new Map<string, { status?: PPAPNotification["status"]; statusText?: string }>();
    for (const p of statusList) {
      const key = String(p.notificationNumber || "").trim();
      if (!key) continue;
      if (p.status || p.statusText) statusByNotif.set(key, { status: p.status, statusText: p.statusText });
    }

    const merged = base.map((p) => {
      const key = String(p.notificationNumber || "").trim();
      const mergedStatus = key ? statusByNotif.get(key) : undefined;
      return {
        ...p,
        status: mergedStatus?.status || p.status,
        statusText: mergedStatus?.statusText || p.statusText,
      };
    });

    if (process.env.NODE_ENV === "production") cachedPpaps = merged;
    console.log(`[PPAP] Loaded ${merged.length} PPAP notifications (base file), merged ${statusByNotif.size} statuses`);
    return merged;
  } catch (error) {
    console.error("[PPAP] Error loading PPAP files:", error);
    cachedPpaps = [];
    return cachedPpaps;
  }
}


