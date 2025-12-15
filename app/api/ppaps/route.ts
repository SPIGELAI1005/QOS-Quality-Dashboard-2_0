/**
 * API endpoint to get PPAP notifications (P1/P2/P3) and status (Closed vs In Progress)
 * Source of truth: attachments/PPAP P Notif_PS4.XLSX + attachments/PPAP P Notif_STATUS_PS4.XLSX
 */

import { NextResponse } from "next/server";
import { loadPpaps } from "@/lib/data/ppaps";

export async function GET() {
  try {
    const ppaps = loadPpaps();
    // Keep payload lean for client usage
    const items = ppaps.map((p) => ({
      notificationNumber: p.notificationNumber,
      notificationType: p.notificationType,
      plant: p.plant,
      siteCode: p.siteCode,
      siteName: p.siteName,
      createdOn: p.createdOn,
      status: p.status,
      notificationStatusText: p.statusText,
      partNumber: p.partNumber,
    }));
    return NextResponse.json({ ppaps: items });
  } catch (error) {
    console.error("[api/ppaps] Error:", error);
    return NextResponse.json({ ppaps: [] });
  }
}


