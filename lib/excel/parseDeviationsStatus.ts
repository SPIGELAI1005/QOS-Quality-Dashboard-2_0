/**
 * Parse Deviations status reference from Excel file
 * Source: "Deviations Notifications_STATUS_PS4.XLSX"
 *
 * We only need notificationNumber -> status mapping (Closed vs In Progress).
 */

import * as XLSX from "xlsx";

export interface DeviationStatusRow {
  notificationNumber: string;
  status?: "In Progress" | "Completed" | "Pending";
  statusText?: string;
}

function parseStatusTextToStatus(statusRaw?: string): DeviationStatusRow["status"] {
  if (!statusRaw) return undefined;
  const upper = statusRaw.toUpperCase();
  if (/\bNOCO\b/.test(upper)) return "Completed";
  if (/\bOSNO\b/.test(upper)) return "In Progress";

  const lower = statusRaw.toLowerCase();
  if (lower.includes("closed") || lower.includes("complete") || lower.includes("done")) return "Completed";
  if (lower.includes("progress") || lower.includes("ongoing") || lower.includes("open")) return "In Progress";
  return "Pending";
}

export function parseDeviationsStatus(buffer: Buffer): DeviationStatusRow[] {
  try {
    const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
    if (workbook.SheetNames.length === 0) return [];
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null }) as unknown[][];
    if (rows.length < 2) return [];

    const headers = (rows[0] as string[]).map((h) => String(h || "").trim().toLowerCase());

    const notificationNumberIndex =
      headers.findIndex((h) => h === "notification number" || h === "notification") !== -1
        ? headers.findIndex((h) => h === "notification number" || h === "notification")
        : headers.findIndex(
            (h) =>
              (h.includes("notification") || h.includes("notif") || h.includes("number") || h.includes("nr")) &&
              !h.includes("notification type") &&
              !h.includes("notification status")
          );

    const statusIndex =
      headers.findIndex((h) => h === "notification status") !== -1
        ? headers.findIndex((h) => h === "notification status")
        : headers.findIndex((h) => h.includes("status") || h.includes("state") || h.includes("phase"));

    if (notificationNumberIndex === -1) return [];

    const out: DeviationStatusRow[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i] as unknown[];
      if (row.every((cell) => cell === null || cell === "" || cell === undefined)) continue;

      const notificationNumber = String(row[notificationNumberIndex] || "").trim();
      if (!notificationNumber) continue;

      const statusText = statusIndex !== -1 ? String(row[statusIndex] || "").trim() : undefined;
      out.push({
        notificationNumber,
        statusText,
        status: parseStatusTextToStatus(statusText),
      });
    }

    return out;
  } catch (e) {
    console.error("[parseDeviationsStatus] Error parsing deviations status file:", e);
    return [];
  }
}


