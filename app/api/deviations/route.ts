/**
 * API endpoint to get Deviations notifications (D1/D2/D3) and status (Closed vs In Progress)
 * Source of truth: attachments/Deviations Notifications_PS4.XLSX + attachments/Deviations Notifications_STATUS_PS4.XLSX
 */

import { NextResponse } from "next/server";
import { loadDeviations } from "@/lib/data/deviations";

export async function GET() {
  try {
    const deviations = loadDeviations();
    const items = deviations.map((d) => ({
      notificationNumber: d.notificationNumber,
      notificationType: d.notificationType,
      plant: d.plant,
      siteCode: d.siteCode,
      siteName: d.siteName,
      createdOn: d.createdOn,
      status: d.status,
      notificationStatusText: d.statusText,
      deviationType: d.deviationType,
      severity: d.severity,
    }));
    return NextResponse.json({ deviations: items });
  } catch (e) {
    console.error("[api/deviations] Error:", e);
    return NextResponse.json({ deviations: [] });
  }
}


