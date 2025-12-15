/**
 * Dashboard KPI data loader (server-side)
 *
 * Source of truth (per user requirement):
 * - Complaints: "Q Cockpit QOS ET_Complaints_Parts_PPM_PS4"
 * - Deliveries to customer: all files containing "Outbound" in filename
 * - Deliveries from supplier: all files containing "Inbound" in filename
 *
 * Provides a cached, deterministic way to compute the KPIs without relying on browser localStorage.
 */

import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";
import { parseComplaints } from "@/lib/excel/parseComplaints";
import { parseDeliveries } from "@/lib/excel/parseDeliveries";
import { calculateGlobalPPM, calculateMonthlySiteKpis } from "@/lib/domain/kpi";
import type { MonthlySiteKpi } from "@/lib/domain/types";
import type { Complaint, Delivery } from "@/lib/domain/types";

interface DashboardKpisResult {
  monthlySiteKpis: MonthlySiteKpi[];
  globalPpm: { customerPpm: number | null; supplierPpm: number | null };
  summary: {
    totalComplaints: number;
    totalDeliveries: number;
    totalDeliveryQuantity: number;
    customerDeliveryQuantity: number;
    supplierDeliveryQuantity: number;
    siteMonthCombinations: number;
    filesUsed: { complaintsFile: string | null; outboundFiles: string[]; inboundFiles: string[] };
  };
}

let cached: { signature: string; data: DashboardKpisResult } | null = null;

function isExcelFile(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return lower.endsWith(".xlsx") || lower.endsWith(".xls");
}

function buildSignature(attachmentsPath: string, files: string[]): string {
  // Include mtime + size to invalidate cache when attachments change
  const parts: string[] = [];
  for (const f of files) {
    const full = join(attachmentsPath, f);
    const st = statSync(full);
    parts.push(`${f}:${st.size}:${st.mtimeMs}`);
  }
  return parts.sort().join("|");
}

export function loadDashboardKpisFromAttachments(): DashboardKpisResult {
  const attachmentsPath = join(process.cwd(), "attachments");
  const files = readdirSync(attachmentsPath).filter((f) => isExcelFile(f) && !f.startsWith("~$"));

  const complaintsFile =
    files.find((f) => f.toLowerCase().includes("q cockpit qos et_complaints_parts_ppm_ps4".toLowerCase())) || null;

  const outboundFiles = files.filter((f) => f.toLowerCase().includes("outbound"));
  const inboundFiles = files.filter((f) => f.toLowerCase().includes("inbound"));

  const signature = buildSignature(
    attachmentsPath,
    [complaintsFile, ...outboundFiles, ...inboundFiles].filter(Boolean) as string[]
  );

  if (cached && cached.signature === signature) return cached.data;

  const allComplaints: Complaint[] = [];
  const allDeliveries: Delivery[] = [];

  if (complaintsFile) {
    const buf = readFileSync(join(attachmentsPath, complaintsFile));
    allComplaints.push(...parseComplaints(buf));
  }

  for (const f of outboundFiles) {
    const buf = readFileSync(join(attachmentsPath, f));
    allDeliveries.push(...parseDeliveries(buf, undefined, f));
  }

  for (const f of inboundFiles) {
    const buf = readFileSync(join(attachmentsPath, f));
    allDeliveries.push(...parseDeliveries(buf, undefined, f));
  }

  const monthlySiteKpis = calculateMonthlySiteKpis(allComplaints, allDeliveries);
  const globalPpm = calculateGlobalPPM(allComplaints, allDeliveries);

  const totalDeliveryQuantity = allDeliveries.reduce((sum, d) => sum + d.quantity, 0);
  const customerDeliveryQuantity = allDeliveries
    .filter((d) => d.kind === "Customer")
    .reduce((sum, d) => sum + d.quantity, 0);
  const supplierDeliveryQuantity = allDeliveries
    .filter((d) => d.kind === "Supplier")
    .reduce((sum, d) => sum + d.quantity, 0);

  const result: DashboardKpisResult = {
    monthlySiteKpis,
    globalPpm,
    summary: {
      totalComplaints: allComplaints.length,
      totalDeliveries: allDeliveries.length,
      totalDeliveryQuantity,
      customerDeliveryQuantity,
      supplierDeliveryQuantity,
      siteMonthCombinations: monthlySiteKpis.length,
      filesUsed: {
        complaintsFile,
        outboundFiles,
        inboundFiles,
      },
    },
  };

  cached = { signature, data: result };
  return result;
}


