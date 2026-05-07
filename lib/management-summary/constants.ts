import type { ManagementSummaryExportPayload } from "./types";

export const MANAGEMENT_SUMMARY_SESSION_KEY = "qos-et-management-summary-export";

/** Sections currently rendered by the dashboard PDF builder. */
export const EXPORTABLE_SECTION_IDS = [
  "executive",
  "chart-notifications-month",
  "chart-defects-month",
  "chart-notifications-type",
  "customer-ppm",
  "supplier-ppm",
  "plant-pages",
] as const;

export type ExportableSectionId = (typeof EXPORTABLE_SECTION_IDS)[number];

export const DEFAULT_EXPORT_SECTION_IDS: string[] = [...EXPORTABLE_SECTION_IDS];

/**
 * Reporting period used for the management summary defaults to the **previous**
 * calendar month relative to a reference date. Example: a report generated in
 * May 2026 represents April 2026 (closed month).
 */
export interface ReportMonthInfo {
  /** YYYY-MM key, e.g. "2026-04" */
  key: string;
  /** "April" */
  monthLong: string;
  /** "Apr" */
  monthShort: string;
  /** 2026 */
  year: number;
  /** "April 2026" */
  label: string;
  /** "Apr 2026" */
  shortLabel: string;
}

export function getReportMonthInfo(reference: Date = new Date()): ReportMonthInfo {
  const previous = new Date(reference.getFullYear(), reference.getMonth() - 1, 1);
  const year = previous.getFullYear();
  const monthIndex = previous.getMonth();
  const key = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
  const monthLong = new Intl.DateTimeFormat("en-GB", { month: "long" }).format(previous);
  const monthShort = new Intl.DateTimeFormat("en-GB", { month: "short" }).format(previous);
  return {
    key,
    monthLong,
    monthShort,
    year,
    label: `${monthLong} ${year}`,
    shortLabel: `${monthShort} ${year}`,
  };
}

export function getRecommendedManagementSummaryTitle(monthLabel: string, year: number): string {
  return `Management Summary QOS ET Report ${monthLabel} ${year}`;
}

export function createDefaultPayload(
  partial?: Partial<ManagementSummaryExportPayload>
): ManagementSummaryExportPayload {
  const reportMonth = getReportMonthInfo();
  return {
    version: 1,
    title: getRecommendedManagementSummaryTitle(reportMonth.monthLong, reportMonth.year),
    plantCodes: partial?.plantCodes ?? [],
    plantRemarks: partial?.plantRemarks ?? {},
    sectionIds: partial?.sectionIds?.length ? partial.sectionIds : [...DEFAULT_EXPORT_SECTION_IDS],
    reportMonthKey: partial?.reportMonthKey ?? reportMonth.key,
  };
}
